# Flow

Sua preparação para o ENEM, no ritmo certo. Organizador de estudos: matérias personalizáveis, semana organizada com até 2 matérias por dia (sem limite de horas), "Estudar hoje" no painel, timer Pomodoro ou cronômetro, revisões espaçadas (1, 7, 15 e 30 dias) e estatísticas a partir das sessões registradas.

Não é cursinho, não promete nota nem aprovação e não tem vínculo com o INEP ou o MEC.

## Como rodar

Precisa do Node.js 22.12 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A página inicial é o site; o app começa em `/painel`.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local |
| `npm run build` e `npm start` | build de produção e servidor |
| `npm run lint` | ESLint |
| `npm test` | Vitest: datas, tópicos, revisões, sessões, cronograma, estatísticas, planos, simulado oficial, idade, sincronização, migração e store |

## Telas

- `/` landing, `/privacidade`, `/termos`: site público.
- `/painel`: "Estudar hoje", semana com meta (horas, sessões ou tópicos), resumo, por área e próximas revisões.
- `/cronograma`: matérias dos próximos 7 dias, até 2 por dia de estudo, sempre do mesmo assunto (mesma área ou, em Natureza e Humanas, mesma matéria). O que não foi estudado passa sozinho para o próximo dia; o que não foi dominado se repete no dia seguinte.
- `/materias`: as cinco áreas do ENEM, com Natureza (Química, Física, Biologia) e Humanas (Geografia, História, Filosofia, Sociologia) divididas em matérias. Nenhum tópico vem pronto: o estudante cria os próprios. Ao criar, aparecem sugestões do que mais cai em cada área ou matéria (só preenchem o nome). Busca, filtros, ordenação, editar, ocultar e excluir.
- `/timer`: Pomodoro e cronômetro, estudo geral, reflexão pós-sessão, sessões de hoje.
- `/revisoes`: atrasadas, hoje, próximos 7 dias e futuras; concluir com feedback, adiar e reagendar. "Agendar revisões do que já estudei" marca tópicos já estudados e agenda as revisões. `/revisoes/erros`: caderno de erros, com cada erro voltando em 1, 7, 15 e 30 dias.
- `/simulados`: simulado no app (Pro) com a prova oficial do Inep: as questões aparecem na tela (Enem 2023) ou, nas provas que ainda não estão no app, o PDF oficial com cartão-resposta; dia inteiro ou uma área, cronômetro, mapa das questões, "Rever depois" e correção pelo gabarito oficial. Também registra os simulados feitos fora do app; acertos por área, ritmo e, nas provas feitas no app, a nota estimada pela TRI com os parâmetros oficiais dos itens (microdados do Inep). `/redacao`: correção estimada por IA (Pro), notas por competência e repertório pessoal. `/prova`: checklist do dia da prova.
- No Painel: reta final (contagem e prioridade para revisões nas 4 semanas antes da prova) e "Dia leve" para dias cansativos. No Timer: modo foco.
- `/comecar`: configuração inicial opcional. `/ajustes`: preferências, meta, cronograma, conta e backup. `/planos`: gratuito e Pro, assinatura e cancelamento.

## Questões do simulado

As provas que aparecem dentro do app ficam em `public/provas/<ano>/<dia>.json`, com as imagens em `public/provas/<ano>/img`. O gabarito não vai nesses arquivos: a correção usa sempre o gabarito oficial transcrito em `lib/official-exams.ts`.

- **Enem 2023 (caderno azul):** texto e imagens vieram da base pública [enem.dev](https://enem.dev) (projeto `yunger7/enem-api`, licença GPL-2.0) e foram conferidos contra o gabarito oficial do Inep: todas as respostas batem, exceto a 164, que o Inep anulou. As questões 34 e 174, que faltam na base, e a 132, que veio sem os gráficos das alternativas, foram transcritas e recortadas da prova oficial em PDF.
- **Enem 2022 (caderno azul; o 2º dia é o caderno 7):** mesma base, conferida contra o gabarito oficial: batem todas, exceto a 157, que o Inep anulou, e a 143, em que a base traz a resposta errada (as figuras estão na ordem da prova; vale o gabarito do Inep). Corrigido a partir da prova oficial em PDF: as alternativas das questões 144 e 166 (a base perdeu a alternativa A), a alternativa E da 60, o texto de abertura da 176, o início da 109, um trecho repetido na 152 e lixo de OCR na 159. As alternativas da 95 foram recortadas do PDF.
- O teste `lib/exam-files.test.ts` confere as 90 questões de cada dia, as cinco alternativas e se toda imagem existe.
- **Direito autoral:** os textos de apoio das questões (reportagens, poemas, charges, fotos) têm autores próprios. Mostrar as questões dentro de um app pago foi uma decisão consciente, com risco; vale um parecer jurídico antes de abrir a assinatura.
- Ao começar a prova, o app pede todas as imagens; o service worker guarda e a prova continua sem internet.

## Gratuito e Pro

O que entra em cada plano está em `lib/plan.ts` (`FREE_FEATURES` e `PRO_FEATURES`). Nada que a pessoa já salvou some sem o Pro: o recurso do Pro aparece com um aviso discreto (`ProNotice`) no lugar.

- **Gratuito:** áreas e tópicos, timer, revisões agendadas pela própria pessoa (uma data por vez, em Revisões), registro de simulados e redações, cronograma à mão e Painel com as últimas 4 semanas.
- **Pro:** revisões agendadas sozinhas (1, 7, 15 e 30 dias) ao concluir um tópico, sugestões do que mais cai, semana montada sozinha, caderno de erros (no gratuito, os erros já salvos ficam só para leitura), resumo e histórico completos, simulado no app, correção de redação (até 8 por mês) e análise de erros (até 60 por mês) com IA.
- O acesso vem só do servidor (tabela `entitlements`, gravada pelo webhook do pagamento). O app guarda uma cópia por conta em `enem-flow:pro:<usuário>` para valer sem internet até `pro_until`.
- `NEXT_PUBLIC_PRO_TRIAL=true` (no app) e `PRO_TRIAL=true` (nas funções) liberam o Pro para todos durante testes com estudantes.

## Onde ficam os dados

Tudo fica no `localStorage` do navegador, na chave `enem-flow:v2`, e uma cópia vai para a conta (ver abaixo). A conta é obrigatória: sem login, o app mostra a tela de entrar. No desenvolvimento local sem as variáveis do Supabase, o app abre direto, sem conta.

- Na primeira abertura, se existir a chave `enem-flow:v1` (formato do protótipo), os dados são migrados para a v2 e a v1 fica intacta como cópia de segurança.
- Conta nova começa vazia, sem dados de exemplo. Dados de exemplo salvos por versões antigas continuam com o aviso "Apagar e começar do zero".
- Se o JSON salvo estiver corrompido, o texto bruto vai para `enem-flow:v2:corrompido` e o app começa do zero.
- Se o navegador recusar a gravação, um aviso aparece com "Tentar de novo".
- Em produção, o app funciona offline depois da primeira visita (service worker em `public/sw.js`).
- Em Ajustes dá para baixar um backup (JSON) e importar em outro navegador.

### Conta e sincronização

A tela de entrar oferece e-mail e senha (com confirmação do e-mail e "Esqueci minha senha") e "Entrar com Google". Criar conta pede o ano de nascimento (mínimo de 13 anos; menores de 18 confirmam que um responsável sabe) e o aceite de privacidade e termos. Quem entra pelo Google responde o ano e o aceite logo depois do primeiro login. Ajustes mostra a conta, troca de senha, sair e excluir.

- Cada item (tópico, sessão, tarefa, erro, simulado, redação, repertório, progresso de um tópico) vira um registro na tabela `records`, com `updated_at` do aparelho. Algumas preferências também vão (meta, cronograma, onboarding, checklist da prova, sequência); tema, som, consentimento de métricas e o timer ficam em cada aparelho.
- A lógica de juntar fica em `lib/sync.ts` (funções puras e testadas); `store/cloud.ts` faz login, envia e busca.
- No primeiro login, o que está no aparelho se junta ao que está na conta. Se os dois têm o mesmo registro, vence a conta. Dados de exemplo nunca sobem.
- Depois, vence a mudança mais recente de cada registro. Apagar vira uma marca (`deleted`) para os outros aparelhos saberem.
- Sincroniza alguns segundos depois de cada mudança, ao voltar para a aba, ao voltar a internet e a cada 2 minutos. Sem internet, guarda as mudanças pendentes em `enem-flow:v2:sync:<usuário>` e envia depois.
- Outra conta entrando no mesmo aparelho começa com os dados dela, sem misturar com os da conta anterior.
- "Excluir conta" chama `delete_account()`, que apaga o usuário e os registros. Os dados do aparelho ficam.

Para ativar (precisa de uma conta no Supabase, feita pelo responsável pelo projeto):

1. Criar um projeto na região São Paulo (`sa-east-1`).
2. Rodar `supabase/migrations/20261018000000_records.sql` no SQL Editor (ou `supabase db push`).
3. Em Authentication: deixar o provedor Email ativo, com "Confirm email" ligado. Em URL Configuration, pôr o endereço do site como Site URL e `<endereço>/painel` e `<endereço>/ajustes` nas Redirect URLs (também os de `http://localhost:3000` para testar).
   Para "Entrar com Google": criar um cliente OAuth (Aplicativo da Web) no Google Cloud, com `https://<projeto>.supabase.co/auth/v1/callback` como URI de redirecionamento, e colar o ID e a chave secreta em Authentication > Providers > Google.
4. Preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (a chave pública) no `.env.local` e na hospedagem.
5. Para produção, configurar um SMTP próprio (ex.: Resend): o envio padrão do Supabase tem limite baixo por hora.

## Configuração opcional

Copie `.env.example` para `.env.local` e preencha o que quiser. Sem as variáveis, o app funciona e só esconde o que depende delas.

| Variável | Efeito |
|---|---|
| `NEXT_PUBLIC_PRO_INTEREST_URL` | link https para a lista de interesse do Pro (ex.: formulário). Sem ela, a tela diz que a lista ainda não está aberta. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | e-mail de contato no rodapé do site. |
| `NEXT_PUBLIC_ANALYTICS_URL` | endpoint https que recebe eventos anônimos. Só envia se o estudante ativar em Ajustes. |
| `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ativam a conta e a sincronização. Sem elas, em produção o app diz que a conta não está disponível; no desenvolvimento local, abre sem conta. |
| `NEXT_PUBLIC_PRO_TRIAL` | `true` libera o Pro para todos (testes com estudantes). Use junto com `PRO_TRIAL=true` nas funções. |
| `NEXT_PUBLIC_PAYMENTS_OPEN` | `true` mostra os botões de assinar em Planos. Só ligue com o pagamento configurado (ver abaixo). |
| `NEXT_PUBLIC_SITE_URL` | endereço público do site (ex.: `https://flow.exemplo.com`), usado no sitemap, no robots e nos cartões de compartilhamento. Só é preciso com domínio próprio: na Vercel, sem ela, vale o endereço de produção do projeto (hoje `https://flow-black.vercel.app`); fora da Vercel, `http://localhost:3000`. |
| `APP_OPEN` | `true` abre o app na produção da Vercel. Sem ela, a produção é só vitrine: página inicial, privacidade e termos, com "Em breve" no lugar dos botões, e as telas do app voltam para a página inicial. Local e prévias da Vercel ficam sempre abertos. Mudar exige publicar de novo. |

## Pagamento e IA (funções do Supabase)

O estudo de custos e a arquitetura estão em `docs/plano-pro.md`. As funções ficam em `supabase/functions` (Deno) e guardam as chaves secretas, que nunca vão para o navegador.

| Função | O que faz |
|---|---|
| `checkout` | cria a assinatura mensal (`/preapproval`, no cartão) ou o pagamento anual (`/checkout/preferences`, Pix ou cartão) no Mercado Pago e devolve o link de pagamento |
| `mercadopago-webhook` | confere a assinatura do aviso, consulta o pagamento na API e grava `entitlements` (mensal: até a próxima cobrança + 3 dias; anual: +365 dias). Cada pagamento é aplicado uma vez só (tabela `payments`) |
| `cancel-subscription` | cancela a assinatura mensal; o Pro vale até o fim do período pago |
| `ai-essay` | corrige a redação (texto ou até 2 fotos) com o Claude Sonnet 5.5: nota estimada por competência |
| `ai-mistake` | analisa uma questão errada (texto ou 1 foto) com o Claude Haiku 5.5 e preenche o formulário do caderno |

As funções de IA conferem login, Pro e o limite do mês (`reserve_ai_use`, tabela `ai_usage`) antes de chamar a IA e devolvem o uso se a chamada falhar.

Para ativar:

1. Rodar `supabase/migrations/20261019000000_pro.sql` (tabelas `entitlements`, `payments` e `ai_usage`).
2. Configurar os segredos: `supabase secrets set MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=... APP_URL=https://<endereço> ANTHROPIC_API_KEY=...` (e `PRO_TRIAL=true` durante testes abertos).
3. Publicar: `supabase functions deploy checkout cancel-subscription ai-essay ai-mistake` e `supabase functions deploy mercadopago-webhook --no-verify-jwt` (quem chama o webhook é o Mercado Pago, sem login).
4. No Mercado Pago (Suas integrações > Webhooks), cadastrar `https://<projeto>.supabase.co/functions/v1/mercadopago-webhook` com os eventos de pagamentos e de planos e assinaturas, e copiar a assinatura secreta para `MP_WEBHOOK_SECRET`.
5. Testar com as credenciais e contas de teste do Mercado Pago antes de usar as de produção.
6. Só então pôr `NEXT_PUBLIC_PAYMENTS_OPEN=true` na hospedagem: é o que mostra os botões de assinar.

Conferência local: `deno check` e `deno lint` passam dentro de `supabase/functions`. As funções ainda não foram testadas de ponta a ponta contra o Supabase, o Mercado Pago e a API da Anthropic.

## Lembretes por push

A função `send-reminders` manda os avisos de estudo com o app fechado (Web Push com VAPID, sem dependências: `_shared/webpush.ts`). Sem ela, os avisos aparecem só com o Flow aberto.

1. Rodar `supabase/migrations/20261020000000_study_tools.sql` (blocos e cartões na sincronização) e `20261021000000_push.sql` (tabela `push_subscriptions`).
2. Gerar as chaves: `deno run supabase/functions/_shared/generate_vapid.ts`. A pública vai em `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Vercel e `.env.local`).
3. Segredos da função: `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=https://<endereço> REMINDERS_SECRET=<aleatório>`.
4. Publicar: `supabase functions deploy send-reminders --no-verify-jwt`.
5. Criar no Vault `project_url` e `reminders_secret` (o mesmo valor de `REMINDERS_SECRET`) e rodar `supabase/cron/lembretes.sql`.

## O que ainda depende de decisão ou serviço externo

**Para publicar esta versão, na ordem:** (1) rodar no Supabase as migrações `20261019000000_pro.sql`, `20261020000000_study_tools.sql` e `20261021000000_push.sql` (sem elas, a sincronização de cartões e blocos falha); (2) na Vercel, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e, se for abrir o app, `APP_OPEN=true` (e `NEXT_PUBLIC_PRO_TRIAL=true` para testar o Pro com estudantes); (3) para o login com Google, ativar o provedor no Supabase e pôr `NEXT_PUBLIC_GOOGLE_LOGIN=true` (sem ela, o botão não aparece); (4) dar push na `main`; (5) os lembretes por push, acima.

- **Cobrança do Flow Pro.** O código de pagamento existe (ver acima), mas falta criar a conta no Mercado Pago, configurar os segredos, testar com contas de teste e abrir com `NEXT_PUBLIC_PAYMENTS_OPEN`. Até lá, Planos diz que ainda não é possível assinar; nada é vendido nem simulado.
- **IA no Pro.** Falta a chave da API da Anthropic (`ANTHROPIC_API_KEY`), com limite de gasto configurado no console. Sem ela, as funções respondem que a IA ainda não está disponível.
- **Play Store.** Planejado como app TWA do próprio site, sem venda dentro do app (ver `docs/plano-pro.md`).
- **Coleta de métricas para a validação com 20 a 30 estudantes.** O app emite `app_aberto`, `onboarding_concluido`, `onboarding_pulado`, `plano_gerado`, `sessao_registrada`, `revisao_concluida` e `pro_interesse`, com o dia e um código aleatório do navegador. Falta um endpoint que receba esses eventos (ver `NEXT_PUBLIC_ANALYTICS_URL`) e uma forma de coletar motivos de abandono (entrevista ou formulário). Intenção declarada na lista de interesse não é compra.
- **Política de privacidade e termos.** As páginas descrevem o funcionamento real do app, mas são uma versão preliminar: revisar com orientação jurídica antes de abrir ao público, inclusive pelos cuidados com menores de idade (LGPD).
- **Contato.** Definir um e-mail de suporte e configurar `NEXT_PUBLIC_CONTACT_EMAIL`.
