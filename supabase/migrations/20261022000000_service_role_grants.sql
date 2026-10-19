-- Com "expor tabelas novas automaticamente" desligado no Data API, as tabelas não dão permissão nenhuma ao
-- service_role. As funções do servidor (pagamento, IA e lembretes) leem e gravam com ele.

grant select, insert, update, delete on public.entitlements to service_role;
grant select, insert, update, delete on public.payments to service_role;
grant select, insert, update, delete on public.ai_usage to service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
