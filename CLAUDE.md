# ENEM Flow

Organizador pessoal de estudos para o ENEM. Um único usuário, sem backend: todos os dados ficam no `localStorage`. O protótipo aprovado está em `docs/prototype.html`. Ele é a referência de comportamento, textos e visual. Em caso de dúvida, faça igual a ele.

## Stack

- Next.js (App Router) + TypeScript com `strict: true`
- Tailwind CSS v4 (tokens em `app/globals.css` via `@theme inline`)
- Zustand com o middleware `persist` para o estado
- Vitest para testes das funções puras
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
- Lógica de datas, revisões e estatísticas fica em funções puras em `lib/`, sem tocar em React nem no `localStorage`. Componentes só leem a store e chamam ações.
- Todo texto da interface em português do Brasil.
- Não deixe código morto, `console.log`, nem arquivos de exemplo do create-next-app.

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
  layout.tsx          fontes, script de tema, AppShell
  page.tsx            redireciona para /painel
  painel/page.tsx
  materias/page.tsx
  timer/page.tsx
  revisoes/page.tsx
  globals.css         tokens de cor e tipografia
components/
  ui/                 Button, Card, Pill, Segmented, ProgressBar, Drawer, Toast, EmptyState
  shell/              Sidebar, TabBar, Wordmark, ThemeSelect
  painel/ materias/ timer/ revisoes/
lib/
  syllabus.ts         áreas e tópicos (estático)
  dates.ts            chave YYYY-MM-DD local, addDays, mondayOf, shortDate
  reviews.ts          scheduleReviews, nextReview, pendingReviews
  stats.ts            horas por dia, por área, sequência de dias
  timer.ts            elapsed, phaseSeconds, isIdle
  *.test.ts
store/
  study-store.ts
docs/
  prototype.html
```

## Modelo de dados

```ts
type AreaId = 'mat' | 'lin' | 'nat' | 'hum' | 'red';
type TopicStatus = 'nao' | 'and' | 'concluido';

interface Review { stage: 1 | 2 | 3 | 4; due: string; done?: string }   // datas 'YYYY-MM-DD'
interface TopicProgress { status: TopicStatus; mastery: 0 | 1 | 2 | 3 | 4 | 5; completedAt?: string; reviews: Review[] }
interface StudySession { id: string; topicId: string; date: string; sec: number; mode: 'pomodoro' | 'cronometro'; ts: number }
interface TimerState {
  mode: 'pomodoro' | 'cronometro'; focus: number; brk: number;      // minutos
  phase: 'focus' | 'break'; running: boolean;
  startedAt: number; banked: number;                                // ms do último início; segundos acumulados antes dele
  topicId: string;
}
interface StudyState {
  version: 1; demo: boolean; progress: Record<string, TopicProgress>;
  sessions: StudySession[]; goal: number; theme: 'system' | 'light' | 'dark'; timer: TimerState;
}
```

IDs de tópico: `${areaId}-${índice}`, por exemplo `mat-3`. Chave do `localStorage`: `enem-flow:v1`, compatível com o protótipo.

## Regras de negócio

**Revisão espaçada**
- Ao marcar um tópico como Concluído, agende 4 revisões a partir de hoje: +1, +7, +15 e +30 dias.
- Ao tirar de Concluído, remova as revisões não feitas e mantenha as já feitas.
- Ao reconcluir, mantenha as feitas e agende só as etapas restantes a partir de hoje, com os intervalos da própria etapa.
- "Revisões de hoje" = a próxima revisão não feita de cada tópico com `due <= hoje`. As atrasadas aparecem num grupo separado, acima.

**Timer**
- Tempo decorrido = `banked + (agora − startedAt) / 1000` enquanto roda. Nunca conte segundos com `setInterval`: o intervalo só repinta a tela. Isso mantém o tempo certo com a aba em segundo plano e permite continuar após recarregar a página (o estado do timer é persistido).
- Pausar: `banked = elapsed`, `running = false`.
- Fim de um bloco de foco no Pomodoro: registra uma sessão com a duração do foco, toca um aviso curto (Web Audio, sem arquivos) e começa a pausa automaticamente.
- Fim da pausa: volta para foco, parado.
- Finalizar: registra o tempo decorrido se for de pelo menos 1 minuto e zera o timer.
- Pausas nunca contam como estudo.
- Registrar uma sessão num tópico "Não iniciado" muda o status para "Em andamento".
- Não deixa iniciar sem um tópico escolhido. Não deixa trocar de modo ou de duração com sessão em andamento.
- O `AudioContext` só pode ser criado no clique de Iniciar (regra dos navegadores).

**Painel**
- A semana vai de segunda a domingo, no fuso local.
- Meta semanal padrão: 25 h, editável. A meta diária é `meta / 7`. Os dias que atingem a meta diária ficam com a barra na cor de destaque.
- Setas para ver semanas anteriores. Não há navegação para semanas futuras.
- Sequência = dias consecutivos com estudo, contando hoje ou, se hoje ainda não teve estudo, a partir de ontem.

**Dados de exemplo**
- Na primeira visita (sem nada salvo), carregue dados de exemplo e mostre um aviso com "Apagar e começar do zero". A confirmação acontece na própria interface (dois cliques), sem `window.confirm`.

## Hidratação

- O `localStorage` não existe no servidor. As páginas que leem a store renderizam um esqueleto até a hidratação do `persist` terminar (`useStore.persist.hasHydrated()` ou `onFinishHydration`).
- O tema é aplicado antes da hidratação por um script inline no `<head>`, que lê o `localStorage` e define `data-theme`. Sem flash de tema errado.
- Se o JSON salvo estiver corrompido, comece do zero sem quebrar a aplicação.

## Design system

A identidade vem do logo: azul-marinho sobre off-white, com tipografia expandida em itálico. O visual é limpo e corporativo: superfícies brancas sobre fundo claro, uma cor de ação, muito espaço em branco e nada de gradientes, emojis ou ornamentos.

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
| `success` / `success-soft` | `#2e7d4f` / `#e3f1e8` | `#6fcf97` / `#17301f` | pill "Concluído" |
| `danger` | `#c42b3f` | `#ff7a8a` | atrasos, contador de revisões |
| `bar` | `#dcdfe6` | `#253047` | trilho de progresso, barras abaixo da meta |

O tema tem três estados: Automático (segue o sistema e não define `data-theme`), Claro e Escuro. Os blocos `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` e `:root[data-theme="dark"]` redefinem as variáveis.

### Tipografia

- **Saira** (Google Fonts, variável com eixo `wdth`) via `next/font/google`: `Saira({ subsets: ['latin'], axes: ['wdth'], style: ['normal', 'italic'], variable: '--font-display' })`.
- **Corpo:** pilha do sistema (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`), 15px, line-height 1.45.
- **Títulos de página (h1):** Saira 700, 26px, `font-stretch: 112%`.
- **Títulos de card (h2):** Saira 600, 17px, `font-stretch: 108%`.
- **Números de destaque:** o total de horas usa Saira itálico 800, 48px, `font-stretch: 120%` (eco do "ENEM" do logo). O relógio do timer usa Saira itálico 300, até 92px, `font-stretch: 120%` (eco do "FLOW").
- Todo número em coluna ou que muda (horas, relógio, datas) usa `tabular-nums`.
- Itálico só no logo e nesses dois números. O resto da interface não usa itálico.

### Logo (componente `Wordmark`)

Recriado em texto, nunca como imagem:
- "ENEM": Saira itálico 800, `font-stretch: 125%`, 30px (22px no topo do celular).
- "FLOW": Saira itálico 300, `font-stretch: 125%`, 12px (9px no celular), `letter-spacing: .45em`, alinhado à direita embaixo de "ENEM" e compensando o espaçamento final com `margin-right: -.45em`.
- Cor `text`, com `aria-label="ENEM Flow"`.

### Forma e espaçamento

- Raios: cards 12px, botões e inputs 8px, pills e filtros 999px.
- Sombra dos cards: `0 1px 2px rgba(15,27,45,.06), 0 1px 3px rgba(15,27,45,.04)`. Sem borda nos cards.
- Espaçamento interno: 20px nos cards (16px no celular). Gap de 20px entre cards.
- Botões: 36px de altura (44px no timer e no painel lateral), peso 600. Primário em `accent`; secundário em `hover`.

### Layout

- **Desktop (> 760px):** barra lateral fixa de 240px com o logo, os 4 itens de navegação (ícone + texto) e o seletor de aparência no rodapé. Conteúdo com até 1180px e 32px de margem lateral.
- **Celular (≤ 760px):** barra superior com o logo e um botão de tema, mais uma barra inferior fixa com as 4 abas (ícone + rótulo). Respeite as `safe-area-inset`.
- Navegação: Painel, Matérias, Timer, Revisões. O item ativo fica com fundo `accent-soft`. Revisões mostra um contador vermelho com as pendentes de hoje + atrasadas. Timer mostra o tempo restante enquanto há uma sessão em andamento.
- Cada página abre com h1 + uma linha de subtítulo em `muted`.

### Telas

- **Painel:** grid 1.7fr / 1fr (uma coluna abaixo de 1000px). À esquerda, o card "Esta semana": intervalo de datas, setas, total de horas, meta editável, barra de progresso, "% da meta", sequência de dias e gráfico de 7 barras com a linha tracejada da meta diária. À direita, o card "Por área" (barras finas) e o card "Próximas revisões" (4 itens + "Ver todas").
- **Matérias:** filtros em pills por área e um card por área, com cabeçalho (nome, X/Y e progresso fino). As linhas servem só para leitura: nome do tópico, próxima revisão em `muted`, "Nível N" e um pill de status. **Nenhum controle de edição na lista.** Clicar numa linha abre o **painel lateral**.
- **Painel lateral (Drawer):** abre à direita no desktop (420px) e como folha inferior no celular. Mostra a área, o nome do tópico, um Segmented de status, um Segmented de domínio de 1 a 5 (com o rótulo Muito fraco, Fraco, Razoável, Bom ou Domina), o calendário das 4 revisões (feita, atrasada ou data) e o botão primário "Estudar no timer". Fecha com Esc, no X ou clicando no fundo escurecido. O foco vai para o painel ao abrir.
- **Timer:** duas colunas (uma abaixo de 1000px). Card do timer: Segmented Pomodoro/Cronômetro, fase, relógio grande, barra fina de progresso da fase, select de tópico agrupado por área, durações de foco e pausa (só no Pomodoro) e os botões Iniciar/Pausar/Continuar, Finalizar e Pular pausa. Card "Hoje": sessões do dia com horário, duração e botão de excluir.
- **Revisões:** cards "Atrasadas", "Hoje" e "Próximos 7 dias". Cada item mostra o tópico, a área, "Revisão N de 4" e a data. Os vencidos têm os botões "Estudar" (abre o timer com o tópico) e "Concluir". Quando não há nada pendente, mostre o estado vazio "Tudo em dia".
- **Toast:** um só por vez, na parte de baixo, fundo escuro, some em cerca de 2,5 s. Use para confirmar ações: sessão registrada, revisões agendadas, revisão concluída, sessão excluída.

### Textos

- Frases curtas e diretas. O botão diz o que faz ("Concluir", "Estudar no timer"), e o toast confirma em seguida ("Revisão concluída.").
- Erros dizem o que fazer: "Escolha o que você vai estudar."
- Datas como `dd/mm`. Use "Hoje", "Amanhã" e "Atrasada desde dd/mm" quando couber.

### Acessibilidade

- Foco visível (`outline: 2px solid accent`) em tudo que é clicável.
- Controles de alternância usam `aria-pressed`. A navegação usa `aria-current="page"`. O drawer usa `role="dialog"` e `aria-modal`.
- Respeite `prefers-reduced-motion`: sem transições.
- Contraste AA nos dois temas.

## Pronto quando

- Todas as telas se comportam como no protótipo, nos dois temas, em 400px e em 1440px.
- `npm run build`, `npm run lint` e `npm test` passam.
- Testes cobrem: agendamento e reagendamento de revisões, início da semana, horas por dia e por área, sequência e tempo decorrido do timer com pausa.
- O `README.md` explica em poucas linhas como rodar o projeto e onde os dados ficam.
