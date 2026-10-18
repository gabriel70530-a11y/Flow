# Dossiê de Inovação Flow

Product discovery com estudantes do ENEM e de vestibulares. Data: 18/10/2026. Os logs parciais estão em `log-insights-01.md` e `log-insights-02.md`.

## Como a pesquisa foi feita (e seus limites)

- Foram 40 buscas com termos variados, mais leitura de reportagens com depoimentos, pesquisas (Terra Insights com 63 mil estudantes, Pisa 2022, PNAD/TIC Educação, estudo de burnout de 2026 com 770 pré-vestibulandos), artigos acadêmicos e reclamações indexadas de concorrentes (ReclameAqui, lojas de apps, sites de avaliação).
- **Reddit, X, TikTok e Discord não puderam ser lidos diretamente:** o acesso automático é bloqueado e o ReclameAqui responde 403. Os sinais dessas redes vêm de reportagens e estudos que falam delas. Antes de investir em projetos grandes, vale validar com entrevistas reais (roteiro no fim).
- Contexto de data: o **Enem 2026 é em 8 e 15 de novembro**, a 3 e 4 semanas desta pesquisa.

---

## 1. Mapa de dores (top 10)

| # | Dor | Evidência | Intensidade |
|---|---|---|---|
| 1 | **Não saber por onde começar nem o que estudar hoje** | Professores dizem que o gargalo é a rotina, não o conteúdo. Sem ponto de partida, o estudante procrastina ou estuda "de forma desesperada". | Muito alta |
| 2 | **Falta de tempo e cansaço** (escola integral, trabalho, igreja, cursinho) | "Um dos meus maiores desafios seja a falta de tempo" (estudante de 17 anos, escola integral). Quem trabalha dorme cerca de 6h. Trabalho é o maior motivo de evasão de cursinhos populares. | Muito alta |
| 3 | **Esquecer o que já estudou** enquanto avança | "Manter os conteúdos frescos na memória" (estudante de 18 anos). A solução hoje é improvisada: Anki, planilhas, templates pagos no Notion e na Hotmart. | Alta |
| 4 | **Cronogramas irreais que quebram na primeira semana** | Planos por horas fixas falham. Ferretto: cronograma "que a plataforma não ajuda a montar". O Geekie prometia personalização e não entregava (TCC da UFPB). | Alta |
| 5 | **Matemática e base fraca** | 52% apontam Matemática como a mais difícil. Há cerca de 90 pontos de diferença entre escola pública e privada. Matemática básica é cerca de 37% da prova. | Alta |
| 6 | **Ansiedade, culpa e "estou fazendo o suficiente?"** | Aparece em todos os relatos. O burnout se associa à baixa regulação emocional. Redes sociais romantizam a exaustão. | Alta |
| 7 | **Distração com o celular** | 80% dos estudantes brasileiros se distraem com o celular nas aulas de matemática (Pisa 2022). Checar mensagens quebra o foco sem a pessoa perceber. | Média-alta |
| 8 | **Redação: correção lenta, cara e incoerente; repertório sem critério** | Prazos de 3 a 7 dias, créditos que expiram, corretores com orientações contraditórias. O problema do repertório é escolher e conectar, não falta de conteúdo. | Média-alta |
| 9 | **Nota TRI opaca e falta de treino de prova inteira** | "Acertei mais e tirei menos." Com 10 acertos, a nota varia até 385 pontos. Estreantes erram na gestão de tempo (cerca de 3 min por questão). O segundo dia cansa. | Média |
| 10 | **Plataformas pagas frustram e prendem** | Apps com bugs (vídeo trava e volta ao início), suporte por robô, renovação automática, estorno negado, "plataforma bagunçada". | Média |

Fator transversal: **acesso**. Na rede pública, quem está conectado usa quase só o celular (99,7%), e muitos não têm internet em casa. Isso favorece app leve, que funciona no celular e offline.

---

## 2. Análise de lacunas do mercado

O mercado se divide em três grupos:

- **Conteúdo pago:** Descomplica, Ferretto, Aprova Total, Stoodi, Me Salva!, Estuda.com.
- **Gratuito e oficial:** MEC Enem, com simulados, correção de redação por IA em cerca de 60s e plano de estudos, mais o corretor da Folha.
- **Improviso:** Notion, Anki, planilhas, cadernos de erros no papel.

| O que todos prometem | O que acontece de verdade | Lacuna para o Flow |
|---|---|---|
| "Cronograma personalizado" | É um calendário por horas fixas que não se adapta a um dia ruim. Quando atrasa, o plano vira culpa. | Plano que **encolhe e estica sozinho** e trata atraso como normal. O Flow já faz parte disso (repetição e transferência). |
| "Revisão" | Fica a cargo do aluno, num app separado (Anki) ou numa planilha. | Revisões espaçadas **nativas, ligadas ao que foi estudado e aos erros**. |
| "Banco com 40 mil questões" | Volume não vira aprendizado. Ninguém ajuda a lembrar do que **errou**. | **Caderno de erros** integrado ao plano e às revisões. |
| "Correção de redação" | Já é comoditizada e gratuita (MEC, Folha). Competir nisso é caro e sem diferencial. | Não competir. Organizar **o treino** de redação: frequência, temas feitos, competências a melhorar, repertório próprio. |
| "Estatísticas de desempenho" | Taxa de acerto por matéria, sem dizer o que fazer com ela. | Transformar dados em **uma decisão do dia**: "hoje, revise X". |
| "Gamificação" | Sequências e rankings que geram ansiedade e medo de perder. | Constância **sem punição**. A sequência do Flow já é discreta e opcional. |
| "Plano grátis" | Funções essenciais ficam bloqueadas, e cancelar é difícil. | Gratuito de verdade, sem cadastro, sem cobrança escondida. O Flow já é assim. |
| "Feito para todos" | Pressupõe tempo, internet boa e computador. | **Celular primeiro e offline**, pensado para quem trabalha ou está em escola integral. |

**Posicionamento recomendado:** o Flow não ensina; ele **orquestra**. Aulas, questões e correção sobram e são grátis. Falta alguém que diga "hoje é isto, revise aquilo, você já errou isso duas vezes", sem culpa e sem exigir horas fixas.

---

## 3. Roadmap de funcionalidades

As regras do produto continuam valendo: sem backend, dados no navegador, sem limite de horas, até 2 matérias por dia, sem culpa e sem promessa de nota. Cada proposta indica a dor que resolve. A marcação **[backend]** indica que a proposta depende de servidor e precisa ficar como camada pendente, como o Pro.

### Quick wins (dias a 2 semanas, sem backend)

1. **Modo Reta Final** (dores 1, 9 e 6). Ligado à data-alvo, aparece nas últimas 4 semanas.
   - Contagem regressiva discreta.
   - Os dias passam a priorizar revisões e tópicos "Precisa revisar", em vez de tópicos novos.
   - Um botão "Simulado de hoje" registra uma prova inteira no timer: 5h30, 90 questões, dia 1 ou dia 2.
   - **Urgente: a prova é em 3 semanas.**
2. **Dia leve / "hoje estou cansado"** (dores 2 e 6). No Painel, um toque reduz o dia para 1 matéria curta ou só a revisão mais vencida. A outra passa para o próximo dia de estudo pela mesma regra de transferência que já existe. Texto sem culpa: "Dia leve. O resto foi para quinta."
3. **Registro rápido de erro** (dor 3, fase 1 do caderno de erros). Ao terminar uma sessão ou na tela do tópico: "Errei uma questão".
   - Motivo: conteúdo, interpretação do comando, distração/pressa ou chute.
   - Nota curta opcional.
   - O tópico com 2 erros ou mais sugere "Precisa revisar".
   - Não precisa de banco de questões: o estudante resolve onde quiser (MEC Enem, livro) e registra no Flow.
4. **Prioridade pelo que mais cai** (dores 1 e 5). Ao criar um tópico, chips de sugestão opcionais: "matemática básica", "ecologia", "eletrodinâmica", "interpretação de texto". Não são tópicos prontos; o estudante toca para criar. Isso respeita a regra de não trazer tópicos predefinidos e reduz a página em branco.
   - **Decisão do produto:** confirmar com o Gabriel, porque mexe na regra de não ter tópicos predefinidos.
5. **Modo foco no timer** (dor 7). Ao começar, tela cheia com o relógio e "Deixe o celular de lado". Depois da sessão, uma pergunta opcional: "Se distraiu?" (sim/não). O resultado vira um dado na semana, sem julgamento.
6. **Checklist do dia da prova** (dores 9 e 6). Página com: documento com foto, caneta preta transparente, cartão-confirmação, horário dos portões, rota, lanche e sono, plano de tempo (3 min por questão, pular o que trava, varredura inicial) e dicas para o cansaço do segundo dia. Funciona offline e é marcável.
7. **PWA instalável e offline** (fator acesso). O manifest já existe. Falta um service worker para abrir sem internet, já que os dados já são locais. É um diferencial grande para quem usa dados móveis.
8. **Frase de fechamento do dia, sem culpa** (dor 6). Ao fim do dia: "Hoje você estudou 50 min de Química. Isso conta." Se não estudou: "Amanhã tem Física. Um passo de cada vez." Nada de porcentagem vermelha.

### Projetos complexos (semanas, alguns com backend)

1. **Caderno de erros completo com revisão espaçada própria** (dores 3, 5 e 9). Cada erro vira um cartão: enunciado ou foto, resposta certa, por que errei. Os cartões têm revisões +1/+7/+15/+30, como os tópicos, e entram no "Estudar hoje" junto das revisões. Há uma visão por tipo de erro ("você erra mais por interpretação") que vira sugestão concreta. Fotos ficam em IndexedDB e não precisam de backend. **Este é o maior diferencial possível.**
2. **Plano adaptativo de verdade** (dores 2 e 4). A pessoa informa a disponibilidade real por dia (em categorias como "dia cheio", "dia médio", "dia livre", não em horas), e o gerador usa isso: dia cheio recebe 1 matéria ou só revisão. O plano aprende com o histórico: se quarta nunca rende, sugere tirar quarta.
3. **Treino de redação organizado** (dor 8). Registro de cada redação feita: tema, data, nota estimada pela competência 1–5 (vinda do MEC Enem ou de onde o estudante corrigiu) e o que melhorar. Revisões espaçadas dos pontos fracos e um banco de repertório pessoal (citação, fonte, temas onde serve). O Flow não corrige; organiza a evolução.
4. **Simulados com análise de tempo e cansaço** (dor 9). O estudante registra o horário em que terminou cada bloco e os acertos por área. O Flow mostra onde o tempo estourou e se o desempenho cai no fim, e explica a TRI em linguagem simples ("errar fácil e acertar difícil derruba a nota"), sem calcular nota oficial.
5. **Estudar junto, sem rede social** (dores 6 e 7) **[backend]**. Sala de foco com 2 a 5 amigos por código: cada um vê que o outro está estudando (só o status, sem conteúdo nem ranking). Atende o pedido por grupos de estudo (Discord, cursinho) sem a pressão de comparação.
6. **Lembretes que respeitam a pessoa** (dores 1 e 2) **[backend para push com o app fechado]**. Um lembrete por dia no horário escolhido, com a matéria do dia, e nenhum se já estudou. Sem enxurrada de notificações, que sobrecarregam segundo estudo citado.
7. **Sincronização e backup na nuvem opcional** **[backend]**. Hoje o backup é por arquivo. Com login opcional (gov.br ou e-mail), os dados passariam entre celular e computador. É pré-requisito do Pro real.
8. **Assistente que pergunta, não responde** (dores 3 e 5) **[backend/IA]**. Gera perguntas de recordação ativa a partir do nome e da descrição do tópico do estudante, sem entregar a resposta pronta, porque especialistas alertam que a dependência de IA prejudica a interpretação. Fica como camada Pro desacoplada.

### Ordem sugerida

1. **Agora, antes de 8/11:** Modo Reta Final, checklist do dia da prova, dia leve, PWA offline.
2. **Logo depois da prova** (público de 2027 começa a planejar em jan/fev): registro rápido de erro, modo foco, fechamento do dia sem culpa.
3. **1º semestre de 2027:** caderno de erros completo, plano adaptativo, treino de redação.
4. **Com backend:** sincronização, lembretes push, estudar junto, assistente de perguntas.

---

## 4. Validação sugerida (antes dos projetos grandes)

Entrevistar de 5 a 8 estudantes (escola pública integral, quem trabalha, quem já faz cursinho) com perguntas abertas:

1. "Me conta como foi a sua última semana de estudo."
2. "Quando o plano furou, o que você fez?"
3. "Como você lembra do que errou?"
4. "Que app você abandonou e por quê?"
5. "Se tivesse 20 minutos hoje, o que estudaria?"

Validar principalmente o **caderno de erros** e o **dia leve**.

## Fontes principais

- [Jornal da Paraíba: desafios de estudantes para o Enem 2026](https://jornaldaparaiba.com.br/educacao/enem-2026-veja-os-principais-desafios-de-estudantes-na-reta-final-de-preparacao)
- [Lavemo Enem: estudantes relatam desafios](https://lavemoenem.com.br/enem-2026-estudantes-relatam-principais-desafios-na-preparacao-para-prova/)
- [Terra Insights: Matemática é a maior dificuldade](https://www.terra.com.br/noticias/educacao/enem/candidatos-ao-enem-tem-maior-dificuldade-em-matematica-aponta-pesquisa,42380ef7bbaf99e93856c9765cd22a43nawodav1.html)
- [ReclameAqui: Ferretto, reclamação de aluno](https://www.reclameaqui.com.br/professor-ferreto/nao-assinem-o-curso-do-ferretto_VfhUQY0rPR4ieE3N/)
- [ReclameAqui: plataforma bagunçada e banco de questões fraco](https://www.reclameaqui.com.br/fernanda-pessoa-curso/reclamacao-sobre-curso-online-plataforma-baguncada-banco-de-questoes-inutil-e-aulas-incompletas_GgAQQf0S1GjWD6vG/)
- [ReclameAqui: Corrija-me, incoerência entre corretores e cancelamento](https://www.reclameaqui.com.br/corrija-me-servicos-educacionais/cancelamento_nueWpsafjz7hsjt7/)
- [B2B Stack: avaliações do Descomplica](https://www.b2bstack.com.br/product/descomplica/avaliacoes)
- [QueroBolsa: avaliação dos alunos do Descomplica](https://querobolsa.com.br/descomplica/avaliacao-dos-alunos)
- [Cupom Online: Descomplica vale a pena](https://www.cupomonline.com.br/descomplica-e-bom/)
- [Agência Brasil: app MEC Enem](https://agenciabrasil.ebc.com.br/educacao/noticia/2025-10/enem-aplicativo-do-mec-traz-simulados-e-correcao-de-redacoes)
- [BBC/O Povo: IA na preparação para o Enem](https://www.opovo.com.br/agencia/bbc/2025/11/12/como-ia-pode-ajudar-estudantes-a-se-preparar-para-o-enem.html)
- [Psicologia: Ciência e Profissão, burnout em pré-vestibulandos (2026)](https://pepsic.bvsalud.org/pdf/pcp/v46/1982-3703-pcp-46-e284672.pdf)
- [Bem Paraná: celular e estudos (Pisa 2022)](https://www.bemparana.com.br/bem-estar/estudos-celular-ajuda/)
- [Senado/O Globo: acesso à internet na rede pública](https://www2.senado.leg.br/jspui/bitstream/id/573362/1/noticia.html)
- [A Gazeta: variação de nota na TRI](https://www.agazeta.com.br/brasil/nota-de-quem-erra-so-uma-questao-no-enem-pode-variar-ate-92-pontos-0121)
- [CNN Brasil: tempo no segundo dia](https://www.cnnbrasil.com.br/educacao/enem-2025-saiba-como-organizar-seu-tempo-no-segundo-dia-de-prova/)
- [Vestibulando Web: assuntos que mais caem](https://www.vestibulandoweb.com.br/enem/assuntos-que-mais-caem-no-enem-por-disciplina/)
- [Blog do Vestibular: revisar sem reler (caderno de erros)](https://www.blogdovestibular.com/enem/como-revisar-enem-2026-sem-reler-todo-material.html)
- [Caderno de Erros (plataforma)](https://www.cadernodeerros.com.br/)
- [UNESP: evasão em cursinho popular](https://www2.unesp.br/proex/congressos/5congresso/fscommand/web/docs/455.pdf)
- [Gazeta do Povo: quem trabalha e estuda para o Enem](https://www.gazetadopovo.com.br/educacao/enem/a-vida-em-dobro-dos-estudantes-que-trabalham-e-estudam-para-o-enem-0876h3sxu9ncj1o1bn54rhfl2)
- [Repositório UFPB: Geekie Games e personalização](https://repositorio.ufpb.br/jspui/handle/123456789/14165)
- [Aprova Total: cronograma personalizado](https://aprovatotal.com.br/lp/cronograma-personalizado/)
- [Repositório UFMG: repertório sociocultural](https://repositorio.ufmg.br//bitstreams/7d064f0f-d465-471d-b810-0054f56ab3b9/download)
- [Jornal de Brasília: Pé-de-Meia e Enem 2026](https://jornaldebrasilia.com.br/noticias/brasil/enem-2026-estudante-do-pe-de-meia-e-isento-da-taxa-de-inscricao/)
- [UHigh Midway: sequência do Duolingo](https://uhighmidway.com/22290/features/duo-dedication-app-serves-as-a-game-rather-than-an-education/)
- [Tribuna de Minas: TikTok e estudos](https://tribunademinas.com.br/colunas/maistendencias/?p=46812)
