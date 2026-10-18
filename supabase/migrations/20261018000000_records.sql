-- Dados de estudo de cada conta, um registro por item (tópico, sessão, tarefa...), como em lib/sync.ts.

create table public.records (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collection text not null check (
    collection in ('topics', 'sessions', 'tasks', 'mistakes', 'mockExams', 'essays', 'repertoire', 'progress', 'ajustes')
  ),
  id text not null check (char_length(id) between 1 and 80),
  data jsonb check (data is null or pg_column_size(data) <= 20000),
  deleted boolean not null default false,
  -- Quando a mudança foi feita no aparelho: decide conflitos entre aparelhos.
  updated_at timestamptz not null,
  -- Quando chegou ao servidor: é o cursor de "o que mudou desde a última sincronização".
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, collection, id)
);

create index records_user_synced on public.records (user_id, synced_at);

alter table public.records enable row level security;

create policy "Cada conta lê só os próprios registros"
  on public.records for select to authenticated
  using (user_id = (select auth.uid()));

-- O app grava por push_records, que aplica a regra da mudança mais recente. Apagar é marcar deleted,
-- então ninguém apaga linhas direto; elas só saem com a conta.
revoke all on public.records from anon;
revoke delete on public.records from authenticated;
grant select, insert, update on public.records to authenticated;

create policy "Cada conta grava só os próprios registros"
  on public.records for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Cada conta atualiza só os próprios registros"
  on public.records for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.push_records(changes jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if jsonb_array_length(changes) > 500 then
    raise exception 'too many records';
  end if;

  insert into public.records as existing (user_id, collection, id, data, deleted, updated_at, synced_at)
  select auth.uid(), incoming.collection, incoming.id, case when incoming.deleted then null else incoming.data end, incoming.deleted,
         least(incoming.updated_at, now() + interval '5 minutes'), clock_timestamp()
  from jsonb_to_recordset(changes) as incoming (collection text, id text, data jsonb, deleted boolean, updated_at timestamptz)
  on conflict (user_id, collection, id) do update
    set data = excluded.data, deleted = excluded.deleted, updated_at = excluded.updated_at, synced_at = excluded.synced_at
    where existing.updated_at < excluded.updated_at;
end;
$$;

grant execute on function public.push_records(jsonb) to authenticated;

-- Exclusão da conta pelo próprio usuário (LGPD). Os registros saem junto, pelo on delete cascade.
create function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
