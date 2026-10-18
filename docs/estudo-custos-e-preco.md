# Estudo de custos, provedores e preço do Flow

Etapa 0 do `docs/roadmap-proxima-fase.md`. Pesquisa feita em 18/10/2026. Os preços em dólar usam **US$ 1 = R$ 5,50** (ajuste se o câmbio mudar). Taxas de pagamento mudam sem aviso: confirme na conta de cada provedor antes de assinar contrato.

## Resumo

- **Começo grátis é possível:** site na Cloudflare + banco e login no Supabase (região São Paulo). Custo fixo só do domínio, R$ 40/ano.
- **Quando começar a cobrar:** sair da Vercel Hobby (proíbe uso comercial) e pagar o Supabase Pro (US$ 25/mês, com backup diário).
- **Pagamento:** Mercado Pago é o que mais combina com assinatura barata (Pix 0,99%, aceita conta de pessoa física). Asaas e Stripe têm taxa fixa que pesa num plano de R$ 9,90.
- **Preço sugerido:** **R$ 9,90/mês** ou **R$ 79,90/ano** (R$ 6,66/mês). Bem abaixo dos concorrentes, e o grátis continua como está.
- **Domínio:** `flowestudos.com.br` continua livre.
- **Gargalo real não é a nuvem:** é a formalização. Software por assinatura provavelmente não cabe no MEI, e um contador custa mais por mês do que toda a infraestrutura.

## 1. Hospedagem do site

O Flow hoje não tem rota de servidor (`app/` só tem páginas, `manifest.ts`, `robots.ts` e `sitemap.ts`), então quase tudo é estático e barato de servir.

| Provedor | Grátis | Pago | Uso comercial no grátis | Observação |
|---|---|---|---|---|
| Vercel Hobby | 100 GB de transferência, 1 mi de funções e 1 mi de requisições por mês | — | **Não** ("personal, non-commercial use") | Bom enquanto nada é cobrado |
| Vercel Pro | — | US$ 20/mês (1 TB, 10 mi de requisições) | Sim | R$ 110/mês só para hospedar |
| Cloudflare Workers/Pages | Arquivos estáticos **ilimitados e grátis**; 100 mil requisições/dia de código, 10 ms de CPU | US$ 5/mês (10 mi de requisições, 30 mi ms de CPU) | Sem restrição nos termos | Next.js roda pelo adaptador OpenNext ou como export estático |
| Netlify | 300 créditos/mês (20 créditos por GB) | US$ 20/mês | Não informado; voltado a "Individual" | Mais caro por GB que os outros |

**Recomendação:** Cloudflare. É grátis com uso comercial, os arquivos estáticos não têm limite e o plano pago, se precisar, custa US$ 5.

## 2. Banco de dados e login

| Provedor | Grátis | Primeiro plano pago | Região perto do Brasil | Login pronto | Exportar dados |
|---|---|---|---|---|---|
| **Supabase** | 500 MB de banco, 50 mil usuários/mês no login, 5 GB de saída, 2 projetos; **pausa após 1 semana sem uso**; sem backup | Pro US$ 25/mês: 8 GB, 100 mil usuários, 250 GB de saída, backup diário de 7 dias | **São Paulo** (sa-east-1) | Sim (Google, link mágico, RLS) | Fácil: é Postgres |
| Firebase | Login grátis até 50 mil usuários/mês; Firestore 1 GB, 50 mil leituras e 20 mil gravações por dia | Blaze, por uso | São Paulo (southamerica-east1) | Sim | Mais difícil (NoSQL, formato próprio) |
| Cloudflare D1 | 5 GB, 5 mi de leituras e 100 mil gravações por dia | Incluso nos US$ 5 do Workers (50 mi de gravações/mês) | Sem região dedicada no Brasil | **Não**: precisa de uma biblioteca (ex.: Better Auth) e mais código | Fácil (SQLite) |
| Neon | 1 GB por projeto, 100 horas de CPU, login até 60 mil usuários/mês | Por uso, sem mínimo (US$ 0,106/hora de CPU, US$ 0,35/GB) | Não confirmada | Sim (Neon Auth) | Fácil (Postgres) |
| Turso | 5 GB, 500 mi de leituras e 10 mi de gravações/mês | US$ 4,99/mês | Não confirmada | Não | Fácil (SQLite) |

**Recomendação:** Supabase. Tem login com Google e link mágico prontos, regras de acesso por usuário (RLS), servidor em São Paulo e é Postgres comum, fácil de levar para outro lugar. A pausa do plano grátis só acontece sem nenhum uso por uma semana, o que não ocorre com usuários reais.

**Plano B mais barato em escala:** tudo na Cloudflare (Workers + D1 + Better Auth) por US$ 5/mês mesmo com 10 mil usuários. Custa mais trabalho de programação e manutenção do login. Vale considerar só se o Supabase Pro pesar.

### E-mail (link mágico e recibos)

- O Supabase manda e-mail de login de graça, mas com limite baixo por hora (serve para testes).
- Para produção: Resend, grátis até 3.000 e-mails/mês (100 por dia); depois US$ 20/mês para 50 mil.
- Login com Google não gasta e-mail. Deixar o Google como opção principal reduz esse custo.

## 3. Domínio

Verificado na API do Registro.br e no RDAP em 18/10/2026:

| Domínio | Situação |
|---|---|
| `flowestudos.com.br` | **Livre** |
| `flowestudo.com.br` | Livre |
| `estudecomflow.com.br` | Livre |
| `flowenem.com.br` | Livre (mas o ENEM não faz parte da marca) |
| `flowestudos.app.br` | Livre |
| `flowestudos.com` | Livre |
| `flowestudos.app` | Livre |
| `appflow.com.br`, `meuflow.com.br` | Ocupados |

- `.br` no Registro.br: **R$ 40/ano**, sem aumento na renovação, até 10 anos de uma vez. Exige CPF ou CNPJ brasileiro.
- `.com` e `.app` (registradores internacionais, como a própria Cloudflare): cerca de US$ 10 a 15/ano, em dólar. O `.app` exige HTTPS, que já é o caso.
- **Recomendação:** `flowestudos.com.br`. É o que o público brasileiro espera, é barato e fica com o CPF do Gabriel (ou o CNPJ, quando existir).

## 4. Pagamento no Brasil

Exemplo com uma cobrança de **R$ 9,90**:

| Provedor | Pix | Cartão de crédito | Custo em R$ 9,90 | Assinatura recorrente | CPF ou CNPJ |
|---|---|---|---|---|---|
| **Mercado Pago** | 0,99% (0,49% acima de R$ 15 mil/mês) | 4,98% na hora, 3,98% em 30 dias | Pix R$ 0,10; cartão R$ 0,39 a 0,49 | Sim (cartão; débito automático) | Aceita pessoa física (confirmar para assinaturas) |
| Asaas | R$ 1,99 fixo | R$ 0,49 + 2,99% | Pix R$ 1,99 (20%); cartão R$ 0,79 | Sim (cartão, boleto, carnê) | Tem cadastro de pessoa física (confirmar) |
| Stripe | 1,19% (só por convite) | 3,99% + R$ 0,39, mais 0,7% do Billing | Cartão R$ 0,86 | Sim, a melhor API | Não informado na página |
| Pagar.me (Stone) | 0,99% | 4,19% à vista | Pix R$ 0,10; cartão R$ 0,41 | Sim | **Exige CNPJ** (MEI serve) |
| Abacate Pay | R$ 0,80 fixo | Não publicado | Pix R$ 0,80 (8%) | Não confirmado | **Exige CNPJ** (MEI serve) |
| Faturamento da Play | — | — | **15% = R$ 1,49** | Sim | Conta de desenvolvedor |

- **Recomendação:** Mercado Pago. Menor custo em ticket baixo, aceita Pix e cartão, tem assinatura e webhook, e é conhecido pelo público. Pagar.me fica como alternativa quando houver CNPJ.
- Taxa fixa (Asaas, Abacate Pay) faz sentido no plano anual, não no mensal.
- **Pix Automático** (recorrente pelo Pix, lançado em 2025) reduz falhas de cartão. Verificar se o provedor escolhido já oferece.
- Todos têm modo de teste (sandbox). Nada será cobrado de verdade antes da aprovação do Gabriel.

## 5. Play Store

- Conta de desenvolvedor: **US$ 25 uma vez** (~R$ 140).
- O PWA vira app pela **TWA** (Bubblewrap ou PWABuilder): mesmo código, mais um arquivo `/.well-known/assetlinks.json` no domínio.
- Contas pessoais criadas depois de 13/11/2023: **teste fechado com 12 testadores por 14 dias seguidos** antes de publicar. Quem sai e volta zera a contagem.
- Exige política de privacidade, classificação etária, formulário de segurança de dados e público-alvo (muitos usuários são menores: as regras de "Famílias" podem se aplicar).
- **Assinatura dentro do app:** fora de EUA, Europa, Reino Unido, Japão e Austrália, a taxa da Play em assinaturas é **15%**. O Brasil aparece entre os países com faturamento alternativo (o usuário escolhe), com taxa um pouco menor.
- **Recomendação:** o app Android começa com tudo que é grátis, e o Pro é vendido só pelo site. Dentro do app não pode haver botão ou link para pagar fora da Play; a pessoa que já assinou no site entra com a conta e tem o Pro. Reavaliar a cobrança pela Play depois.
- App Store (iOS): US$ 99/ano e um Mac. Fica para depois; o PWA pelo Safari já funciona.

## 6. Custo mensal por cenário

Premissas por usuário ativo no mês: 40% usam em um dia qualquer; cerca de 0,5 MB de dados por ano de uso; o service worker evita baixar o app de novo. Conversão para o Pro estimada em 3%.

| Item | 100 usuários | 1.000 usuários | 10.000 usuários |
|---|---|---|---|
| Site (Cloudflare) | R$ 0 | R$ 0 | R$ 0 a 28 (Workers pago, só se usar código no servidor) |
| Banco e login (Supabase) | R$ 0 (grátis) | R$ 0 sem cobrança; **R$ 138** (Pro) quando cobrar, pelo backup e para não chegar perto dos 500 MB | R$ 138 |
| E-mail (Resend) | R$ 0 | R$ 0 | R$ 0 a 110 (depende de quantos entram por link mágico) |
| Domínio `.com.br` | R$ 3,33 | R$ 3,33 | R$ 3,33 |
| **Infraestrutura** | **R$ 3,33** | **R$ 3,33 a 141** | **R$ 141 a 280** |
| Assinantes (3%) | 3 | 30 | 300 |
| Infra por assinante | R$ 1,11 | R$ 0,11 a 4,71 | R$ 0,47 a 0,93 |
| Taxa de pagamento por cobrança (Mercado Pago, R$ 9,90) | R$ 0,10 a 0,49 | R$ 0,10 a 0,49 | R$ 0,10 a 0,49 |

Comparação com o plano B (tudo na Cloudflare): R$ 3 a 31/mês nos três cenários, contra até R$ 280 no Supabase. A diferença só passa a importar acima de uns 10 mil usuários.

Custos únicos: Play Store US$ 25 (~R$ 140).

### Formalização (o custo que mais pesa)

- **MEI:** os contadores consultados dizem que desenvolvimento de software (CNAE 6201-5/01) **não é permitido** no MEI; licenciamento de software próprio (6203-1/00) também não aparece na lista. Confirmar no Portal do Empreendedor ou com um contador.
- **ME no Simples Nacional:** Anexo III ou V (Fator R), a partir de cerca de 6% do faturamento, mais contabilidade (online, cerca de R$ 100 a 300/mês).
- **Antes do CNPJ:** pessoa física pode receber pelo Mercado Pago e declarar pelo carnê-leão. Pode servir para validar o preço com poucos assinantes; confirmar com um contador.
- **Idade:** MEI e titularidade de empresa exigem 18 anos ou emancipação (a partir de 16, em cartório, com os pais). Se for o caso, um responsável pode ser o titular.
- Ponto de equilíbrio com contador de R$ 200/mês e Supabase Pro: cerca de **40 assinantes** a R$ 9,90.

## 7. Preço da assinatura

### Concorrentes

| Produto | Preço | O que entrega |
|---|---|---|
| App MEC Enem | Grátis | Trilhas e assistente oficial |
| Estudaqui (planner) | R$ 14,90/mês; R$ 6,67/mês no anual | Plano de estudos |
| Estuda.com | R$ 379,98/ano (R$ 31,66/mês); grátis limitado | Questões e simulados |
| Descomplica Enem Intensivo | 6x R$ 89,90 | Aulas, correção de redação |
| Aprova Total | ~R$ 83/mês (dado do roadmap, não reconferido) | Cursinho on-line |

O Flow é organizador, não cursinho: não tem aulas nem questões. O preço precisa ficar na faixa dos planners, não na dos cursinhos.

### Proposta

- **Grátis (sempre):** tudo que existe hoje (CLAUDE.md), mais a conta com backup na nuvem.
- **Pro mensal: R$ 9,90.** Cobre com folga o custo por assinante (menos de R$ 1,50 com infraestrutura e taxa em 1.000+ usuários) e sobra para impostos, contador e o tempo do Gabriel.
- **Pro anual: R$ 79,90** (R$ 6,66/mês, 33% de desconto). Uma cobrança só por ano dilui as taxas fixas e combina com o ciclo do Enem.
- Sem fidelidade, cancelamento no app, 7 dias de arrependimento (CDC, art. 49).
- **O que entra no Pro:** o que já está marcado como Pro (cronograma avançado, reorganização sugerida, estatísticas detalhadas) mais a sincronização entre vários aparelhos. O backup de um aparelho fica grátis.
- **Opcional:** meia-entrada para quem declarar escola pública (R$ 4,90/mês), em linha com o "não abusivo". Depende de confiar na declaração.
- Por que cair de R$ 19,90 para R$ 9,90: R$ 19,90 é o preço de um app de questões e fica acima do Estudaqui; o custo real não justifica.

## Decisões do Gabriel

1. **Provedores:** Cloudflare (site) + Supabase (banco e login)? Ou o plano B, tudo na Cloudflare?
2. **Preço:** R$ 9,90/mês e R$ 79,90/ano? Incluir a meia para escola pública?
3. **Pagamento:** Mercado Pago?
4. **Domínio:** registrar `flowestudos.com.br` (R$ 40/ano, no CPF do Gabriel ou de um responsável)?
5. **Formalização:** começar como pessoa física (carnê-leão) para validar, ou abrir ME com contador antes de cobrar? Quem será o titular?
6. **Play Store:** criar a conta (US$ 25) agora ou depois das contas e do ranking? Quem serão os 12 testadores?

Nada disso foi contratado nem criado. Cada conta e cada gasto esperam a aprovação dele.

## Fontes

- Vercel: https://vercel.com/pricing
- Cloudflare Workers e D1: https://developers.cloudflare.com/workers/platform/pricing/
- Netlify: https://www.netlify.com/pricing/
- Supabase: https://supabase.com/pricing e https://supabase.com/docs/guides/platform/regions
- Firebase: https://firebase.google.com/pricing
- Neon: https://neon.com/pricing
- Turso: https://turso.tech/pricing
- Resend (fontes secundárias): https://automationatlas.io/answers/resend-free-tier-explained-2026/ e https://costbench.com/software/email-api/resend/
- Registro.br (API): https://registro.br/v2/ajax/avail/raw/flowestudos.com.br; preço: https://teletime.com.br/14/10/2026/br-6-milhoes/
- RDAP `.com`: https://rdap.verisign.com/com/v1/domain/flowestudos.com; `.app`: https://pubapi.registry.google/rdap/domain/flowestudos.app
- Asaas: https://www.asaas.com/precos-e-taxas
- Mercado Pago: https://www.mercadopago.com.br/blog/quanto-custa-receber-pagamentos-via-pix-e-codigo-qr e https://tecnoblog.net/responde/como-receber-pelo-mercado-pago-produtos-ou-servicos/ (a página oficial de tarifas bloqueou o acesso automático)
- Stripe: https://stripe.com/br/pricing
- Pagar.me: https://pagar.me/precos/
- Abacate Pay: https://www.abacatepay.com/
- Play, taxas: https://support.google.com/googleplay/android-developer/answer/112622
- Play, teste fechado: https://support.google.com/googleplay/android-developer/answer/14151465
- Play, faturamento alternativo: https://support.google.com/googleplay/answer/11174377
- MEI e software: https://contabilidade.com/blog/desenvolvedor-pode-ser-mei-em-2026-veja-como-abrir-cnpj-escolher-o-cnae-ideal-e-pagar-menos-impostos/ e https://contabilivre.com.br/blog/cnaes-para-desenvolvimento-de-software-conheca-os-mais-indicados
- MEI e idade: https://neon.com.br/aprenda/mei/com-quantos-anos-pode-abrir-mei
- Estuda.com: https://estuda.com/plano-aprovado/
- Estudaqui: https://apps.apple.com/br/app/estudaqui-seu-plano-de-estudo/id1445700738
- Descomplica: https://descomplica.com.br/vestibulares/enem/gabi/
