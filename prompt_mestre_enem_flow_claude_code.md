# PROMPT MESTRE --- ENEM FLOW PARA CLAUDE CODE

## Evolução completa do aplicativo existente

**Instrução central:** examine o repositório antes de alterar qualquer
coisa. Evolua o ENEM Flow que já existe; não o reescreva do zero sem
necessidade. Preserve funcionalidades e dados, implemente recursos reais
(não apenas telas decorativas), teste cada etapa e documente
dependências externas. O aplicativo deve ficar pronto para validação com
estudantes, sem prometer aprovação ou nota específica no ENEM.

------------------------------------------------------------------------

## 1. Produto, público e proposta de valor

O ENEM Flow é uma ferramenta de organização para estudantes do ensino
médio e candidatos ao ENEM. Sua promessa é: **"Menos caos. Mais flow nos
estudos."** Ajuda o estudante a saber o que estudar hoje, organizar
matérias e tópicos, seguir um cronograma realista, registrar sessões,
acompanhar progresso e realizar revisões.

O produto não é um cursinho e não deve prometer aprovação, nota,
resultado garantido ou vínculo oficial com INEP/MEC.

Modelo comercial a validar: - **Gratuito:** ferramentas essenciais
úteis, sem bloquear artificialmente o uso. - **Flow Pro:** preço
experimental de **R\$ 19,90/mês**, para planejamento avançado e
estatísticas detalhadas. - Não simular pagamento ou assinatura. Sem
provedor de pagamentos configurado, criar integração desacoplada e
explicar o que falta configurar.

## 2. Estado atual e identidade visual a preservar

O aplicativo já tem quatro seções principais: **Painel, Matérias, Timer
e Revisões**, além de seletor de aparência/tema. Preserve a navegação e
os fluxos existentes.

### Visual

-   Tema escuro: fundo quase preto/azul-marinho; cards azul-marinho;
    bordas azul-acinzentadas discretas.
-   Texto principal branco, secundário azul-acinzentado.
-   Azul-claro para destaque e verde para conclusão/indicadores
    positivos; vermelho/rosa apenas para alertas importantes.
-   Estética minimalista, moderna, tecnológica, jovem e organizada.
-   Logotipo "ENEM" em destaque e "FLOW" menor e espaçado abaixo.
-   Cantos arredondados, espaçamento consistente, hierarquia tipográfica
    clara.
-   Evitar traços pesados, gradientes chamativos, excesso de sombras,
    animações desnecessárias e aparência infantil.
-   Reutilize tokens, componentes, ícones e estilos existentes; não crie
    um segundo sistema visual.

### Painel atual

Possui título e data, card "Esta semana", horas estudadas, meta semanal
editável, barra de progresso, gráfico por dia, meta diária, card "Por
área" com Matemática, Linguagens, Ciências da Natureza, Ciências Humanas
e Redação, e card "Próximas revisões".

### Matérias atual

Possui contagem de tópicos concluídos, filtros por área, disciplinas e
tópicos agrupados, status "Não iniciado", "Em andamento" e "Concluído",
progresso por disciplina e informações de revisão. Preserve os tópicos
existentes (incluindo a estrutura atual de 44 tópicos, se for a que está
no repositório).

### Timer atual

Possui Pomodoro e Cronômetro, foco padrão de 25 minutos, duração de
pausa configurável, seleção de tópico, botões Iniciar/Finalizar e
sessões de hoje.

### Revisões atual

Possui revisões programadas para 1, 7, 15 e 30 dias após concluir um
tópico, estado vazio "Tudo em dia" e lista de próximos sete dias.
Preserve a regra base, tornando-a interativa e robusta.

------------------------------------------------------------------------

## 3. Como trabalhar no repositório

1.  Antes de editar, inspecione a stack, estrutura de pastas, rotas,
    componentes, dependências, banco, autenticação, persistência, testes
    e fluxos existentes.
2.  Apresente um resumo curto da arquitetura e um plano incremental;
    depois continue a implementação, salvo se houver uma decisão
    realmente bloqueadora.
3.  Não presuma framework ou banco. Use o que o projeto já possui.
4.  Não reescreva tudo nem faça refatorações amplas sem necessidade.
5.  Preserve dados e funcionalidades existentes. Não remova recursos sem
    justificar e oferecer alternativa.
6.  Não invente APIs, credenciais, dados reais, resultados ou
    integrações.
7.  Não deixe botões importantes sem ação nem marque funções como
    implementadas se forem apenas mockups.
8.  Trate loading, erro, sucesso, estado vazio, confirmação e falha de
    salvamento.
9.  Garanta responsividade, acessibilidade básica e navegação por
    teclado.
10. Evite duplicação por cliques repetidos e valide entradas, datas,
    durações e metas.
11. Não exponha chaves, tokens, senhas ou segredos no frontend ou
    repositório.
12. Execute os testes e verificações disponíveis; corrija regressões.
13. Ao final, informe o que mudou, arquivos modificados, como
    executar/testar e integrações pendentes.
14. Não pare apenas em um plano: implemente as etapas possíveis
    diretamente no projeto. Não peça aprovação para cada alteração
    pequena e reversível.
15. Se algo depender de decisão ou serviço externo, implemente a parte
    segura e possível e documente exatamente o que falta.

------------------------------------------------------------------------

## 4. Matérias: pré-configuradas e personalizáveis

**Decisão de produto: matérias e tópicos vêm pré-configurados, mas o
estudante pode personalizar.** Não obrigue a pessoa a criar toda a
estrutura antes de começar; também não prenda o usuário a uma lista
imutável.

Use as cinco áreas: Matemática, Linguagens, Ciências da Natureza,
Ciências Humanas e Redação. Preserve e reutilize as disciplinas/tópicos
já existentes. Não declare que a lista é o conteúdo oficial completo do
ENEM sem validação; apresente-a como estrutura de organização.

### Implementar

-   Criar, editar, ocultar, reexibir e, quando apropriado, excluir
    tópicos personalizados.
-   Definir nome, descrição opcional, área/disciplina, prioridade
    (alta/média/baixa) e nível de domínio.
-   Status: Não iniciado, Em andamento, Concluído e Precisa revisar.
-   Buscar por nome; filtrar por área, status e prioridade; ordenar por
    nome, prioridade, status ou próxima revisão.
-   Mostrar contagens e progresso por área/disciplina.
-   Botão claro "Personalizar matérias" ou "Gerenciar tópicos".
-   Restaurar lista padrão com confirmação e sem duplicar itens.
-   Distinguir itens padrão e personalizados se útil.
-   Usar IDs estáveis, não o nome como chave.
-   Alterar o nome não pode quebrar as revisões nem o histórico.
-   Ocultar não pode apagar sessões, anotações, estatísticas ou
    revisões.
-   Restaurar padrões não deve sobrescrever alterações silenciosamente.
-   Permitir recuperar itens ocultos e explicar claramente ações
    destrutivas.

------------------------------------------------------------------------

## 5. Onboarding inicial opcional

Criar um onboarding curto, opcional e fácil de pular. Perguntas
sugeridas: 1. Curso/área desejada (opcional). 2. Tempo disponível em
cada dia da semana. 3. Áreas mais difíceis e mais fortes. 4. Data
pretendida da prova, se conhecida. 5. Preferência entre plano sugerido e
organização manual.

Permitir pular, editar respostas depois e ver um resumo editável antes
de gerar o plano. Não exigir dados excessivos nem inferir chances de
aprovação. Não codificar uma data de prova vencida como se fosse atual;
permitir configurar a data de referência.

------------------------------------------------------------------------

## 6. Cronograma personalizado --- prioridade principal

Este é o maior diferencial a construir. O estudante deve conseguir
responder: **"O que eu estudo hoje?"**

### Configurações

-   Disponibilidade por dia da semana, inclusive zero minutos/dia de
    descanso.
-   Duração preferida das sessões.
-   Meta semanal em horas ou sessões.
-   Áreas prioritárias, matérias difíceis e tópicos que precisam de
    reforço.
-   Data-alvo opcional.
-   Preferência entre distribuição equilibrada ou foco nas prioridades.

### Lógica de planejamento

Gerar um cronograma realista usando: - Tempo disponível em cada dia. -
Duração estimada de cada sessão/tópico. - Prioridade do estudante. -
Tópicos não iniciados/em andamento. - Revisões vencidas ou próximas. -
Áreas pouco contempladas no plano recente. - Dias de descanso e meta
semanal.

Nunca colocar mais tarefas do que cabem no tempo disponível. Se não
couber tudo, mostrar o que ficou pendente e sugerir redistribuição; não
comprimir sessões irrealisticamente. Não marcar tópico como concluído só
por aparecer no cronograma.

### Interface e ações

-   Visualização semanal e lista de tarefas por dia.
-   Tópico, área, duração estimada, prioridade e estado.
-   Estados: Planejada, Iniciada, Concluída e Adiada.
-   Botão "Começar" que abre o Timer com o tópico e duração corretos.
-   Concluir, reagendar, reorganizar e regenerar cronograma.
-   Preservar tarefas concluídas ao regenerar.
-   Não duplicar tarefas nem apagar histórico.
-   Explicar o que será alterado antes de mudanças grandes.

### Reorganização sem culpa

Se o estudante perder um dia ou não concluir uma tarefa: - Oferecer
reagendar, dividir em sessões menores, reduzir prioridade ou deixar para
outra semana. - Não transferir todas as tarefas automaticamente para o
dia seguinte se exceder a disponibilidade. - Permitir aceitar ou
rejeitar a sugestão. - Não usar linguagem culpabilizadora.

------------------------------------------------------------------------

## 7. Tela "Estudar hoje"

Integrar ao Painel uma seção destacada "Estudar hoje" ou "Seu plano de
hoje", de preferência entre os primeiros elementos da tela.

Mostrar: - Data, meta diária e progresso do dia. - Tarefas de hoje com
área, tópico, duração, prioridade e estado. - Botão "Começar a
estudar". - Opção de adiar/reagendar. - Próxima revisão relevante. -
Resumo das tarefas concluídas.

Comportamento: - "Começar" abre Timer já configurado com o tópico. - Ao
concluir sessão, atualizar o progresso do dia. - Sessão concluída não
significa automaticamente tópico dominado. - Se não houver plano,
oferecer criação rápida, adição de tarefa ou seleção manual. - Se a meta
já foi atingida, permitir continuar estudando. - Se o estudante não
configurar cronograma, ainda deve poder usar o app manualmente.

------------------------------------------------------------------------

## 8. Painel e estatísticas confiáveis

Preservar "Esta semana", gráfico semanal, meta e "Por área". Adicionar
ou aperfeiçoar: - Horas efetivamente estudadas na semana. - Meta semanal
e percentual concluído. - Planejado versus realizado. - Tempo por
área/disciplina. - Sessões concluídas. - Tópicos iniciados/concluídos. -
Tarefas de hoje e próximas revisões. - Consistência recente com regra
explícita. - Comparação semanal quando houver dados suficientes.

Regras: - Calcular a partir de sessões válidas, nunca de números de
exemplo apresentados como reais. - Não contar pausas como foco nem
sessões canceladas como concluídas. - Não duplicar sessões. - Separar
tempo planejado de tempo real. - Não mostrar porcentagens sem
denominador válido. - Em estado vazio, explicar como começar. - Permitir
editar metas sem recarregar e sem reescrever histórico. - Gráfico com
dias legíveis e navegação entre semanas se viável. - Datas e começo/fim
da semana consistentes com fuso local. - Não inventar dados para
preencher gráficos. - Indicadores de área fraca ou pouco estudada devem
ser sugestões, não diagnósticos ou previsões de nota.

------------------------------------------------------------------------

## 9. Timer: Pomodoro e Cronômetro

Preservar os dois modos, seleção do tópico e registro de sessões.

### Pomodoro

-   Duração de foco e pausa configuráveis.
-   Iniciar, pausar, retomar e finalizar.
-   Ao terminar foco, oferecer início de pausa; ao terminar pausa,
    oferecer próximo foco.
-   Aviso sonoro discreto opcional, com opção de desativar se
    implementado.
-   O timer não pode depender somente de decrementos frágeis que falham
    com a aba em segundo plano. Usar timestamps e estado persistido
    conforme a arquitetura.
-   Recuperar ou encerrar coerentemente após recarregar a página.

### Cronômetro

-   Iniciar, pausar, retomar e finalizar.
-   Tempo decorrido correto, inclusive com aba em segundo
    plano/recarregamento.
-   Não contar pausas como foco.

### Registro de sessão

Guardar: - ID estável. - Tópico associado (opcional). -
Área/disciplina. - Início/fim. - Tempo efetivo de foco. - Modo
utilizado. - Estado: concluída, interrompida ou cancelada. - Nota
opcional.

Não permitir duração negativa, não contar pausas e não criar registros
duplicados em cliques repetidos. Sessões sem tópico podem ser "Estudo
geral", sem atribuição artificial a uma área.

Ao finalizar, oferecer reflexão opcional: - "Entendi bem" - "Entendi
parcialmente" - "Preciso revisar" - "Tive dificuldade"

Usar resposta como sinal para sugerir revisão, nunca para declarar
automaticamente domínio. As sessões alimentam o Painel; concluir uma
sessão não conclui automaticamente o tópico. Integrar com a tarefa
diária por regra clara.

------------------------------------------------------------------------

## 10. Revisões espaçadas e adaptáveis

Preservar os intervalos padrão atuais: **1, 7, 15 e 30 dias** após
concluir um tópico. Tratar isso como estratégia padrão configurável, não
como garantia universal.

Organizar a tela em: - Atrasadas. - Para hoje. - Próximos sete dias. -
Futuras, quando necessário.

Cada item mostra tópico, área/disciplina, etapa da revisão, data
prevista e estado. Permitir iniciar, concluir, adiar e reagendar.

Ao concluir, perguntar opcionalmente: - Lembrei bem. - Lembrei
parcialmente. - Tive dificuldade.

Usar o feedback para recomendar reforço/revisão; não alterar datas
futuras silenciosamente. Evitar duplicatas para o mesmo tópico/etapa.
Concluir uma revisão altera apenas a revisão correspondente. Revisões
atrasadas continuam visíveis até serem concluídas ou reagendadas.
Ocultar tópicos não apaga revisões. Preservar histórico após
reagendamento. Tratar corretamente viradas de mês/ano e fuso horário.
Estado vazio deve ser útil, por exemplo "Nenhuma revisão para hoje", com
acesso ao planejamento.

------------------------------------------------------------------------

## 11. Metas semanais flexíveis e motivação saudável

Permitir metas por horas, sessões ou tópicos. O estudante pode ajustar a
meta à rotina. Não tratar descanso como falha, não exigir sequência
diária e não punir alteração de meta. Permitir reorganizar tarefas
atrasadas. Evitar notificações insistentes ou culpabilizadoras. Se
houver streak, que seja opcional e discreto. Usar mensagens positivas
sem exagero de gamificação.

------------------------------------------------------------------------

## 12. Plano gratuito e Pro

### Gratuito

-   Matérias/tópicos predefinidos.
-   Criar tópicos personalizados.
-   Alterar status.
-   Timer Pomodoro e cronômetro.
-   Registro de sessões.
-   Revisões básicas.
-   Progresso básico.
-   Meta semanal básica.
-   Uso essencial do Painel.

### Pro experimental --- R\$ 19,90/mês

-   Cronograma personalizado avançado.
-   Reorganização sugerida da semana.
-   Estatísticas detalhadas.
-   Análise ampliada de prioridades/dificuldades.
-   Planejamento/visualização avançados de revisões.
-   Outros recursos premium somente quando implementados de verdade.

Não tornar o gratuito inútil artificialmente. Não anunciar recurso que
ainda não existe como se estivesse disponível. Se o Pro ainda estiver em
validação, mostrar "preço experimental" ou "lista de interesse" com
transparência.

### Pagamento

-   Inspecionar se já existe provedor configurado.
-   Não inventar credenciais e nunca guardar dados de cartão
    diretamente.
-   Não marcar assinatura como ativa apenas com estado do frontend.
-   Validar status no backend quando houver backend.
-   Tratar pagamento recusado, cancelamento, renovação e falhas se a
    integração estiver implementada.
-   Exibir preço, cobrança, cancelamento e reembolso claramente.
-   Sem provedor, deixar a camada desacoplada e documentar o que falta;
    não simular compra bem-sucedida.

------------------------------------------------------------------------

## 13. Validação comercial com estudantes

Preparar o produto para um teste inicial com **20--30 estudantes**.
Medir: - Quantos concluem onboarding. - Quantos criam/aceitam
cronograma. - Quantos retornam no sétimo dia. - Quantos concluem
sessões. - Quantos usam revisões. - Quantos demonstram interesse no
Pro. - Quantos efetivamente pagam, quando a cobrança real estiver
disponível. - Motivos de abandono e feedback.

Não tratar intenção declarada como compra. Não afirmar que uma amostra
pequena representa todo o mercado. A meta inicial é validar uso
recorrente e disposição real a pagar, não escalar imediatamente.

------------------------------------------------------------------------

## 14. Landing page e comunicação comercial

Se houver landing page, evoluí-la sem destruir a identidade. Se não
houver, criar página coerente com o app.

### Mensagem

Título: **"Menos caos. Mais flow nos estudos."** Subtítulo sugerido:
"Transforme sua meta de passar no ENEM em um plano de ação. Organize as
matérias, descubra o que estudar hoje e acompanhe sua evolução --- um
dia de cada vez."

### Seções

-   Hero com CTA.
-   Prévia realista do painel, identificada como ilustrativa quando usar
    dados fictícios.
-   Benefícios: cronograma, próxima tarefa, timer, revisões, evolução e
    rotina flexível.
-   Como funciona em três passos: informar rotina, organizar semana,
    acompanhar progresso.
-   Planos gratuito e Pro.
-   Perguntas frequentes.
-   CTA final.
-   Contato, política de privacidade, termos e aviso de que o app não é
    oficial do INEP/MEC.

### Regras comerciais

-   Não prometer aprovação ou nota.
-   Não inventar depoimentos, quantidade de usuários, avaliações ou taxa
    de sucesso.
-   Não usar escassez falsa, contadores falsos ou urgência enganosa.
-   Informar quando o preço for experimental.
-   Usar CTAs como "Começar grátis", "Organizar meus estudos" e
    "Conhecer o Pro".
-   Todo botão deve executar uma ação real: cadastro, app, formulário de
    interesse ou navegação para planos. Nada de links fictícios ou
    botões decorativos.

------------------------------------------------------------------------

## 15. UX, responsividade e acessibilidade

Testar desktop, notebook, tablet, celular e telas de pouca altura.
Evitar rolagem horizontal involuntária. Em telas pequenas, adaptar barra
lateral para menu/navegação compacta, empilhar cards e gráficos, manter
timer legível e garantir que modais/menus caibam na tela. Botões devem
ser confortáveis para toque.

Acessibilidade: - Labels claros. - Contraste adequado. - Foco visível e
navegação por teclado. - Status não comunicado somente por cor. -
Mensagens de erro específicas. - Respeitar redução de movimento. - Não
usar texto minúsculo em informações importantes.

------------------------------------------------------------------------

## 16. Dados, persistência e integridade

Primeiro descubra como os dados são salvos hoje. Se há backend,
integre-se a ele; se o app é local, preserve a estratégia existente e
evite perda de dados. Não afirme sincronização entre dispositivos sem
backend.

Adapte modelos existentes; não duplique entidades desnecessariamente.
Conceitos que precisam estar representados: - Preferências do usuário:
tema, disponibilidade, metas, prioridades, data-alvo. - Área/disciplina:
ID estável, nome, área, ordem, visibilidade. - Tópico: ID estável, nome,
descrição, disciplina, status, prioridade, domínio, datas, visibilidade,
origem padrão/personalizada. - Tarefa de cronograma: ID, tópico,
data/horário planejado, duração, prioridade, status, origem
manual/gerada. - Sessão: ID, tópico opcional, início/fim, foco efetivo,
modo, estado, observação. - Revisão: ID, tópico, etapa, data
prevista/concluída, estado, feedback, histórico de reagendamentos. -
Assinatura, apenas se houver integração: usuário, provedor, ID externo,
status e datas; nunca dados de cartão.

Usar relações por IDs estáveis. Evitar duplicações e preservar
referências históricas. Validar ações no backend quando disponível.
Tratar falhas de sincronização e avisar quando algo não foi salvo.
Garantir consistência de datas/fuso e documentar migrações.

------------------------------------------------------------------------

## 17. Segurança e privacidade

-   Não expor segredos no frontend.
-   Validar entradas no cliente e servidor.
-   Com autenticação, impedir acesso aos dados de outros usuários.
-   Não registrar senhas/tokens em logs.
-   Coletar apenas dados necessários.
-   Analytics apenas com eventos úteis e sem dados sensíveis.
-   Preparar política de privacidade e termos antes de abrir ao público.
-   Seguir práticas compatíveis com a LGPD.
-   Se atender menores, avaliar cuidados adicionais de
    privacidade/consentimento conforme legislação.
-   Não ativar e-mails, notificações ou integrações sem configuração e
    consentimento adequados.

------------------------------------------------------------------------

## 18. Estados vazios, erros e feedback

Todas as telas precisam de estados úteis: - Sem sessões: orientar como
iniciar o primeiro estudo. - Sem cronograma: oferecer criar plano. - Sem
revisão hoje: indicar que está tudo em dia e permitir ver futuras. - Sem
tópicos: permitir restaurar lista padrão ou adicionar tópico. - Falha ao
salvar: explicar e oferecer tentar novamente. - Timer interrompido:
recuperar ou explicar estado. - Falha de pagamento: não ativar Pro. -
Dados demonstrativos: identificar claramente e permitir começar do zero
com confirmação.

Não mostrar erros técnicos brutos ao usuário, mas manter logs úteis sem
segredos.

------------------------------------------------------------------------

## 19. Critérios de aceitação e testes

### Matérias

-   Padrões aparecem sem cadastro manual.
-   Criar, editar, ocultar e reexibir funciona.
-   Restaurar padrão não duplica.
-   Ocultar não apaga histórico.
-   Filtros, busca e contadores funcionam.

### Cronograma

-   Disponibilidade semanal pode ser configurada, incluindo dias livres.
-   Plano respeita tempo disponível.
-   Tarefas podem ser reorganizadas.
-   Regenerar não duplica nem apaga tarefas concluídas.
-   Atrasos não sobrecarregam automaticamente o dia seguinte.
-   Usuário sem cronograma consegue estudar manualmente.
-   "Começar" seleciona o tópico correto no Timer.

### Timer

-   Pomodoro e cronômetro iniciam, pausam, retomam e finalizam.
-   Pausas não contam como foco.
-   Estado é coerente após recarregar.
-   Finalizar várias vezes não duplica sessão.
-   Sessões alimentam o Painel corretamente.

### Revisões

-   Intervalos padrão funcionam.
-   Não há revisões duplicadas.
-   Atrasadas permanecem visíveis.
-   Concluir/reagendar altera a revisão correta.
-   Histórico continua ligado ao tópico.

### Painel

-   Horas correspondem a sessões válidas.
-   Tempo por área usa tópico correto.
-   Metas/progresso são calculados corretamente.
-   Estados vazios não mostram dados fictícios.
-   Navegar entre semanas não altera registros.
-   Datas e viradas de mês/ano funcionam.

### Planos/pagamento

-   Gratuito continua útil.
-   Pro não é liberado só por alteração no frontend.
-   Pagamento só é confirmado pelo provedor.
-   Sem provedor, oferta aparece como validação/não disponível para
    compra.

### Interface

-   Desktop e celular funcionam.
-   Sem overflow horizontal involuntário.
-   Botões executam ações.
-   Modais/menus são acessíveis.
-   Visual permanece coerente com o projeto existente.

------------------------------------------------------------------------

## 20. Ordem de implementação

### Etapa 1 --- Auditoria

Inspecionar arquitetura, dados, rotas e testes. Apresentar resumo e
plano. Preservar os dados.

### Etapa 2 --- Base confiável (P0)

Consolidar persistência e IDs; corrigir sessões, cálculos do Painel,
estados vazios e feedback.

### Etapa 3 --- Matérias personalizáveis (P0)

Adicionar criação, edição, ocultação, restauração e filtros; preservar
histórico.

### Etapa 4 --- Cronograma e "Estudar hoje" (P1)

Disponibilidade, geração do plano, visualização semanal, tarefas
diárias, integração com Timer e reorganização sem duplicação.

### Etapa 5 --- Timer e revisões (P0)

Consolidar Pomodoro/cronômetro, registro, feedback pós-estudo, revisão e
reagendamento.

### Etapa 6 --- Estatísticas e metas (P1/P2)

Indicadores reais, gráficos simples e metas flexíveis.

### Etapa 7 --- Oferta comercial (P2/P3)

Separar gratuito/Pro, preparar R\$ 19,90/mês, integrar pagamentos apenas
se houver configuração real, preparar landing page e medição de
validação.

### Etapa 8 --- Qualidade final

Testes, bugs, responsividade, acessibilidade, segurança e documentação.

### Prioridades

-   **P0 --- MVP confiável:** telas atuais, matérias padrão e
    personalizadas, timer confiável, registro de sessões, Painel real,
    revisões sem duplicação, estados vazios e persistência.
-   **P1 --- Diferencial:** cronograma personalizado, "Estudar hoje",
    reorganização e integração cronograma/Timer.
-   **P2 --- Retenção:** estatísticas detalhadas, análise de
    prioridades, revisões adaptáveis e melhorias da landing page.
-   **P3 --- Comercialização ampliada:** pagamentos, gestão de
    assinatura, notificações opcionais e recursos premium adicionais.

------------------------------------------------------------------------

## 21. Instruções finais para Claude Code

-   Comece auditando o repositório e apresente um resumo breve da
    arquitetura e do plano.
-   Continue implementando; não pare na análise.
-   Não peça autorização para cada mudança pequena e reversível.
-   Prefira soluções simples, seguras e coerentes com a stack.
-   Não introduza bibliotecas pesadas se a stack já resolver o problema.
-   Não deixe TODOs em funcionalidades essenciais que disser ter
    concluído.
-   Não remova funções existentes para simplificar.
-   Se algo não puder ser concluído, diga exatamente o quê, por quê e
    qual configuração é necessária.
-   Rode testes/verificações após cada etapa e corrija erros.
-   Mantenha o código organizado e documentado.
-   Entregue resumo final, lista de arquivos alterados, comandos para
    executar/testar, resultados dos testes e pendências.

## 22. Resultado esperado

Ao terminar, o estudante deve conseguir: 1. Encontrar matérias e tópicos
prontos e personalizá-los. 2. Definir sua disponibilidade e receber
cronograma realista. 3. Abrir o Painel e saber o que estudar hoje. 4.
Iniciar o Timer pelo tópico planejado. 5. Registrar sessões com
segurança e sem duplicação. 6. Ver horas e progresso calculados a partir
de dados reais. 7. Realizar revisões sem perder histórico. 8. Ajustar
metas e reorganizar a semana sem culpa. 9. Usar gratuitamente as funções
essenciais. 10. Entender o valor do Pro experimental por R\$ 19,90/mês.
11. Não ver promessas enganosas nem funções falsas. 12. Usar interface
responsiva, acessível e coerente. 13. Ter dados preservados e
protegidos. 14. Estar pronto para validar o produto com 20--30
estudantes.

**Comece pela auditoria do projeto existente. Preserve o que funciona.
Priorize confiabilidade, matérias personalizáveis, cronograma e a
experiência "Estudar hoje". Implemente incrementalmente e valide cada
etapa.**
