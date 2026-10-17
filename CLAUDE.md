# ENEM Flow

Organizador de estudos para estudantes do ensino médio e candidatos ao ENEM: "Menos caos. Mais flow nos estudos." Ajuda a saber o que estudar hoje, organizar matérias, seguir um cronograma realista, registrar sessões e fazer revisões. Não é cursinho, não promete aprovação ou nota e não tem vínculo com INEP/MEC.

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
  syllabus.ts           áreas e tópicos padrão (estático, só semente)
  topics.ts             lista de tópicos do usuário: criar, editar, ocultar, restaurar padrão
  dates.ts              chave YYYY-MM-DD local, addDays, mondayOf, shortDate
  reviews.ts            agendamento, conclusão, adiamento e reagendamento de revisões
  sessions.ts           criação e validação de sessões
  planner.ts            geração e reorganização do cronograma
  stats.ts              horas por dia, por área, metas, sequência, planejado x realizado
  timer.ts              elapsed, phaseSeconds, isIdle
  plan.ts               gratuito x Pro (acesso liberado durante o teste)
  analytics.ts          eventos de validação (no-op sem endpoint configurado)
  *.test.ts
store/
  study-store.ts        estado, ações e persist
  migrate.ts            leitura do localStorage e migração v1 → v2
  demo-data.ts
```

## Modelo de dados (v2)

```ts
type AreaId = 'mat' | 'lin' | 'nat' | 'hum' | 'red';
type TopicStatus = 'nao' | 'and' | 'concluido' | 'revisar';
type Priority = 'alta' | 'media' | 'baixa';

interface TopicRecord {                      // tópicos padrão e personalizados, na ordem de exibição
  id: string; areaId: AreaId; name: string; description: string;
  priority: Priority; hidden: boolean; origin: 'padrao' | 'personalizado';
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
interface PlanTask {
  id: string; topicId: string | null; areaId: AreaId | null; kind: 'estudo' | 'revisao';
  date: string | null; minutes: number; priority: Priority;    // date null = adiada sem data
  status: 'planejada' | 'iniciada' | 'concluida' | 'adiada'; origin: 'gerada' | 'manual';
  focusSec: number;
}
```

O estado completo (`StudyState`, `version: 2`) guarda `topics`, `progress`, `sessions`, `tasks`, `timer`, a meta (`goal: { type: 'horas' | 'sessoes' | 'topicos'; value }`), as preferências de cronograma (disponibilidade em minutos de segunda a domingo, duração da sessão, áreas prioritárias e difíceis, data-alvo, estratégia), o onboarding e as preferências de interface (tema, som, sequência visível).

- IDs estáveis. Tópicos padrão mantêm `${areaId}-${índice}` (`mat-3`); personalizados usam `custom-…`. Nunca use o nome como chave.
- Chave do `localStorage`: `enem-flow:v2`. Se ela não existir, migre de `enem-flow:v1` (formato do protótipo) e deixe a v1 intacta como cópia de segurança.
- JSON corrompido: guarde o texto bruto em `enem-flow:v2:corrompido` e comece do zero sem quebrar a aplicação.
- Falha ao salvar (cota, modo privado): avise na interface e ofereça tentar de novo.

## Regras de negócio

**Matérias**
- Os 44 tópicos padrão aparecem sem cadastro. São uma estrutura de organização, não o conteúdo oficial do ENEM.
- O estudante pode criar, editar, ocultar e reexibir tópicos; só os personalizados podem ser excluídos, com confirmação, e a exclusão não apaga sessões (elas passam a aparecer como "Tópico excluído").
- Ocultar não apaga sessões, revisões nem progresso; tópicos ocultos saem das listas e do cronograma até serem reexibidos.
- "Restaurar lista padrão" reexibe os padrões ocultos e devolve nome, descrição e área originais. Antes, mostra o que vai mudar e pede confirmação. Não duplica nem mexe em personalizados, progresso ou histórico.
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
- É preciso escolher o que estudar: um tópico ou "Estudo geral" (sem área).
- Registrar uma sessão num tópico "Não iniciado" muda o status para "Em andamento". Sessão concluída nunca marca o tópico como concluído.
- Depois de registrar, ofereça a reflexão opcional (Entendi bem, Entendi parcialmente, Preciso revisar, Tive dificuldade). As duas últimas sugerem marcar o tópico como "Precisa revisar".
- Não deixa trocar de modo ou de duração com sessão em andamento.
- O `AudioContext` só pode ser criado no clique de Iniciar (regra dos navegadores).

**Cronograma**
- Disponibilidade por dia da semana (0 = descanso), duração preferida da sessão, áreas prioritárias e difíceis, data-alvo opcional e estratégia (equilibrada ou foco nas prioridades).
- O gerador nunca põe num dia mais minutos do que a disponibilidade e não encolhe sessões para caber. O que não couber aparece como pendente, com sugestão de redistribuição.
- Ordem de escolha: revisões vencidas ou do dia, tópicos "Precisa revisar", "Em andamento" e "Não iniciado", pesando prioridade do tópico, áreas prioritárias e áreas pouco contempladas na semana. Tópicos ocultos e concluídos ficam de fora.
- Regenerar mantém tarefas concluídas, iniciadas e manuais; substitui só as geradas e ainda planejadas a partir de hoje. Antes, mostra quantas serão trocadas.
- Começar uma tarefa abre o Timer com o tópico e a duração da tarefa como foco. O foco registrado com a tarefa ativa soma em `focusSec`; a tarefa fica "iniciada" ao começar e "concluída" quando `focusSec` alcança a duração ou quando o estudante conclui manualmente.
- Tarefas de dias passados não concluídas aparecem como "não feitas" com opções: reagendar para um dia com espaço livre, dividir em duas sessões menores, baixar a prioridade ou deixar para outra semana. Nada é movido sem o estudante aceitar. Sem linguagem de culpa.
- Quem não quiser cronograma usa o app manualmente.

**Painel**
- "Estudar hoje" fica no topo: tarefas do dia, progresso do dia (foco registrado hoje x minutos planejados), botão para começar, próxima revisão. Sem plano, oferece criar um ou estudar sem plano.
- A semana vai de segunda a domingo, no fuso local. Setas para semanas anteriores; não há navegação para semanas futuras.
- Meta semanal em horas (padrão 25 h), sessões ou tópicos concluídos, editável sem reescrever histórico. Em horas, a meta diária é `meta / 7` e os dias que a atingem ficam com a barra na cor de destaque.
- Números vêm só de sessões registradas. Sem denominador válido, não mostre porcentagem. Estado vazio explica como começar.
- Sequência = dias consecutivos com estudo, contando hoje ou, se hoje ainda não teve estudo, a partir de ontem. É opcional (pode ser escondida em Ajustes) e discreta.

**Dados de exemplo**
- Na primeira visita (sem nada salvo), carregue dados de exemplo e mostre um aviso com "Apagar e começar do zero". A confirmação acontece na própria interface (dois cliques), sem `window.confirm`.

**Gratuito e Pro**
- Gratuito: tópicos, personalização, status, timer, sessões, revisões, progresso, meta semanal e Painel. Nunca bloqueie isso.
- Pro experimental, R$ 19,90/mês: cronograma avançado, reorganização sugerida, estatísticas detalhadas. Sem provedor de pagamento e sem backend, tudo fica liberado durante o teste e a tela de planos diz isso com transparência. O acesso Pro nunca é decidido só pelo frontend em produção.

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
- **Números de destaque:** o total de horas usa Saira itálico 800, 48px, `font-stretch: 120%`. O relógio do timer usa Saira itálico 300, até 92px, `font-stretch: 120%`.
- Todo número em coluna ou que muda (horas, relógio, datas) usa `tabular-nums`.
- Itálico só no logo e nesses dois números.

### Logo (componente `Wordmark`)

Recriado em texto, nunca como imagem: "ENEM" em Saira itálico 800, `font-stretch: 125%`, 30px (22px no celular); "FLOW" em Saira itálico 300, 12px (9px no celular), `letter-spacing: .45em`, alinhado à direita embaixo, com `margin-right: -.45em`. Cor `text`, `aria-label="ENEM Flow"`.

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
- Testes cobrem: revisões (agendar, reagendar, adiar, feedback), tópicos (criar, editar, ocultar, restaurar sem duplicar), sessões (sem duplicar, sem pausa), cronograma (respeita disponibilidade, regenera sem perder concluídas, atraso não sobrecarrega o dia seguinte), estatísticas e migração v1 → v2.
- O `README.md` explica como rodar, onde os dados ficam e o que depende de configuração externa.
