-- Lembretes de estudo: chama a função send-reminders a cada minuto.
-- Antes, publique a função (sem verificação de JWT) e crie os dois segredos no Vault, fora do repositório.
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
