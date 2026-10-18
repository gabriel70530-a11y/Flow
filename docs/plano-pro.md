# Plano Pro, conta obrigatória, IA, pagamento e Play Store

Pesquisa de 18/10/2026, continuação de `docs/estudo-custos-e-preco.md`. Câmbio: **US$ 1 = R$ 5,50**. Nada foi contratado, criado ou cobrado. A prévia visual está em `docs/previa-pro.html`.

## Resumo

- **Gratuito enxuto, mas útil:** tópicos, timer, revisões agendadas pela própria pessoa, registro de simulados e redações, Painel. Tudo o que é automático ou analisa os seus números vai para o Pro.
- **Conta obrigatória** para os dois planos. Os dados continuam salvos no aparelho e o app funciona sem internet depois de entrar.
- **IA no Pro:** correção de redação por foto e análise de erros de questões, com limite mensal por pessoa. Custa de R$ 0,01 a R$ 0,52 por uso, dependendo do modelo.
- **Simulados no app:** sim, com a prova oficial do Inep e um cartão-resposta digital corrigido pelo gabarito oficial. Questões dentro do app têm risco de direito autoral.
- **Pagamento:** Mercado Pago. Mensal por assinatura no cartão; anual em uma cobrança só, por Pix ou cartão. O acesso Pro é decidido no servidor, por webhook.
- **Play Store:** viável pelo PWA empacotado (TWA). Recomendo começar sem venda dentro do app Android.
- **Preço:** com a IA, sugiro **R$ 14,90/mês** ou **R$ 119,90/ano**. O ponto de equilíbrio fica perto de 30 assinantes.
- **Atenção à concorrência:** o app oficial **MEC Enem** é gratuito e já corrige redação com IA e tem simulados. O Flow precisa se vender como organizador, não como corretor.

## 1. O que fica em cada plano

| Recurso | Gratuito | Pro |
|---|---|---|
| Áreas e tópicos sem limite, status, prioridade, domínio | ✓ | ✓ |
| Timer (Pomodoro, cronômetro, modo foco) e sessões | ✓ | ✓ |
| Revisões: a pessoa escolhe a data de cada revisão | ✓ | ✓ |
| Revisões agendadas sozinhas (+1, +7, +15, +30) ao concluir | — | ✓ |
| Sugestões do que mais cai ao criar tópico | — | ✓ |
| Caderno de erros (com revisão espaçada própria) | — | ✓ |
| Registrar simulados, redações e repertório | ✓ | ✓ |
| Checklist do dia da prova | ✓ | ✓ |
| Painel: semana, meta, sequência, conquistas | ✓ | ✓ |
| Histórico do Painel | últimas 4 semanas | tudo |
| Resumo da semana | sessões e tópicos | completo (planejado x realizado, constância, comparação, área esquecida) |
| Cronograma montado à mão (o que ficou volta sozinho no dia seguinte) | ✓ | ✓ |
| Plano da semana gerado e atualizado sozinho | — | ✓ |
| Evolução nos simulados, ponto a treinar na redação | — | ✓ |
| **Simulado no app** (cartão-resposta digital, correção pelo gabarito oficial) | — | ✓ |
| **Correção de redação com IA** (foto ou texto) | — | 8 por mês |
| **Análise de erro com IA** (foto da questão) | — | 60 por mês |
| Conta com cópia na nuvem e sincronização | ✓ | ✓ |

Regras que não mudam: nada é apagado ao perder o Pro. Revisões já agendadas, erros e análises continuam guardados e voltam ao assinar. O caderno de erros fica só para leitura no gratuito, em vez de sumir, para ninguém sentir que perdeu algo que escreveu.

## 2. Conta obrigatória

O que muda:

- O app (todas as telas fora da landing, privacidade e termos) pede login antes de abrir. A primeira tela vira "Entrar ou criar conta".
- Depois de entrar, os dados continuam no `localStorage` e o app funciona sem internet. A sincronização segue como hoje.
- Os dados de exemplo deixam de existir: a conta nova começa vazia, direto no onboarding. (Proposta; os dados de exemplo só faziam sentido para quem chegava sem conta.)
- Quem já tem dados no aparelho sem conta: ao criar a conta, tudo sobe para a nuvem (a junção do primeiro login já faz isso).

O que é preciso antes de lançar:

- **E-mail próprio no Supabase (SMTP):** o envio embutido do Supabase permite só cerca de 2 e-mails por hora, e com conta obrigatória todo cadastro manda confirmação. Resend é grátis até 3.000 e-mails/mês e custa US$ 20/mês acima disso.
- **Recomendo adicionar "Entrar com Google":** não gasta e-mail, não precisa de senha e reduz a desistência no cadastro.
- **Idade:** pedir o ano de nascimento no cadastro. Para menores, manter a confirmação de que um responsável sabe (LGPD, art. 14). A política de uso da Anthropic também pede verificação de idade e salvaguardas para produtos usados por menores (ver seção 3).
- **Revisão do app na Play:** com login obrigatório, a Google exige uma conta de teste para o revisor.
- **Atualizar** privacidade, termos, README e CLAUDE.md (o "local primeiro, conta opcional" deixa de valer).

## 3. IA no Pro

### Correção de redação

- A pessoa fotografa a redação (ou cola o texto) e escolhe o tema. A IA devolve a nota estimada por competência (0 a 200), o que justificou cada nota e o que melhorar.
- Sempre com o aviso: "Estimativa feita por IA. Não é a nota oficial nem substitui um corretor."
- A nota entra no registro de redações já existente, marcada como "corrigida por IA", e alimenta o "ponto a treinar".

### Análise de erros

- No caderno de erros, a pessoa manda a foto da questão e diz o que marcou. A IA explica a resolução, aponta onde o raciocínio desviou e sugere o motivo do erro (conteúdo, comando, pressa, chute) e o tópico.
- A pessoa confirma antes de salvar. Nada é criado sozinho.

### Custo por uso (preços oficiais de 06/10/2026)

| Modelo | Entrada | Saída | Redação (foto) | Análise de erro (foto) |
|---|---|---|---|---|
| Claude Haiku 5.5 | US$ 0,10/mi | US$ 0,50/mi | R$ 0,01 | R$ 0,007 |
| **Claude Sonnet 5.5** | US$ 2/mi | US$ 10/mi | **R$ 0,26** | R$ 0,14 |
| Claude Opus 5.5 | US$ 4/mi | US$ 20/mi | R$ 0,52 | R$ 0,28 |

Premissas: redação com 2 fotos (~5 mil tokens), critérios do Enem no prompt (~4 mil tokens, em cache depois da primeira chamada) e ~3.500 tokens de resposta. Análise de erro com 1 foto (~2.300 tokens) e ~2 mil de resposta.

**Recomendação:** Sonnet 5.5 para a redação (a qualidade da avaliação é o produto) e Haiku 5.5 para a análise de erro (alto volume, tarefa mais simples). Antes de lançar, comparar os modelos num conjunto de redações já corrigidas por humanos e escolher pelo resultado, não só pelo preço.

**Limite mensal por pessoa:** 8 redações e 60 análises. No pior caso, quem usa tudo custa R$ 2,50/mês (Sonnet + Haiku). Uso médio estimado em metade disso: **R$ 1,25 por assinante**.

### Exigências

- **Chave da API só no servidor.** As chamadas passam por uma função no Supabase (Edge Function) que confere login, Pro e o limite do mês antes de chamar a IA.
- **Menores de idade:** a Anthropic permite produtos para menores via API (preparação para provas é um exemplo citado), desde que haja verificação de idade, moderação, aviso claro de que é IA e o prompt de segurança infantil dela. Fica no termo e na interface.
- **LGPD:** fotos de redação e de questões são enviadas a um provedor nos EUA. Precisa constar na política de privacidade, com a finalidade e a opção de não usar.

## 4. Simulados dentro do app

O Inep publica as provas e os gabaritos de todas as edições desde 1998. Três caminhos:

| Caminho | Como funciona | Risco | Custo |
|---|---|---|---|
| **A. Cartão-resposta digital** (recomendado) | A pessoa abre a prova oficial (link para o PDF do Inep), marca as respostas no Flow com cronômetro, e o Flow corrige pelo gabarito oficial: acertos por área, questões erradas e tempo. Cada erro pode ir para o caderno de erros com um toque. | Baixo: o app guarda só o gabarito (letras), não o conteúdo das questões. | Só trabalho de cadastrar os gabaritos. |
| B. Questões dentro do app | O texto e as imagens das questões aparecem no Flow. | Alto: os enunciados citam textos, poemas, charges e reportagens de terceiros, com direito autoral próprio. Não encontrei autorização do Inep para uso comercial. Exige parecer jurídico. | Alto (cadastro e revisão de milhares de questões). |
| C. Questões geradas por IA | A IA cria questões no estilo do Enem por tópico. | Médio: erros de gabarito acontecem e precisam de revisão. | ~R$ 0,05 a 0,15 por questão com Sonnet. |

**Nota TRI:** os microdados do Inep trazem os parâmetros de cada questão, o que permitiria estimar uma nota TRI no caminho A. A regra atual do Flow é nunca mostrar nota TRI. Se quiser mudar, dá para mostrar como "estimativa" com explicação. Decisão sua.

## 5. Sistema de pagamento (Mercado Pago)

- **Mensal:** assinatura recorrente no cartão (API `preapproval`). Após 3 cobranças recusadas, o Mercado Pago cancela sozinho. Não encontrei confirmação de Pix Automático nessa API; verificar na conta.
- **Anual:** uma cobrança única (Checkout Pro), por Pix ou cartão, que libera o Pro por 365 dias. Sem renovação automática: o app avisa 7 dias antes.
- **Como funciona por dentro:**
  1. O app chama uma função no servidor, que cria o pagamento com o ID da conta e devolve o link do Mercado Pago.
  2. A pessoa paga no Mercado Pago.
  3. O Mercado Pago avisa o servidor (webhook). O servidor confere a assinatura do aviso, consulta o pagamento na API e grava o Pro numa tabela `entitlements`, que só o servidor escreve (RLS).
  4. O app lê essa tabela ao entrar e guarda uma cópia com validade, para funcionar sem internet.
- **Cancelamento** no próprio app, sem fidelidade. **7 dias de arrependimento** (CDC, art. 49) com reembolso.
- Tudo primeiro no **modo de teste** do Mercado Pago. Para receber de verdade: conta do Mercado Pago no CPF ou CNPJ do titular.
- Onde rodar: Edge Functions do Supabase (500 mil chamadas/mês no grátis, 2 milhões no Pro). Assim o pagamento e a IA não dependem de onde o site está hospedado.

## 6. Play Store

- **Como:** o Flow já é PWA. Vira app Android pela TWA (Bubblewrap ou PWABuilder): o mesmo código do site, mais o arquivo `/.well-known/assetlinks.json` no domínio. Atualizações do site chegam ao app sem nova versão na loja.
- **Conta de desenvolvedor:** US$ 25 uma vez (~R$ 140). Conta pessoal nova precisa de **teste fechado com 12 testadores por 14 dias seguidos** antes de publicar.
- **Exigências:** política de privacidade, formulário de segurança de dados, classificação etária, público-alvo (13+ evita as regras de "Famílias"), exclusão de conta pelo app e por um link na web (o Flow já tem), e conta de teste para o revisor (por causa do login obrigatório).
- **Cobrança dentro do app Android:**
  - Vender o Pro dentro do app exige o faturamento da Play: **15%** em assinaturas.
  - O Brasil está no programa de faturamento alternativo da Google (a pessoa escolhe): a taxa cai 4 pontos, para **11%**, e ainda dá para usar o Mercado Pago. As novas taxas de 10% anunciadas em junho de 2026 valem por enquanto só para EUA, Europa e Reino Unido.
  - **Recomendação para começar:** o app Android não vende nada nem aponta para pagamento fora. Quem assinou no site entra com a conta e tem o Pro. É permitido e não paga taxa. Depois, se as vendas pelo Android justificarem, entrar no faturamento alternativo.
- **iOS:** o PWA pelo Safari já funciona. App na App Store custa US$ 99/ano e exige um Mac; fica para depois.

## 7. Custo mensal e preço

### Custos fixos quando começar a cobrar

| Item | 100 usuários | 1.000 usuários | 10.000 usuários |
|---|---|---|---|
| Supabase Pro (banco, login, funções, backup) | R$ 138 | R$ 138 | R$ 138 |
| Cloudflare Workers (site) | R$ 0 | R$ 28 | R$ 28 |
| Resend (e-mails de cadastro e senha) | R$ 0 | R$ 0 | R$ 110 |
| Domínio `.com.br` | R$ 3 | R$ 3 | R$ 3 |
| Contador (ME no Simples) | R$ 200 | R$ 200 | R$ 200 |
| **Total fixo** | **R$ 341** | **R$ 369** | **R$ 479** |

Custos únicos: Play Store ~R$ 140. Créditos da API da Anthropic são pré-pagos, sem mensalidade.

### Custo variável por assinante (mensal)

| Item | R$ 9,90 | R$ 14,90 |
|---|---|---|
| IA (uso médio) | R$ 1,25 | R$ 1,25 |
| Mercado Pago (cartão, 4,98%) | R$ 0,49 | R$ 0,74 |
| Imposto (Simples, ~6%) | R$ 0,59 | R$ 0,89 |
| **Sobra por assinante** | **R$ 7,57** | **R$ 12,02** |

### Resultado com 3% de conversão

| | 100 usuários (3 assinantes) | 1.000 (30) | 10.000 (300) |
|---|---|---|---|
| R$ 9,90/mês | −R$ 318 | −R$ 142 | +R$ 1.792 |
| R$ 14,90/mês | −R$ 305 | −R$ 8 | +R$ 3.127 |

- Ponto de equilíbrio: **49 assinantes** a R$ 9,90; **31 assinantes** a R$ 14,90.
- Sem o contador (validação como pessoa física, se o contador confirmar que pode), o equilíbrio cai para cerca de 22 e 14 assinantes.

### Proposta de preço

- **Mensal: R$ 14,90.** Igual ao Estudaqui (planner, sem IA) e bem abaixo dos cursinhos. Cobre a IA com folga.
- **Anual: R$ 119,90** (R$ 9,99/mês, 33% de desconto). Por Pix, a taxa é R$ 1,19 por ano.
- **Alternativa, se quiser manter R$ 9,90:** limite de 4 redações por mês e Haiku nas duas tarefas. O custo de IA cai para cerca de R$ 0,25 por assinante.

## Decisões do Gabriel

1. **Divisão gratuito/Pro** da seção 1 e da prévia: aprova?
2. **Conta obrigatória:** começar sem dados de exemplo? Adicionar "Entrar com Google"?
3. **IA:** Sonnet 5.5 na redação e Haiku 5.5 nos erros, com 8 e 60 por mês?
4. **Simulados:** caminho A (cartão-resposta com a prova oficial)? Mostrar nota TRI estimada ou manter a regra de nunca mostrar?
5. **Preço:** R$ 14,90/mês e R$ 119,90/ano, ou manter R$ 9,90 com menos IA?
6. **Contas a criar (por você):** chave da API da Anthropic, conta do Mercado Pago (modo de teste), projeto no Supabase, Resend e, depois, a conta da Play.

## Fontes

- Preços da API da Anthropic: tabela de modelos de 06/10/2026 (platform.claude.com)
- Anthropic, uso por menores: https://support.anthropic.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors e https://anthropic.com/news/updating-our-usage-policy
- App MEC Enem com correção por IA: https://www.band.com.br/noticias/enem-aplicativo-do-mec-traz-simulados-e-correcao-da-prova-de-redacao-202510101648 e https://olhardigital.com.br/2025/11/23/dicas-e-tutoriais/como-corrigir-a-redacao-do-enem-pelo-app-do-mec/
- Provas e gabaritos do Inep: https://diariodonordeste.verdesmares.com.br/ceara/provas-anteriores-do-enem-onde-baixar-e-como-usa-las-para-uma-revisao-eficaz-1.3703437
- Mercado Pago, assinaturas: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments
- Pix Automático: https://www.letsmoney.com.br/pix/pix-automatico-dispara-pagamentos-recorrentes/
- Play, faturamento alternativo: https://www.revenuecat.com/app-to-web-purchase-guidelines e https://android-developers.googleblog.com/2026/06/play-expanded-billing.html
- Play, programa de escolha de faturamento: https://support.google.com/googleplay/android-developer/answer/17161464
- Supabase, limite de e-mail e SMTP: https://sendlayer.com/blog/supabase-custom-smtp-and-email-configuration-guide/ e https://makerkit.dev/docs/md/next-supabase-turbo/going-to-production/authentication
- Demais fontes (hospedagem, Supabase, Mercado Pago, Play, MEI): `docs/estudo-custos-e-preco.md`
