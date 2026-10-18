-- Assinatura Pro de cada conta. Só as funções do servidor (chave secreta) gravam aqui, depois de confirmar o pagamento
-- na API do Mercado Pago. O app só lê a própria linha.

create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('mensal', 'anual')),
  status text not null check (status in ('ativa', 'cancelada')),
  -- O Pro vale até aqui, mesmo depois de cancelar: o período já foi pago.
  pro_until timestamptz not null,
  -- Id da assinatura (mensal) ou do pagamento (anual) no Mercado Pago.
  provider_ref text,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

create policy "Cada conta lê só a própria assinatura"
  on public.entitlements for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

-- Pagamentos já aplicados: o Mercado Pago repete avisos, e o mesmo pagamento nunca soma tempo duas vezes.
create table public.payments (
  provider_payment_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('mensal', 'anual')),
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;

-- Uso da IA por mês, para o limite do Pro (8 correções de redação e 60 análises de erro).
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  kind text not null check (kind in ('redacao', 'erro')),
  used integer not null default 0 check (used >= 0),
  primary key (user_id, month, kind)
);

alter table public.ai_usage enable row level security;

create policy "Cada conta lê só o próprio uso"
  on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

-- Reserva um uso antes de chamar a IA, numa operação só, para dois pedidos ao mesmo tempo não passarem do limite.
-- Devolve quantos usos restam depois da reserva, ou -1 se o limite do mês já foi atingido.
create function public.reserve_ai_use(target_user uuid, target_month text, target_kind text, monthly_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_used integer;
begin
  insert into public.ai_usage as usage (user_id, month, kind, used)
  values (target_user, target_month, target_kind, 1)
  on conflict (user_id, month, kind) do update
    set used = usage.used + 1
    where usage.used < monthly_limit
  returning used into current_used;
  if current_used is null then
    return -1;
  end if;
  return monthly_limit - current_used;
end;
$$;

-- Se a IA falhar, o uso reservado volta.
create function public.release_ai_use(target_user uuid, target_month text, target_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage set used = greatest(used - 1, 0)
  where user_id = target_user and month = target_month and kind = target_kind;
$$;

revoke execute on function public.reserve_ai_use(uuid, text, text, integer) from public, anon, authenticated;
revoke execute on function public.release_ai_use(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_use(uuid, text, text, integer) to service_role;
grant execute on function public.release_ai_use(uuid, text, text) to service_role;
