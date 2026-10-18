# Roadmap da próxima fase do Flow

Pedido do Gabriel em 18/10/2026. A ordem abaixo é a sugerida: cada etapa destrava a seguinte. Os itens marcados **(novo)** não estavam no pedido original e foram incluídos por serem necessários. Decisões que dependem de dinheiro, de conta ou de dados pessoais do Gabriel precisam da aprovação dele antes.

## Situação atual

- Next.js 16 sem backend. Os dados ficam só no `localStorage`, na chave `enem-flow:v2`.
- Publicado na Vercel (plano Hobby) em https://flow-black.vercel.app, a partir de github.com/gabriel70530-a11y/Flow. Cada push na `main` publica sozinho.
- O Pro (R$ 19,90/mês) é só um preço experimental: está tudo liberado e nada é cobrado (`lib/plan.ts`).
- Já existem a camada de métricas com consentimento (`store/analytics.ts`), o backup em JSON e o service worker para uso offline.

## Etapa 0: estudo de custos e escolhas (antes de programar)

Itens 2 e 5 do pedido. Entregável: um documento comparativo com os custos mensais em 3 cenários (100, 1.000 e 10.000 usuários ativos) e uma recomendação.

- **Hospedagem do site**
  - Vercel Hobby, Vercel Pro (US$ 20/mês) e Cloudflare Pages/Workers (camada grátis generosa), além de Netlify.
  - **(novo) Atenção:** o plano Hobby da Vercel **proíbe uso comercial**. Quando houver cobrança, é preciso migrar para o Pro ou para a Cloudflare.
- **Banco de dados e login**
  - Supabase (Postgres, autenticação e Row Level Security; o plano grátis pausa o projeto depois de 7 dias sem uso).
  - Firebase (Auth e Firestore; grátis no plano Spark).
  - Cloudflare D1 com outro provedor de login.
  - Neon e Turso.
  - Comparar limites grátis, preço ao crescer, região mais perto do Brasil (latência) e facilidade de exportar os dados.
- **Domínio**
  - O `flowestudos.com.br` estava livre em 18/10/2026, assim como `flowestudo.com.br` e `estudecomflow.com.br`. Custa cerca de R$ 40/ano no Registro.br; confirmar o preço.
  - Verificar de novo e comparar com `.app` e `.com`. O registro é feito pelo Gabriel, com o CPF dele.
- **Pagamento** **(novo)**
  - Comparar Mercado Pago, Asaas, Stripe Brasil, Pagar.me e Abacate Pay: taxas de Pix e cartão, assinatura recorrente, webhooks e exigência de CNPJ.
- **Formalização** **(novo)**
  - Vender assinatura exige emitir nota. Avaliar MEI (CNAE compatível com software/SaaS?) ou outra opção.
  - Ver se uma pessoa menor de idade pode ser titular. Isso é uma decisão do Gabriel; o estudo só levanta as opções.
- **Preço da assinatura** (item 5)
  - Calcular o custo por usuário: hospedagem, banco, e-mail transacional, taxas de pagamento e a taxa de 15% da Play Store se a cobrança for feita lá.
  - Comparar com concorrentes: Descomplica, Aprova Total (cerca de R$ 83/mês), Estuda.com e o app gratuito do MEC.
  - Sugerir um preço não abusivo: por exemplo, uma faixa de R$ 6,90 a R$ 12,90/mês, um plano anual com desconto e o plano gratuito sempre útil.
  - O que é grátis hoje continua grátis (regra do CLAUDE.md).

## Etapa 1: contas e dados na nuvem (item 1)

- **Login**
  - Login com Google e por e-mail com link mágico, de preferência sem senha.
  - O app precisa continuar funcionando **sem conta**: a conta é opcional e serve para backup e sincronização.
- **Migração do `localStorage`** **(novo)**
  - No primeiro login, enviar os dados locais e mesclar sem perder nada.
  - Resolver conflitos entre aparelhos usando `updatedAt` por registro.
  - Continuar funcionando offline e sincronizar depois.
- **Modelo no banco**
  - Tabelas por usuário: tópicos, progresso, sessões, tarefas, erros, simulados, redações e preferências.
  - Usar RLS: cada um só lê e escreve os próprios dados.
- **LGPD e menores de idade** **(novo)**
  - Muitos usuários têm menos de 18 anos.
  - Atualizar a política de privacidade e os termos: hoje eles dizem que não há servidor.
  - Pedir o consentimento adequado, oferecer exportação e exclusão da conta e coletar o mínimo de dados.
- **Segurança** **(novo)**
  - Colocar o acesso Pro no servidor (`lib/plan.ts` já prevê isso).
  - Rate limit no login.
  - Backups automáticos do banco.

## Etapa 2: assinatura (itens 1 e 5)

- Integrar o provedor escolhido: checkout, webhook de pagamento confirmado ou cancelado, e o status Pro guardado no banco.
- Tela de planos com preço real, cancelamento fácil dentro do app, reembolso de 7 dias (CDC, art. 49) e recibo por e-mail.
- **Nunca** simular compra. Testar só em modo de teste (sandbox).

## Etapa 3: ranking e motivação (item 3)

O produto é "sem culpa", e um ranking de horas pode gerar pressão e burnout (ver o dossiê em `docs/pesquisa`). Sugestão:

- **Participação:** opcional, com apelido e sem nome real nem foto. Menores de idade ficam protegidos.
- **O que conta:** constância (dias com estudo na semana) e revisões em dia, não só horas. Com teto de horas diárias que contam, para não premiar a exaustão.
- **Formato:** ligas semanais pequenas (por exemplo, 30 pessoas), que recomeçam toda segunda. Também um ranking entre amigos por código de convite.
- **Antifraude:** só contam sessões do timer, com limite de sessões por dia, e marcar tempos implausíveis.
- Depende da Etapa 1, porque o ranking precisa de servidor.

## Etapa 4: chegar ao público e aguentar o crescimento (item 4)

- **Play Store**
  - Empacotar o PWA como TWA (Bubblewrap ou PWABuilder): o mesmo código, sem reescrever.
  - A conta de desenvolvedor custa US$ 25 uma vez.
  - Exige política de privacidade, classificação etária, formulário de segurança de dados e, desde 2023, teste fechado com 12 testadores por 14 dias em contas pessoais novas.
  - **(novo)** Se a assinatura for vendida dentro do app Android, o Google exige o faturamento da Play (taxa de 15%). Avaliar a cobrança só pelo site.
- **App Store (iOS):** **(novo)** custa US$ 99/ano e exige um Mac ou um serviço de build. Deixar para depois; no iPhone, o PWA instalado pelo Safari já funciona.
- **Escala**
  - Site estático com CDN e banco gerenciado aguentam bem os picos (por exemplo, a véspera do Enem).
  - Medir com teste de carga simples antes de divulgar.
  - Configurar alertas de uso e de custo para não ser surpreendido por conta alta.
- **Divulgação**
  - SEO da landing, com páginas por assunto do Enem.
  - Conteúdo curto no TikTok, Instagram e YouTube (trends de estudo).
  - Parcerias com cursinhos populares e grêmios estudantis.
  - Indicação ("convide um amigo").
  - Página de imprensa e Google Search Console.
- **Medir** **(novo):** ativar as métricas que já existem com um endpoint real (por exemplo, Plausible ou PostHog, de graça até certo volume), para saber retenção e uso.
- **Suporte** **(novo):** e-mail de contato (`NEXT_PUBLIC_CONTACT_EMAIL`) e uma página de ajuda/FAQ.

## Outras pendências **(novo)**

- Atualizar `ENEM_DATES` (`lib/exam.ts`) quando o Inep divulgar as datas do Enem 2027.
- Notificações push com o lembrete do dia: exigem servidor; entram depois da Etapa 1.
- Lista de interesse do Pro (`NEXT_PUBLIC_PRO_INTEREST_URL`): um formulário simples já serve para validar o preço antes de cobrar.
- Acessibilidade e desempenho no celular de entrada (Android barato e 3G): medir com o Lighthouse antes da divulgação.
