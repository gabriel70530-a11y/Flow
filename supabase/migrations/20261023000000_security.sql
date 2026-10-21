-- Endurece o banco: gravação só pela regra de sincronização, limite de registros por conta e inscrições de push
-- que só apontam para os serviços de push dos navegadores.

-- O app grava só por push_records. Sem insert/update direto, ninguém pula a regra da mudança mais recente
-- nem o limite de registros abaixo.
revoke insert, update on public.records from authenticated;
drop policy "Cada conta grava só os próprios registros" on public.records;
drop policy "Cada conta atualiza só os próprios registros" on public.records;

-- Anos de estudo diário ficam bem abaixo disso; o limite só impede que uma conta encha o banco.
create or replace function public.push_records(changes jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account uuid := auth.uid();
begin
  if account is null then
    raise exception 'not authenticated';
  end if;
  if jsonb_typeof(changes) <> 'array' then
    raise exception 'changes must be an array';
  end if;
  if jsonb_array_length(changes) > 500 then
    raise exception 'too many records';
  end if;

  insert into public.records as existing (user_id, collection, id, data, deleted, updated_at, synced_at)
  select account, incoming.collection, incoming.id, case when incoming.deleted then null else incoming.data end,
         coalesce(incoming.deleted, false), least(incoming.updated_at, now() + interval '5 minutes'), clock_timestamp()
  from jsonb_to_recordset(changes) as incoming (collection text, id text, data jsonb, deleted boolean, updated_at timestamptz)
  on conflict (user_id, collection, id) do update
    set data = excluded.data, deleted = excluded.deleted, updated_at = excluded.updated_at, synced_at = excluded.synced_at
    where existing.updated_at < excluded.updated_at;

  if (select count(*) from public.records where user_id = account) > 60000 then
    raise exception 'record limit reached';
  end if;
end;
$$;

revoke execute on function public.push_records(jsonb) from public, anon;
grant execute on function public.push_records(jsonb) to authenticated;

-- O servidor manda um POST para o endereço da inscrição: só os serviços de push dos navegadores são aceitos,
-- para ninguém usar a função de lembretes para chamar outro endereço.
create function public.is_push_endpoint(endpoint text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+(\.[a-z0-9-]+)*\.(notify\.windows\.com|push\.apple\.com))/'
    and char_length(endpoint) <= 1000;
$$;

alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_check check (public.is_push_endpoint(endpoint)) not valid;

create or replace function public.save_push_subscription(
  sub_endpoint text,
  sub_p256dh text,
  sub_auth text,
  sub_time time,
  sub_time_zone text,
  sub_study_days boolean[]
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account uuid := auth.uid();
begin
  if account is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_push_endpoint(sub_endpoint) then
    raise exception 'invalid push endpoint';
  end if;
  if sub_p256dh !~ '^[A-Za-z0-9_-]+$' or sub_auth !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'invalid push keys';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = sub_time_zone) then
    raise exception 'invalid time zone';
  end if;
  if (select count(*) from public.push_subscriptions where user_id = account and endpoint <> sub_endpoint) >= 10 then
    raise exception 'too many devices';
  end if;

  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, reminder_time, time_zone, study_days, updated_at)
  values (sub_endpoint, account, sub_p256dh, sub_auth, sub_time, sub_time_zone, sub_study_days, now())
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, reminder_time = excluded.reminder_time,
        time_zone = excluded.time_zone, study_days = excluded.study_days, updated_at = now(),
        last_sent = case when push_subscriptions.reminder_time = excluded.reminder_time then push_subscriptions.last_sent end;
end;
$$;

revoke all on function public.save_push_subscription from public, anon;
grant execute on function public.save_push_subscription to authenticated;

-- A IA saiu do app: as funções de reserva de uso não têm mais quem as chame.
drop function public.reserve_ai_use(uuid, text, text, integer);
drop function public.release_ai_use(uuid, text, text);
