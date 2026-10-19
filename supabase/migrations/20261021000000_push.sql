-- Lembretes de estudo por Web Push: uma inscrição por navegador, com o horário, o fuso e os dias de estudo da pessoa.
-- A função send-reminders roda a cada minuto pelo pg_cron e manda os avisos (1 hora antes, 30 minutos antes e na hora).

create table public.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) <= 1000),
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  reminder_time time not null,
  time_zone text not null check (char_length(time_zone) <= 64),
  study_days boolean[] not null check (array_length(study_days, 1) = 7),
  -- Último aviso enviado (flow-lembrete-AAAA-MM-DD-minutos): o mesmo nunca sai duas vezes.
  last_sent text,
  updated_at timestamptz not null default now()
);

create index push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Cada conta vê as próprias inscrições"
  on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Cada conta apaga as próprias inscrições"
  on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;

-- O endereço de push é do navegador: quem entra com outra conta no mesmo aparelho passa a ser o dono da inscrição.
create function public.save_push_subscription(
  sub_endpoint text,
  sub_p256dh text,
  sub_auth text,
  sub_time time,
  sub_time_zone text,
  sub_study_days boolean[]
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, reminder_time, time_zone, study_days, updated_at)
  values (sub_endpoint, auth.uid(), sub_p256dh, sub_auth, sub_time, sub_time_zone, sub_study_days, now())
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, reminder_time = excluded.reminder_time,
        time_zone = excluded.time_zone, study_days = excluded.study_days, updated_at = now(),
        last_sent = case when push_subscriptions.reminder_time = excluded.reminder_time then push_subscriptions.last_sent end;
$$;

revoke all on function public.save_push_subscription from public, anon;
grant execute on function public.save_push_subscription to authenticated;

-- A cada minuto, chama a função de envio. O endereço do projeto e o segredo ficam no Vault, fora do repositório:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<segredo aleatório>', 'reminders_secret');  -- o mesmo valor de REMINDERS_SECRET na função
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'flow-lembretes',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reminders-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
