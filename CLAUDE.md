# Flow

Organizador de estudos para estudantes do ensino médio e candidatos ao ENEM. A marca é **Flow**, com o slogan "Sua preparação para o ENEM, no ritmo certo." O nome ENEM nunca faz parte da marca: aparece só como o nome da prova (no slogan e em textos descritivos). O objetivo é organizar as matérias da semana e do dia e ajudar a lembrar das revisões, sem deixar a rotina rígida e sem limitar a carga horária de ninguém. Não é cursinho, não promete aprovação ou nota e não tem vínculo com INEP/MEC.

O escopo do produto está em `prompt_mestre_enem_flow_claude_code.md` (fase 2). O protótipo em `docs/prototype.html` continua sendo a referência visual e dos fluxos que ele já cobre. Se o prompt mestre e o protótipo divergirem, vale o prompt mestre.

**Sem backend.** Um único usuário, dados no `localStorage` do navegador. Nada de prometer sincronização entre dispositivos. Recursos que dependem de servidor (cobrança do Pro, coleta de métricas, lista de interesse) ficam com a camada desacoplada pronta e documentados como pendentes no README; nunca simule compra ou assinatura.

## Stack

- Next.js (App Router) + TypeScript com `strict: true`
- Tailwind CSS v4 (tokens em `app/globals.css` via `@theme inline`)
- Zustand com o middleware `persist` para o estado
- Vitest para testes das funções puras e da store
- `lucide-react` para ícones
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
  (site)/               landing (/), /privacidade, /termos: sem a navegação do app
  (app)/layout.tsx      AppShell
  (app)/painel, cronograma, materias, timer, revisoes, ajustes, planos, comecar (onboarding)
  globals.css           tokens de cor e tipografia
components/
  ui/                   componentes genéricos (Button, Card, Drawer, Toast, Segmented...)
  shell/                Sidebar, TabBar, Wordmark, ThemeSelect, avisos globais
  painel/ cronograma/ materias/ timer/ revisoes/ ajustes/ planos/ onboarding/ site/
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
  plan.ts               gratuito x Pro (acesso liberado durante o teste), lista de interesse, contato
  *.test.ts
store/
  study-store.ts        ações, persist e aviso de falha ao salvar
  state.ts              tipo StudyData e estado vazio
  migrate.ts            leitura do localStorage, migração v1 → v2 e backup
  analytics.ts          eventos de uso: só com endpoint configurado e consentimento
  demo-data.ts
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
  stage: 1 | 2 | 3 | 4; due: string; done?: string;            // datas 'YYYY-MM-DD'
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

O estado completo (`StudyState`, `version: 2`) guarda `topics`, `progress`, `sessions`, `tasks`, `timer`, a meta (`goal: { type: 'horas' | 'sessoes' | 'topicos'; value }`), as preferências de cronograma (dias de estudo de segunda a domingo, áreas prioritárias e difíceis, data-alvo, estratégia), o onboarding e as preferências de interface (tema, som, sequência visível).

- IDs estáveis. Tópicos novos usam `custom-…`; os que vieram da lista antiga mantêm `${areaId}-${índice}` (`mat-3`). Nunca use o nome como chave.
- Ao carregar dados antigos, os tópicos padrão que nunca foram usados (sem progresso, sessão nem tarefa) são descartados; os usados ficam.
- Chave do `localStorage`: `enem-flow:v2`. Se ela não existir, migre de `enem-flow:v1` (formato do protótipo) e deixe a v1 intacta como cópia de segurança.
- JSON corrompido: guarde o texto bruto em `enem-flow:v2:corrompido` e comece do zero sem quebrar a aplicação.
- Falha ao salvar (cota, modo privado): avise na interface e ofereça tentar de novo.

## Regras de negócio

**Matérias**
- O app não traz tópicos prontos, nem nos dados de exemplo, só as cinco áreas: Matemática, Linguagens, Ciências da Natureza, Ciências Humanas e Redação. O estudante decide o que estuda e quanto estuda.
- Natureza se divide em Química, Física e Biologia; Humanas em Geografia, História, Filosofia e Sociologia. Todo tópico dessas áreas pertence a uma matéria (`subjectId`), e a tela de Matérias agrupa por ela. Tarefas e sessões guardam a matéria do tópico.
- O estudante cria, edita, oculta, reexibe e exclui tópicos (excluir pede confirmação e não apaga sessões, que passam a aparecer como "Tópico excluído").
- Ocultar não apaga sessões, revisões nem progresso; tópicos ocultos saem das listas e do cronograma até serem reexibidos.
- Busca por nome; filtros por área, status e prioridade; ordenação por nome, prioridade, status ou próxima revisão.

**Revisão espaçada**
- Ao marcar um tópico como Concluído, agende 4 revisões a partir de hoje: +1, +7, +15 e +30 dias.
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
- O cronograma organiza, não limita: não existe duração por matéria nem limite de horas. A pessoa escolhe só em quais dias estuda (dias de estudo), as áreas prioritárias e difíceis, a data-alvo opcional e a estratégia (equilibrada ou foco nas prioridades).
- Cada dia de estudo recebe **no máximo 2 matérias** (revisões contam como matéria), **sempre do mesmo assunto**: dia de Matemática tem até duas de Matemática, nunca Matemática e Linguagens; dia de Química tem até duas de Química, nunca Química e Biologia. A área inteira ("Ciências da Natureza (geral)") cabe com qualquer matéria dela. Estudar as duas não é obrigatório.
- Ordem de escolha: revisões vencidas ou do dia, tópicos "Precisa revisar", "Em andamento" e "Não iniciado", pesando prioridade do tópico, áreas prioritárias e áreas pouco contempladas na semana. Tópicos ocultos e concluídos ficam de fora. O que não couber na semana aparece como pendente.
- Regenerar mantém tarefas concluídas, iniciadas, manuais, repetições e transferidas; substitui só as geradas e ainda planejadas a partir de hoje. Antes, mostra quantas serão trocadas.
- Começar uma matéria abre o Timer no cronômetro, sem limite de tempo. O foco registrado com a tarefa ativa soma em `focusSec` e a tarefa fica "iniciada". O tempo nunca conclui a tarefa.
- Ao terminar, o app pergunta "Você sente que dominou?". **Dominei**: a tarefa conclui e o tópico vira Concluído (agendando as revisões) ou, se era revisão, a revisão é concluída. **Ainda não dominei**: a tarefa do dia fecha e a matéria é repetida no próximo dia de estudo (de preferência amanhã).
- O que ficou sem estudar em dias anteriores passa **sozinho** para o próximo dia de estudo, ao abrir o app, com um aviso. Sem linguagem de culpa.
- Repetições e transferências respeitam o limite de 2 por dia: se o dia já está cheio, uma tarefa gerada e ainda não começada sai para dar lugar; tarefas manuais, iniciadas ou concluídas nunca saem. Sem dia livre em duas semanas, a tarefa fica adiada.
- A pessoa ainda pode mover ou adicionar uma matéria em outro dia (com menos de 2 e da mesma área), baixar a prioridade ou deixar para outra semana.
- Quem não quiser cronograma usa o app manualmente.

**Painel**
- "Estudar hoje" fica no topo: as matérias do dia, quantas foram dominadas, o tempo estudado hoje (sem meta), botão para começar, "Dominei?" e a próxima revisão. Sem plano, oferece organizar a semana ou estudar sem plano.
- A semana vai de segunda a domingo, no fuso local. Setas para semanas anteriores; não há navegação para semanas futuras.
- Meta semanal em horas (padrão 25 h), sessões ou tópicos concluídos, editável sem reescrever histórico. Em horas, a meta diária é `meta / 7` e os dias que a atingem ficam com a barra na cor de destaque.
- Números vêm só de sessões registradas. Sem denominador válido, não mostre porcentagem. Estado vazio explica como começar.
- Sequência = dias consecutivos com estudo, contando hoje ou, se hoje ainda não teve estudo, a partir de ontem. É opcional (pode ser escondida em Ajustes) e discreta.

**Dados de exemplo**
- Na primeira visita (sem nada salvo), carregue dados de exemplo (só sessões por área e matéria, sem tópicos) e mostre um aviso com "Apagar e começar do zero". A confirmação acontece na própria interface (dois cliques), sem `window.confirm`.

**Gratuito e Pro**
- Gratuito: áreas e tópicos, status, timer, sessões, revisões, progresso, meta semanal e Painel. Nunca bloqueie isso.
- Pro experimental, R$ 19,90/mês: cronograma avançado, reorganização sugerida, estatísticas detalhadas. Sem provedor de pagamento e sem backend, tudo fica liberado durante o teste e a tela de planos diz isso com transparência. O acesso Pro nunca é decidido só pelo frontend em produção (`lib/plan.ts`).

**Métricas de validação**
- Eventos sem dado pessoal (`app_aberto`, `onboarding_concluido`, `onboarding_pulado`, `plano_gerado`, `sessao_registrada`, `revisao_concluida`, `pro_interesse`) com o dia e um código aleatório do navegador.
- Só saem com `NEXT_PUBLIC_ANALYTICS_URL` configurada **e** consentimento ativado em Ajustes (desligado por padrão).

## Hidratação

- O `localStorage` não existe no servidor. As páginas que leem a store renderizam um esqueleto até a hidratação do `persist` terminar (`useHydrated()`).
- O tema é aplicado antes da hidratação por um script inline no `<head>`, que lê o `localStorage` e define `data-theme`. Sem flash de tema errado.

## Design system

A identidade vem do logo: azul-marinho sobre off-white, com tipografia expandida em itálico. O visual é limpo e corporativo: superfícies brancas sobre fundo claro, uma cor de ação, muito espaço em branco e nada de gradientes, emojis ou ornamentos. Novas telas reutilizam os mesmos tokens e componentes; não crie um segundo sistema visual.

### Cores

As cores são variáveis CSS em `globals.css`, mapeadas no Tailwind (`bg-surface`, `text-muted`, etc.). Os componentes nunca usam hex direto nem variantes `dark:`, porque a troca de tema acontece só nas variáveis.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#f4f3ee` | `#0b111c` | fundo da página |
| `surface` | `#ffffff` | `#131b2a` | cards, barra lateral, painel lateral |
| `hover` | `#efeee8` | `#1c2638` | hover, botão secundário, trilho do segmented |
| `line` | `#e3e2db` | `#253047` | divisórias |
| `text` | `#0f1b2d` | `#e8ebf1` | texto principal |
| `muted` | `#5b6475` | `#9aa5b8` | texto secundário |
| `accent` | `#14213d` | `#dfe6f3` | botão primário, aba ativa, progresso, barras que atingiram a meta |
| `accent-soft` | `#e4e8f0` | `#1f2b42` | fundo do item ativo, pill "Em andamento" |
| `on-accent` | `#ffffff` | `#0f1b2d` | texto sobre `accent` |
| `success` / `success-soft` | `#2e7d4f` / `#e3f1e8` | `#6fcf97` / `#17301f` | pill "Concluído", indicadores positivos |
| `danger` | `#c42b3f` | `#ff7a8a` | atrasos, contador de revisões, alertas |
| `bar` | `#dcdfe6` | `#253047` | trilho de progresso, barras abaixo da meta |

O tema tem três estados: Automático (segue o sistema e não define `data-theme`), Claro e Escuro. Os blocos `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` e `:root[data-theme="dark"]` redefinem as variáveis.

### Tipografia

- **Saira** (Google Fonts, variável com eixo `wdth`) via `next/font/google`, variável CSS `--font-display`, utilitário `font-heading`.
- **Corpo:** pilha do sistema, 15px, line-height 1.45 (também nos tamanhos `text-xs`, `text-sm` e `text-base`).
- **Títulos de página (h1):** Saira 700, 26px, `font-stretch: 112%`.
- **Títulos de card (h2):** Saira 600, 17px, `font-stretch: 108%`.
- **Títulos e metadados:** `"Página · Flow"`; a página inicial usa "Flow · Sua preparação para o ENEM, no ritmo certo."
- **Números de destaque:** o total de horas usa Saira itálico 800, 48px, `font-stretch: 120%`. O relógio do timer usa Saira itálico 300, até 92px, `font-stretch: 120%`.
- Todo número em coluna ou que muda (horas, relógio, datas) usa `tabular-nums`.
- Itálico só no logo e nesses dois números.

### Logo (componente `Wordmark`)

Recriado em texto, nunca como imagem: "FLOW" em Saira itálico 800, `font-stretch: 125%`, em caixa alta. Tamanhos: 24px nas barras superiores, 32px na barra lateral e 64–88px em destaque. A versão com slogan põe "Sua preparação para o ENEM, / no ritmo certo." centralizado embaixo, em Saira itálico 400 com `letter-spacing: .08em`. Cor `text`, `aria-label="Flow"`. Nomes internos (chave `enem-flow:v2`, pacote) continuam como estão para não perder dados.

### Forma e espaçamento

- Raios: cards 12px, botões e inputs 8px, pills e filtros 999px.
- Sombra dos cards: `0 1px 2px rgba(15,27,45,.06), 0 1px 3px rgba(15,27,45,.04)`. Sem borda nos cards.
- Espaçamento interno: 20px nos cards (16px no celular). Gap de 20px entre cards.
- Botões: 36px de altura (44px no timer e no painel lateral), peso 600. Primário em `accent`; secundário em `hover`.

### Layout

- **Desktop (> 760px):** barra lateral fixa de 240px com o logo, os itens de navegação (ícone + texto) e, no rodapé, Ajustes e o seletor de aparência. Conteúdo com até 1180px e 32px de margem lateral.
- **Celular (≤ 760px):** barra superior com o logo, Ajustes e o botão de tema, mais uma barra inferior fixa com as abas (ícone + rótulo). Respeite as `safe-area-inset`.
- Navegação: Painel, Cronograma, Matérias, Timer, Revisões. O item ativo fica com fundo `accent-soft`. Revisões mostra um contador vermelho com as pendentes de hoje + atrasadas. Timer mostra o tempo enquanto há uma sessão em andamento.
- Cada página abre com h1 + uma linha de subtítulo em `muted`.
- Formulários e listas longas usam o Drawer (folha inferior no celular).

### Textos

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
- Testes cobrem: revisões (agendar, reagendar, adiar, feedback), tópicos (criar, editar, ocultar, excluir), migração (descarta padrões não usados), sessões (sem duplicar, sem pausa), cronograma (no máximo 2 matérias por dia e da mesma área, só em dias de estudo, regenera sem perder concluídas, repete o que não foi dominado, transfere o que não foi estudado sem passar de 2 por dia), estatísticas e migração v1 → v2.
- O `README.md` explica como rodar, onde os dados ficam e o que depende de configuração externa.
