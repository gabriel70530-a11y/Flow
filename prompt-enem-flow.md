# Prompt inicial para o Claude Code

Antes de começar, a pasta do projeto deve ter:
- `CLAUDE.md` na raiz (o Claude Code lê esse arquivo sozinho em toda sessão)
- `docs/prototype.html` (o protótipo aprovado)

Depois, cole a mensagem abaixo no Claude Code.

---

Vamos construir o ENEM Flow do zero nesta pasta. Leia o `CLAUDE.md` inteiro e abra o `docs/prototype.html`: ele é a referência de comportamento, textos e visual.

Trabalhe nesta ordem, fazendo um commit no padrão Conventional Commits ao fim de cada etapa:

1. Crie o projeto Next.js com TypeScript, Tailwind v4, ESLint, Zustand, Vitest e lucide-react. Remova o conteúdo de exemplo. Inicie o git.
2. Escreva `lib/` (syllabus, dates, reviews, stats, timer) como funções puras, com testes no Vitest cobrindo as regras de negócio do `CLAUDE.md`. Os testes precisam passar antes de seguir.
3. Crie a store com `persist` (chave `enem-flow:v1`, compatível com o protótipo), incluindo os dados de exemplo da primeira visita e o tratamento da hidratação.
4. Monte `globals.css` com os tokens dos dois temas, as fontes com `next/font`, o script de tema no `<head>`, o `Wordmark` e o AppShell (barra lateral no desktop, barras superior e inferior no celular).
5. Construa os componentes de `components/ui`.
6. Construa as telas nesta ordem: Matérias (com o painel lateral), Timer, Revisões, Painel.
7. Compare cada tela com o protótipo nos dois temas, em 400px e 1440px, e corrija as diferenças.
8. Rode `npm run build`, `npm run lint` e `npm test`, corrija tudo e escreva o `README.md`.

Se alguma regra do `CLAUDE.md` parecer ambígua, siga o protótipo. Se os dois divergirem, me pergunte antes de decidir.
