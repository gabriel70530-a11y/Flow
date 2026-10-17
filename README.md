# ENEM Flow

Organizador pessoal de estudos para o ENEM: matérias e tópicos, timer Pomodoro ou cronômetro, revisões espaçadas (1, 7, 15 e 30 dias) e um painel com as horas da semana.

## Como rodar

Precisa do Node.js 22.12 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

Outros comandos:

- `npm run build`: build de produção (`npm start` para servir depois)
- `npm run lint`: ESLint
- `npm test`: testes do Vitest (regras de datas, revisões, estatísticas, timer e store)

## Onde ficam os dados

Não há servidor nem conta. Tudo fica no `localStorage` do navegador, na chave `enem-flow:v1`, no mesmo formato do protótipo em `docs/prototype.html`.

Na primeira visita a app carrega dados de exemplo; o aviso no topo apaga tudo e começa do zero. Os dados valem só para aquele navegador: limpar os dados do site ou trocar de navegador começa do zero.
