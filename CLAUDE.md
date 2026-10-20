# Flow

Organizador de estudos para estudantes do ensino médio e candidatos ao ENEM. A marca é **Flow**, com o slogan "Sua preparação para o ENEM, no ritmo certo." O nome ENEM nunca faz parte da marca: aparece só como o nome da prova (no slogan e em textos descritivos). O objetivo é organizar as matérias da semana e do dia e ajudar a lembrar das revisões, sem deixar a rotina rígida e sem limitar a carga horária de ninguém. Não é cursinho, não promete aprovação ou nota e não tem vínculo com INEP/MEC.

O escopo do produto está em `prompt_mestre_enem_flow_claude_code.md` (fase 2). O protótipo em `docs/prototype.html` continua sendo a referência visual e dos fluxos que ele já cobre. Se o prompt mestre e o protótipo divergirem, vale o prompt mestre.

**Local primeiro, conta obrigatória.** Os dados vivem no `localStorage` do navegador e o app funciona sem internet, mas só depois de entrar numa conta (Supabase: e-mail e senha ou Google, banco Postgres com RLS em São Paulo), que guarda uma cópia e sincroniza entre aparelhos. Sem as variáveis do Supabase, a produção diz que a conta não está disponível e o desenvolvimento local abre o app direto. O app não usa IA. Pagamento (Mercado Pago) roda só nas funções do Supabase (`supabase/functions`), com as chaves no servidor; nunca simule compra ou assinatura. O estudo do Pro, com custos, preço e decisões aprovadas, está em `docs/plano-pro.md` (prévia em `docs/previa-pro.html`); os anteriores em `docs/estudo-custos-e-preco.md` e `docs/roadmap-proxima-fase.md`.

## Stack

- Next.js (App Router) + TypeScript com `strict: true`
- Tailwind CSS v4 (tokens em `app/globals.css` via `@theme inline`)
- Zustand com o middleware `persist` para o estado
- Vitest para testes das funções puras e da store
- `lucide-react` para ícones
- `@supabase/supabase-js` para a conta, a sincronização e as chamadas às funções (só em `store/cloud.ts`)
- Funções do Supabase em Deno (`supabase/functions`, fora do `tsconfig` e do ESLint): conferir com `deno check` e `deno lint` dentro da pasta
- Nada além disso sem necessidade clara. Gráficos são divs com altura calculada, não biblioteca.

## Comandos

- `npm run dev`: servidor local
- `npm run build`: precisa passar sem erros nem warnings
- `npm run lint`: precisa passar limpo
- `npm test`: Vitest

## Regras de código

- Código idiomático, direto e legível. Nomes descritivos; nada de variáveis de uma letra fora de callbacks curtos.
- Sem comentários óbvios. Comente só o porquê de uma regra de negócio que não é evidente pelo código.
- Sem overengineering: nada de fábricas, camadas de serviço, injeção de dependência ou abstrações "para o futuro". Extraia um componente ou função quando ele for usado em dois lugares ou quando simplificar de verdade o arquivo.
- Lógica de datas, revisões, tópicos, cronograma e estatísticas fica em funções puras em `lib/`, sem tocar em React nem no `localStorage`. A store só orquestra; componentes só leem a store e chamam ações.
- Todo texto da interface em português do Brasil.
- Não deixe código morto, `console.log`, nem arquivos de exemplo do create-next-app.
- Nenhum botão sem ação real. Se algo depende de configuração externa, a interface diz isso em vez de fingir.

## Commits

Conventional Commits, curtos, no imperativo, sem corpo explicativo:

```
feat: add spaced review scheduling
fix: keep timer running after reload
refactor: extract week stats helpers
test: cover review rescheduling
```

Um commit por unidade lógica de trabalho.

## Estrutura

```
app/
  layout.tsx            fontes, script de tema
  (site)/               landing (/), /ajuda, /privacidade, /termos: sem a navegação do app
  (app)/layout.tsx      AppShell
  (app)/painel, cronograma, materias, timer, revisoes (+ revisoes/erros), ajustes, planos, comecar (onboarding)
  (app)/preparacao, questoes, simulados, redacao, tabuada, prova   ferramentas de preparação (fora das abas do celular)
  (app)/painel/resumo   sua semana: setas, meta, resumo e horas por área
  globals.css           tokens de cor e tipografia
components/
  ui/                   componentes genéricos (Button, Card, Drawer, Toast, Segmented...)
  shell/                Sidebar, TabBar, Wordmark, ThemeSelect, avisos globais
  painel/ preparacao/ cronograma/ materias/ timer/ revisoes/ simulados/ redacao/ prova/ ajustes/ planos/ onboarding/ site/
lib/
  syllabus.ts           as cinco áreas do ENEM e as matérias de Natureza e Humanas (sem tópicos prontos)
  legacy-topics.ts      lista antiga de tópicos, só para migração, dados de exemplo e testes
  topics.ts             tópicos criados pelo estudante: criar, editar, ocultar, excluir, filtrar
  dates.ts              chave YYYY-MM-DD local, addDays, mondayOf, shortDate
  reviews.ts            agendamento, conclusão, adiamento e reagendamento de revisões
  sessions.ts           criação e validação de sessões
  planner.ts            geração e reorganização do cronograma
  stats.ts              horas por dia, por área, metas, sequência, planejado x realizado
  timer.ts              elapsed, phaseSeconds, isIdle
  exam.ts               data da prova, reta final e checklist do dia da prova
  mistakes.ts           caderno de erros com revisão espaçada própria
  mock-exams.ts         simulados registrados: acertos por área e ritmo
  question-blocks.ts    blocos de 5 questões oficiais por área e tema
  flashcards.ts         cartões de memorização com intervalos no estilo do Anki e importação do Anki
  times-table.ts        treino da tabuada: rodadas pelas contas menos decoradas
  reminders.ts          horário de estudo e os avisos 1 h antes, 30 min antes e na hora
  tri.ts, tri-items.ts  nota estimada pela TRI com os parâmetros oficiais dos itens
  official-exams.ts     provas oficiais do Inep (gabarito transcrito), correção, rascunho e texto das questões do simulado no app
  age.ts                idade mínima (13) e menor de idade pelo ano de nascimento
  essay-themes.ts       temas de redação: os oficiais do Enem e temas de treino, com a sugestão da semana
  essays.ts             redações registradas (notas por competência) e repertório
  suggestions.ts        sugestões de nome de tópico pelo que mais cai, por área e matéria
  plan.ts               gratuito x Pro: preços, recursos, acesso a partir do registro do servidor, teste aberto
  sync.ts               registros por item, mudanças pendentes e junção com a nuvem (mudança mais recente vence)
  site.ts               endereço público, título e descrição (sitemap, robots, manifest, cartão social)
  *.test.ts
store/
  study-store.ts        ações, persist e aviso de falha ao salvar
  state.ts              tipo StudyData e estado vazio
  migrate.ts            leitura do localStorage, migração v1 → v2 e backup
  analytics.ts          eventos de uso: só com endpoint configurado e consentimento
  cloud.ts              login (e-mail e Google), sincronização, Pro do servidor, pagamento, sair e excluir conta
  pro.ts                registro do Pro confirmado pelo servidor (proAccessNow, useProAccess)
supabase/migrations/    records com RLS, push_records, delete_account; entitlements, payments e ai_usage (sem uso)
supabase/functions/     checkout, mercadopago-webhook, cancel-subscription, send-reminders (push)
public/provas/          questões das provas no app (JSON por dia, sem gabarito) e imagens
```

## Modelo de dados (v2)

```ts
type AreaId = 'mat' | 'lin' | 'nat' | 'hum' | 'red';
type SubjectId = 'qui' | 'fis' | 'bio' | 'geo' | 'his' | 'fil' | 'soc';  // matérias de 'nat' e 'hum'
type TopicStatus = 'nao' | 'and' | 'concluido' | 'revisar';
type Priority = 'alta' | 'media' | 'baixa';

interface TopicRecord {                      // criados pelo estudante, na ordem de criação
  id: string; areaId: AreaId; subjectId: SubjectId | null;      // matéria em Natureza e Humanas
  name: string; description: string; priority: Priority; hidden: boolean;
}
interface Review {
  stage: number; due: string; done?: string;                   // datas 'YYYY-MM-DD'
  manual?: boolean;                                            // agendada pela pessoa (gratuito), fora das 4 etapas
  feedback?: 'bem' | 'parcial' | 'dificil';
  reschedules?: { from: string; to: string; at: string }[];
}
interface TopicProgress { status: TopicStatus; mastery: 0 | 1 | 2 | 3 | 4 | 5; completedAt?: string; reviews: Review[] }
interface StudySession {
  id: string; topicId: string | null; areaId: AreaId | null;   // null = "Estudo geral"
  date: string; start: number; end: number; sec: number;       // sec = foco efetivo, sem pausas
  mode: 'pomodoro' | 'cronometro'; state: 'concluida' | 'interrompida';
  reflection?: 'bem' | 'parcial' | 'revisar' | 'dificuldade'; note?: string; taskId?: string;
}
interface PlanTask {                         // uma matéria do dia, sem duração
  id: string; topicId: string | null; areaId: AreaId | null; kind: 'estudo' | 'revisao';
  date: string | null; priority: Priority;                       // date null = adiada sem data
  status: 'planejada' | 'iniciada' | 'concluida' | 'adiada';
  origin: 'gerada' | 'manual' | 'repeticao' | 'transferida';
  focusSec: number;                                              // tempo estudado nela, sem limite
  outcome?: 'dominada' | 'repetir';                            // resposta ao fechar a tarefa
}
```

O estado completo (`StudyState`, `version: 2`) guarda `topics`, `progress`, `sessions`, `tasks`, `timer`, a meta (`goal: { type: 'horas' | 'sessoes' | 'topicos'; value }`), as preferências de cronograma (dias de estudo de segunda a domingo, áreas prioritárias e difíceis, data-alvo, estratégia), o onboarding e as preferências de interface (tema, som, sequência visível). Também guarda os blocos de questões (`questionBlocks`), os cartões (`flashcards`), o caderno de erros (`mistakes`), os simulados (`mockExams`), as redações (`essays`), o repertório (`repertoire`) e os itens marcados no checklist da prova (`examChecklist`). Sessões podem ter `distracted` (resposta opcional "se distraiu?"). O simulado oficial em andamento fica em `examDraft` (formato `app` ou `pdf`, dia inteiro ou área, respostas, questão aberta, marcadas para rever, `banked` e `startedAt`), no aparelho, sem sincronizar.

- IDs estáveis. Tópicos novos usam `custom-…`; os que vieram da lista antiga mantêm `${areaId}-${índice}` (`mat-3`). Nunca use o nome como chave.
- Ao carregar dados antigos, os tópicos padrão que nunca foram usados (sem progresso, sessão nem tarefa) são descartados; os usados ficam.
- Chave do `localStorage`: `enem-flow:v2`. Se ela não existir, migre de `enem-flow:v1` (formato do protótipo) e deixe a v1 intacta como cópia de segurança.
- JSON corrompido: guarde o texto bruto em `enem-flow:v2:corrompido` e comece do zero sem quebrar a aplicação.
- Falha ao salvar (cota, modo privado): avise na interface e ofereça tentar de novo.

## Regras de negócio

**Matérias**
- O app não traz tópicos prontos, nem nos dados de exemplo, só as cinco áreas: Matemática, Linguagens, Ciências da Natureza, Ciências Humanas e Redação. O estudante decide o que estuda e quanto estuda.
- No Pro, ao **criar** um tópico, o formulário mostra até 10 sugestões do que mais cai na área ou matéria escolhida (`lib/suggestions.ts`, a partir da análise de incidência 2014–2024 "ENEM's Anatomy" e de levantamentos públicos). Tocar só preenche o nome; nada é criado sozinho. Sugestões que já existem na área (sem diferenciar acento) aparecem com ✓ e desativadas. Em Natureza e Humanas, aparecem depois de escolher a matéria.
- Natureza se divide em Química, Física e Biologia; Humanas em Geografia, História, Filosofia e Sociologia. Todo tópico dessas áreas pertence a uma matéria (`subjectId`), e a tela de Matérias agrupa por ela. Tarefas e sessões guardam a matéria do tópico.
- O estudante cria, edita, oculta, reexibe e exclui tópicos (excluir pede confirmação e não apaga sessões, que passam a aparecer como "Tópico excluído").
- Ocultar não apaga sessões, revisões nem progresso; tópicos ocultos saem das listas e do cronograma até serem reexibidos.
- Busca por nome e filtro por área sempre visíveis; status, prioridade, ordenação e ocultos ficam atrás do botão de filtros.
- Cada área é um card recolhível (só o resumo até abrir). Abre sozinha a primeira área com tópicos, a área filtrada e as que têm resultado de busca.

**Revisão espaçada**
- No Pro, ao marcar um tópico como Concluído, agende 4 revisões a partir de hoje: +1, +7, +15 e +30 dias. No gratuito, concluir não agenda nada: em Revisões, "Agendar revisão" deixa a pessoa escolher o tópico e a data (`scheduleReview`, revisão `manual`); escolher de novo move a pendente, nunca cria duas.
- Em Revisões (Pro), "Agendar revisões do que já estudei" abre um drawer com os tópicos visíveis ainda não concluídos (por área e matéria, com busca) e a opção de criar um tópico ali mesmo. Os marcados viram Concluído e ganham as 4 revisões a partir de hoje (`markStudied`).
- Ao tirar de Concluído (para qualquer outro status), remova as revisões não feitas e mantenha as já feitas.
- Ao reconcluir, mantenha as feitas e agende só as etapas restantes a partir de hoje, com os intervalos da própria etapa.
- A tela mostra Atrasadas, Hoje, Próximos 7 dias e Futuras. Atrasadas continuam visíveis até serem concluídas ou reagendadas.
- Concluir pede um feedback opcional (Lembrei bem, Lembrei parcialmente, Tive dificuldade). "Tive dificuldade" sugere marcar o tópico como "Precisa revisar"; nunca muda datas sozinho.
- Adiar (+1 dia) e reagendar mudam só a revisão escolhida e registram o histórico em `reschedules`. As etapas seguintes não se movem.

**Timer**
- Tempo decorrido = `banked + (agora − startedAt) / 1000` enquanto roda. Nunca conte segundos com `setInterval`: o intervalo só repinta a tela. O estado do timer é persistido e continua após recarregar.
- Pausar: `banked = elapsed`, `running = false`.
- Fim de um bloco de foco no Pomodoro: registra uma sessão concluída com a duração do foco, toca um aviso curto (se o som estiver ligado) e **oferece** a pausa: o timer fica parado na fase de pausa com "Iniciar pausa" e "Pular pausa".
- Fim da pausa: volta para foco, parado, oferecendo o próximo bloco.
- Finalizar: registra o tempo decorrido se for de pelo menos 1 minuto (no Pomodoro antes do fim do bloco, a sessão fica "interrompida") e zera o timer. Descartar zera sem registrar. Clicar várias vezes nunca duplica a sessão.
- Pausas nunca contam como estudo.
- É preciso escolher o que estudar: um tópico, uma área ou matéria inteira sem tópico (valores `area:<id>` e `materia:<id>`, exibidos como "Matemática (geral)" e "Química (geral)") ou "Estudo geral" (sem área).
- Registrar uma sessão num tópico "Não iniciado" muda o status para "Em andamento". Sessão concluída nunca marca o tópico como concluído.
- Depois de registrar, ofereça a reflexão opcional (Entendi bem, Entendi parcialmente, Preciso revisar, Tive dificuldade). As duas últimas sugerem marcar o tópico como "Precisa revisar".
- Não deixa trocar de modo ou de duração com sessão em andamento.
- O `AudioContext` só pode ser criado no clique de Iniciar (regra dos navegadores).

**Cronograma**
- O cronograma organiza, não limita: não existe duração por matéria nem limite de horas. A pessoa escolhe só em quais dias estuda (dias de estudo), as áreas prioritárias e difíceis e a estratégia (equilibrada ou foco nas prioridades). A data da prova não é perguntada: é sempre a do Enem (`ENEM_DATES` em `lib/exam.ts`, hoje 8/11 e 15/11 de 2026), mostrada no onboarding e nas preferências só para leitura. Atualize a constante a cada edição.
- Cada dia de estudo recebe **no máximo 2 matérias** (revisões contam como matéria), **sempre do mesmo assunto**: dia de Matemática tem até duas de Matemática, nunca Matemática e Linguagens; dia de Química tem até duas de Química, nunca Química e Biologia. A área inteira ("Ciências da Natureza (geral)") cabe com qualquer matéria dela. Estudar as duas não é obrigatório.
- Ordem de escolha: revisões vencidas ou do dia, tópicos "Precisa revisar", "Em andamento" e "Não iniciado", pesando prioridade do tópico, áreas prioritárias e áreas pouco contempladas na semana. Tópicos ocultos e concluídos ficam de fora. O que não couber na semana aparece como pendente.
- Regenerar mantém tarefas concluídas, iniciadas, manuais, repetições e transferidas; substitui só as geradas e ainda planejadas a partir de hoje. Antes, mostra quantas serão trocadas.
- Começar uma matéria abre o Timer no cronômetro, sem limite de tempo. O foco registrado com a tarefa ativa soma em `focusSec` e a tarefa fica "iniciada". O tempo nunca conclui a tarefa.
- Ao terminar, o app pergunta "Você sente que dominou?". **Dominei**: a tarefa conclui e o tópico vira Concluído (agendando as revisões) ou, se era revisão, a revisão é concluída. **Ainda não dominei**: a tarefa do dia fecha e a matéria é repetida no próximo dia de estudo (de preferência amanhã).
- O que ficou sem estudar em dias anteriores passa **sozinho** para o próximo dia de estudo, ao abrir o app, com um aviso. Sem linguagem de culpa.
- Repetições e transferências respeitam o limite de 2 por dia: se o dia já está cheio, uma tarefa gerada e ainda não começada sai para dar lugar; tarefas manuais, iniciadas ou concluídas nunca saem. Sem dia livre em duas semanas, a tarefa fica adiada.
- A pessoa ainda pode mover ou adicionar uma matéria em outro dia (com menos de 2 e da mesma área), baixar a prioridade ou deixar para outra semana.
- Quem não quiser cronograma usa o app manualmente.
- **Dias corridos** (`lightDays`, opcional): dias de estudo em que o plano coloca só 1 matéria (escola integral, trabalho). Vale para gerar, repetir e transferir; à mão a pessoa ainda pode pôr 2.
- **Dia leve**: no Painel, com 2 matérias abertas hoje, "Dia leve" deixa só uma (a iniciada, se houver) e passa a outra planejada para o próximo dia de estudo, pela regra das transferências. O toast diz para onde foi, sem culpa.
- **Reta final**: nas 4 semanas antes da data da prova, tópicos "Não iniciado" perdem peso no plano; revisões, "Precisa revisar" e "Em andamento" vêm antes. O subtítulo do Painel conta os dias até o próximo dia de prova (o 1º e, entre os dois domingos, o 2º).

**Preparação** (tudo opcional, nada bloqueia o resto do app)
- **Cartões** (`/revisoes/cartoes`, Pro; no gratuito os cartões já criados ficam só para leitura e não entram no contador): o Flow não traz cartões prontos; quem monta é o estudante. O máximo que o app oferece é importar o que ele já fez no Anki, pelo texto que o Anki exporta ("Notas em texto simples": cabeçalhos `#`, separador, aspas, HTML, colunas de guid/tipo/baralho/etiquetas), sem repetir cartões iguais. Frente e verso, com o assunto opcional. Ao estudar, "Mostrar resposta" (espaço) e as notas Errei, Difícil, Bom e Fácil (teclas 1 a 4), cada uma mostrando quando o cartão volta. O intervalo segue o SM-2 do Anki (`lib/flashcards.ts`): facilidade inicial 2,5, mínimo 1,3; "Errei" volta para o fim da fila da mesma sessão e recomeça o cartão. Os vencidos entram no contador de Revisões.
- **Tabuada** (`/tabuada`, gratuito): a pessoa escolhe as tabuadas (1 a 10) e faz rodadas de até 20 contas, digitando o resultado. As menos decoradas vêm primeiro; a errada mostra a resposta e volta uma vez no fim da rodada. Uma conta está decorada com 3 acertos seguidos em até 5 segundos; 7 × 8 e 8 × 7 contam juntas. O progresso (`timesTable`) sincroniza como ajuste.
- **Blocos de questões** (`/questoes`, Pro): a pessoa escolhe a área e, se quiser, um tema (texto livre ou sugestões: os tópicos dela e o que mais cai). O Flow busca o tema no texto das questões das provas que estão no app (radical simples, sem acento) e escolhe 5, primeiro as que ela ainda não fez. Corrige pelo gabarito oficial, mostra a revisão de cada questão e manda os erros para o caderno. Os blocos sincronizam (`questionBlocks`); só um fica aberto por vez.
- **Caderno de erros** (`/revisoes/erros`, gratuito): Cada erro guarda o assunto (tópico, matéria, área ou nenhum), o motivo (conteúdo, comando, pressa, chute), a questão, o que aprendeu e a origem. Volta em +1, +7, +15 e +30 dias; "Lembrei" avança, "Não lembrei" recomeça amanhã; depois da 4ª lembrança sai da fila. Dois erros em aberto no mesmo tópico sugerem "Precisa revisar" (a pessoa confirma). Com 3 ou mais erros, mostra o motivo mais frequente e uma dica. O contador de Revisões soma os erros do dia. "Apagar todos os erros" (dois cliques, em qualquer plano) esvazia o caderno.
- **Simulados** (`/simulados`): no Pro, simulado no app com a prova oficial do Inep (caderno azul; prévia aprovada em `docs/previa-simulado.html`). Nas provas com `questionsUrl` (hoje Enem 2021, 2022 e 2023), as questões aparecem na tela: uma por vez, com o mapa das questões (ao lado no computador, num botão no celular), "Rever depois", anterior e próxima, e o resultado deixa revisar cada erro com a resposta certa. Nas outras, ou se a pessoa preferir, PDF oficial e cartão-resposta. Dá para fazer o dia inteiro ou uma área (45 questões). Pausar ou sair guarda tudo e mostra onde parou. Cronômetro com a regra do timer, correção pelo gabarito oficial (anulada sai do total, em branco é erro), registro como simulado e opção de mandar os erros para o caderno. Nunca invente gabarito: só transcreva o publicado pelo Inep e cubra com teste. Em qualquer plano, a pessoa registra acertos por área (45 questões cada), o tempo e uma observação. O Flow mostra acertos, a comparação com o simulado anterior e o ritmo em minutos por questão contra o tempo oficial (no 1º dia desconta 1h de redação). Nas provas oficiais feitas no Flow (área inteira), mostra a **nota estimada pela TRI** (`lib/tri.ts`): modelo de 3 parâmetros com D = 1, θ pela média a posteriori (priori normal padrão) e a escala fixa do Enem por área, com os parâmetros oficiais dos itens dos microdados do Inep (`lib/tri-items.ts`, 2021 a 2024, conferidos contra os gabaritos). Os itens que o Inep tirou do cálculo ficam de fora. A conta reproduz a nota oficial de candidatos reais com diferença de até 0,2 ponto (coberto por teste), mas a tela chama de estimativa. Nunca invente parâmetros nem estime nota de simulado registrado só com acertos.
- **Redação** (`/redacao`, gratuito): sem correção por IA (decisão do estudante: nenhuma IA no app). A pessoa registra tema, data e as notas por competência (0 a 200, de 40 em 40) que recebeu fora; o app mostra a última nota, as anteriores e a competência mais fraca nas últimas 3 corrigidas. Banco de repertório pessoal com busca sem acento. "Temas para treinar" (gratuito) sugere 3 temas de eixos diferentes ainda não escritos, começando pelos eixos menos treinados (muda a cada semana); "Ver todos" filtra por eixo. Cada tema traz só o título, o ano (temas oficiais do Enem) ou "Treino" (escritos para o Flow) e três perguntas para puxar a discussão; nunca copie textos motivadores. Escolher um tema abre "Registrar redação" com o tema preenchido.
- **Rascunho** (blocos de questões e simulado no app): um quadro de desenho por questão (`components/simulados/ScratchPad.tsx`, `<canvas>` sem biblioteca), com lápis, borracha, 3 cores do tema, 2 espessuras, desfazer e limpar; funciona com mouse, dedo e caneta. No computador fica ao lado da questão e ocupa toda a largura livre (a página perde o limite de 1180px enquanto há uma resolução aberta, via `data-wide`; no simulado, alternando com o mapa das questões); no celular, o botão "Rascunho" abre em tela cheia. Fica só na memória enquanto o app está aberto: não salva nem sincroniza.
- **Dia da prova** (`/prova`): checklist por dia (semana e véspera), marcado e salvo no aparelho. "Durante a prova" são só recomendações, sem marcar (ritmo de tempo, pular a questão que travar, fáceis primeiro). Remete ao edital e ao cartão de confirmação para as regras oficiais.
- **Lembrete de estudo** (Ajustes, gratuito): a pessoa escolhe o melhor horário (sincroniza) e liga os avisos em cada aparelho (pede a permissão de notificação). Avisa 1 hora antes, 30 minutos antes e na hora, só nos dias de estudo do cronograma, sem cobrança no texto. Com o app aberto, o navegador agenda o aviso (`useReminders`); com ele fechado, a função `send-reminders` (pg_cron a cada minuto, Web Push com VAPID em `_shared/webpush.ts`) manda pelo servidor. Os dois usam a mesma tag, então aparece um aviso só. Sair da conta desliga o push deste navegador.
- **Modo foco** no Timer (Pro, junto com o Pomodoro; no gratuito o timer fica no cronômetro e mostra um `ProNotice`): tela cheia só com o relógio. Depois da sessão, a pergunta opcional "se distraiu?" vira uma linha no resumo da semana.
- **Offline**: em produção, um service worker (`public/sw.js`) guarda as páginas e os arquivos do app; os dados já são locais.

**Painel** (prévia aprovada em `docs/previa-simplificada.html`)
- Só três blocos: "Estudar hoje", "Esta semana" e "Revisões" (as 3 próximas), mais uma linha com o ritmo. No celular, logo depois de "Estudar hoje", vêm os atalhos da Preparação (grade 3×2 com ícone e "Ver tudo" para `/preparacao`). O subtítulo traz o dia e a contagem para o Enem.
- "Estudar hoje": as matérias do dia (uma por linha, com "Dominei?" à direita), quantas foram dominadas e o tempo estudado hoje (sem meta), "Começar a estudar", "Dia leve" e uma linha com a revisão de hoje e os erros para rever. Sem plano, oferece organizar a semana ou estudar sem plano.
- "Esta semana" no Painel mostra só o total e as barras da semana atual; "Ver resumo" abre `/painel/resumo` ("Sua semana"), com as setas para semanas anteriores, a meta editável, o resumo e as horas por área.
- A semana vai de segunda a domingo, no fuso local. Setas para semanas anteriores; não há navegação para semanas futuras.
- Meta semanal em horas (padrão 25 h), sessões ou tópicos concluídos, editável sem reescrever histórico. Em horas, a meta diária é `meta / 7` e os dias que a atingem ficam com a barra na cor de destaque.
- Números vêm só de sessões registradas. Sem denominador válido, não mostre porcentagem. Estado vazio explica como começar.
- Sequência = dias consecutivos com estudo, contando hoje ou, se hoje ainda não teve estudo, a partir de ontem. É opcional (pode ser escondida em Ajustes) e discreta.
- Ritmo no Painel (uma linha que abre `/conquistas`): o nível pelas horas totais (até 10 h por dia contam, para não premiar a exaustão), a barra até o próximo e quantas conquistas a pessoa tem. Some junto com a sequência quando ela está escondida.
- `/conquistas`: a sequência atual, os últimos 7 dias marcados e a grade de conquistas (`ACHIEVEMENTS` em `lib/achievements.ts`), cada uma com ícone, nome, o que pede e o progresso enquanto bloqueada. Só usam dados que já existem (horas, maior sequência, sessões, tópicos, revisões, matérias dominadas, erros superados, cartões, simulados e nota estimada, blocos, redações, tabuada); conquista ganha não se perde. Ao registrar uma sessão que cruza uma meta de horas, o toast avisa.

**Conta e sincronização** (conta obrigatória; a cópia na nuvem é do Pro)
- No gratuito, a conta só dá entrada: os dados ficam no aparelho e nada sincroniza (`syncNow` confere `proAccessNow()` depois de ler o Pro da conta). Ajustes mostra um `ProNotice` no lugar do estado da sincronização. Ao assinar, o que já existe sobe na primeira sincronização.
- Sem login, o `AuthGate` mostra a tela de entrar no lugar do app. Entrar com e-mail e senha (mínimo de 8 caracteres) ou com o Google (o botão só aparece com `NEXT_PUBLIC_GOOGLE_LOGIN=true`, depois de ativar o provedor no Supabase). Criar conta pede o ano de nascimento (mínimo de 13 anos; menor de 18 confirma que um responsável sabe) e a confirmação de que leu privacidade e termos, e confirma o e-mail por link. Quem entra pelo Google responde ano e aceite depois do primeiro login. "Esqueci minha senha" manda um link que volta para Ajustes pedindo a senha nova. Ajustes mostra a conta, sair e excluir.
- Um registro por item na tabela `records` (`collection`, `id`, `data`, `deleted`, `updated_at` do aparelho, `synced_at` do servidor). Tema, som, consentimento de métricas e timer não sincronizam.
- Primeiro login: junta aparelho e conta; no mesmo registro, vence a conta. Depois, vence a mudança mais recente; empate, a nuvem. Apagar vira `deleted`. Dados de exemplo nunca sobem.
- Sair mantém os dados no aparelho. Outra conta no mesmo aparelho começa com os dados dela. "Apagar todos os dados" com conta apaga também na nuvem. "Excluir conta" apaga conta e nuvem e mantém o aparelho.

**Dados de exemplo**
- Conta nova começa vazia. Dados de exemplo salvos por versões antigas continuam com o aviso "Apagar e começar do zero" (dois cliques, sem `window.confirm`) e nunca sobem para a nuvem.

**Gratuito e Pro** (prévia aprovada em `docs/previa-pro.html`)
- Gratuito: áreas e tópicos, status, timer no cronômetro, sessões, revisões agendadas pela pessoa, caderno de erros, progresso, meta semanal, registro de simulados e redações, cronograma à mão e Painel das últimas 4 semanas (`FREE_HISTORY_WEEKS`). Nunca bloqueie isso.
- Pro, R$ 14,90/mês ou R$ 119,90/ano: cópia na nuvem e sincronização, Pomodoro e modo foco, cartões de memorização, revisões automáticas, sugestões do que mais cai, semana montada sozinha, resumo e evolução completos, histórico inteiro e simulado no app. O site público não mostra o preço; Planos, dentro do app, mostra.
- O que é do Pro aparece com `ProNotice` (o que faz e "Conhecer o Pro"), nunca escondendo dados já salvos. Ações da store que são do Pro conferem `proAccessNow()`.
- O acesso vem só do servidor (`entitlements`, gravada pelo webhook do Mercado Pago), com cópia no aparelho para valer offline até `proUntil`. `NEXT_PUBLIC_PRO_TRIAL` libera para todos em testes. Os botões de assinar só aparecem com `NEXT_PUBLIC_PAYMENTS_OPEN=true`; sem isso, Planos diz que ainda não dá para assinar.

**Métricas de validação**
- Eventos sem dado pessoal (`app_aberto`, `onboarding_concluido`, `onboarding_pulado`, `plano_gerado`, `sessao_registrada`, `revisao_concluida`, `pro_interesse`) com o dia e um código aleatório do navegador.
- Só saem com `NEXT_PUBLIC_ANALYTICS_URL` configurada **e** consentimento ativado em Ajustes (desligado por padrão).

## Hidratação

- O `localStorage` não existe no servidor. As páginas que leem a store renderizam um esqueleto até a hidratação do `persist` terminar (`useHydrated()`).
- O tema é aplicado antes da hidratação por um script inline no `<head>`, que lê o `localStorage` e define `data-theme`. Sem flash de tema errado.

## Design system

A identidade vem do logo e da paleta azul escolhida pelo estudante (#135487, #2F87B5, #47BCDF, #85B0C6, #B0E1F1). O visual é limpo, moderno e com pouca poluição visual: muito espaço, uma cor de ação e um único bloco de destaque por tela. Só o que pede ação tem contorno de 2px e sombra de carimbo (deslocada, sem desfoque, herdada do Clube do Filme): a faixa de destaque, o botão primário e o item ativo do menu. Os outros cards têm borda fina. Nada de gradientes, emojis ou ornamentos. A referência aprovada é `docs/previa-design.html`; novas telas reutilizam os mesmos tokens e componentes.

### Cores

As cores são variáveis CSS em `globals.css`, mapeadas no Tailwind (`bg-surface`, `text-muted`, etc.). Os componentes nunca usam hex direto nem variantes `dark:`, porque a troca de tema acontece só nas variáveis.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#f3f8fb` | `#061829` | fundo da página e da barra lateral |
| `surface` | `#ffffff` | `#0b2238` | cards, barra superior, abas |
| `hover` | `#e9f4f9` | `#102d48` | hover, botão secundário, trilho do segmented |
| `line` | `#dcebf2` | `#15344f` | divisórias e contorno de campos |
| `text` | `#0b2a42` | `#e6f3f9` | texto principal |
| `muted` | `#4f6f83` | `#85b0c6` | texto secundário |
| `accent` | `#135487` | `#47bcdf` | links, números, barras que atingiram a meta |
| `action` / `on-action` | `#135487` / branco | `#135487` / branco | botão primário, filtro e opção ativos |
| `mid` | `#2f87b5` | `#47bcdf` | só barras, trilhos preenchidos e bolinhas (sem contraste AA como texto) |
| `edge` | `#135487` | `#eef7fb` | contorno de 2px e sombra de carimbo |
| `hero` | `#0f4470` | `#135487` | faixa de destaque (Estudar hoje, topo da landing), com `hero-soft` #B0E1F1, `hero-bright` #47BCDF e `hero-edge` |
| `brand` | `#135487` | branco | nome FLOW no logo |
| `success` / `danger` | `#2e7d4f` / `#c42b3f` | `#6fcf97` / `#ff7a8a` | concluído; atrasos e alertas |
| `bar` / `track` | `#b0e1f1` / `#dcebf2` | `#1d4a6b` / `#15344f` | barras abaixo da meta; trilho de progresso |

O tema tem três estados: Automático (segue o sistema e não define `data-theme`), Claro e Escuro. Os blocos `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` e `:root[data-theme="dark"]` redefinem as variáveis.

### Tipografia

- **Saira** (Google Fonts, variável com eixo `wdth`) via `next/font/google`, variável CSS `--font-display`, utilitário `font-heading`.
- **Corpo:** pilha do sistema, 15px, line-height 1.45 (também nos tamanhos `text-xs`, `text-sm` e `text-base`).
- **Títulos de página (h1):** Saira 700, 26px no celular e 32px no computador, `font-stretch: 112%`. No Painel, o h1 é a saudação (Bom dia, Boa tarde, Boa noite).
- **Títulos de card (h2):** Saira 600, 18px, `font-stretch: 108%`.
- **Landing:** títulos de seção em caixa alta, Saira 700–800 expandida; benefícios numerados 01, 02, 03.
- **Títulos e metadados:** `"Página · Flow"`; a página inicial usa "Flow · Sua preparação para o ENEM, no ritmo certo."
- **Números de destaque:** o total de horas usa Saira itálico 800, 48px, `font-stretch: 120%`. O total da semana usa 56px. O relógio do timer usa Saira itálico 300, até 92px, `font-stretch: 120%`.
- Todo número em coluna ou que muda (horas, relógio, datas) usa `tabular-nums`.
- Itálico só no logo e nesses dois números.

### Logo (componente `Wordmark`)

Recriado em texto, nunca como imagem: o símbolo (quadrado azul `action` com o F em itálico, o mesmo de `app/icon.svg`, com contorno e carimbo) seguido de "FLOW" em Saira itálico 800, `font-stretch: 125%`, caixa alta, na cor `brand` (branco no tema escuro). Sobre a faixa azul, `onHero` deixa o nome branco nos dois temas. Tamanhos: 24px nas barras superiores, 30px na barra lateral e 64–88px em destaque (versão com slogan, sem símbolo, com "Sua preparação para o ENEM, / no ritmo certo." embaixo). `aria-label="Flow"`. Nomes internos (chave `enem-flow:v2`, pacote) continuam como estão para não perder dados.

### Forma e espaçamento

- Raios: cards 18px (faixa de destaque 22px), campos 10px, botões, busca, filtros e opções 999px.
- Cards comuns: borda de 1px `line`, sem sombra, raio 18px (16px no celular). Faixa de destaque: contorno `2px edge` e sombra de carimbo `4px 4px 0 edge`. Botão primário: contorno e carimbo de 3px, sobe 1px no hover e "afunda" ao clicar.
- Um único botão primário por tela; os outros são secundários (`hover`) ou ficam no menu "⋯". Links são texto `accent` sem sublinhado.
- Espaçamento interno: 24px nos cards (18px no celular). Gap de 24px entre cards e seções da tela (16px no celular).
- Botões: 36px de altura (44px nos principais), peso 600. Primário em `action`; secundário em `hover`.
- Status de tópico: bolinha colorida + texto (nunca só cor).

### Layout

- **Desktop (> 760px):** barra lateral fixa de 240px, sem fundo próprio, com o logo, os itens de navegação (ícone + texto) e, no rodapé, Ajustes e o seletor de aparência. Item ativo: fundo `surface`, contorno e carimbo. Conteúdo com até 1180px, 40px no topo e 48px à direita.
- **Celular (≤ 760px):** barra superior com o logo, Ajustes e o botão de tema (botões redondos com contorno) e um traço de 2px `edge` embaixo, mais uma barra inferior fixa com as abas (ícone + rótulo). Respeite as `safe-area-inset`.
- Navegação: Painel, Cronograma, Matérias, Timer, Revisões. Revisões mostra um contador vermelho com as pendentes de hoje + atrasadas (tópicos, erros e cartões) e tem três abas: Tópicos, Erros e Cartões. Questões, Simulados, Redação, Cartões, Tabuada e Dia da prova ficam num grupo discreto "Preparação" na barra lateral e, no celular, nos atalhos logo depois de "Estudar hoje" no Painel e na tela `/preparacao` (com Conquistas). A barra superior do celular tem borda fina e botões sem contorno; a aba ativa fica em `accent`. Timer mostra o tempo enquanto há uma sessão em andamento.
- Cada página abre com h1 + uma linha de subtítulo em `muted`.
- Formulários e listas longas usam o Drawer (folha inferior no celular).

### Textos

- Pouco texto explicando cada função: uma frase curta basta. Quem quiser entender o app vê o guia de boas-vindas (`WelcomeGuide`: 6 passos de uma frase, mostrado uma vez depois do onboarding, `guideSeen` sincroniza; "Ver o guia" em Ajustes reabre).

- Frases curtas e diretas. O botão diz o que faz ("Concluir", "Estudar no timer"), e o toast confirma em seguida ("Revisão concluída.").
- Erros dizem o que fazer: "Escolha o que você vai estudar."
- Datas como `dd/mm`. Use "Hoje", "Amanhã" e "Atrasada desde dd/mm" quando couber.
- Nada de culpa nem promessa: "Ficou para depois" em vez de "Você falhou"; nunca "garanta sua aprovação".

### Acessibilidade

- Foco visível (`outline: 2px solid accent`) em tudo que é clicável. Navegação completa por teclado.
- Controles de alternância usam `aria-pressed`. A navegação usa `aria-current="page"`. O drawer usa `role="dialog"` e `aria-modal`.
- Status nunca só por cor: sempre com texto.
- Respeite `prefers-reduced-motion`: sem transições.
- Contraste AA nos dois temas. Alvos de toque de pelo menos 36px.

## Pronto quando

- Todas as telas funcionam nos dois temas, em 400px e em 1440px, sem rolagem horizontal.
- `npm run build`, `npm run lint` e `npm test` passam.
- Testes cobrem: sincronização (junção, conflitos, primeiro login), revisões (agendar, reagendar, adiar, feedback, agendamento manual do gratuito), simulado oficial (gabaritos, correção, rascunho), idade mínima, tópicos (criar, editar, ocultar, excluir), migração (descarta padrões não usados), sessões (sem duplicar, sem pausa), cronograma (no máximo 2 matérias por dia e da mesma área, só em dias de estudo, regenera sem perder concluídas, repete o que não foi dominado, transfere o que não foi estudado sem passar de 2 por dia), estatísticas e migração v1 → v2.
- O `README.md` explica como rodar, onde os dados ficam e o que depende de configuração externa.
