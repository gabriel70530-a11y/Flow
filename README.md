# Flow

Sua preparação para o ENEM, no ritmo certo. Organizador de estudos: matérias prontas e personalizáveis, semana organizada com até 2 matérias por dia (sem limite de horas), "Estudar hoje" no painel, timer Pomodoro ou cronômetro, revisões espaçadas (1, 7, 15 e 30 dias) e estatísticas a partir das sessões registradas.

Não é cursinho, não promete nota nem aprovação e não tem vínculo com o INEP ou o MEC.

## Como rodar

Precisa do Node.js 22.12 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A página inicial é o site; o app começa em `/painel`.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local |
| `npm run build` e `npm start` | build de produção e servidor |
| `npm run lint` | ESLint |
| `npm test` | Vitest: datas, tópicos, revisões, sessões, cronograma, estatísticas, planos, migração e store |

## Telas

- `/` landing, `/privacidade`, `/termos`: site público.
- `/painel`: "Estudar hoje", semana com meta (horas, sessões ou tópicos), resumo, por área e próximas revisões.
- `/cronograma`: matérias dos próximos 7 dias, até 2 por dia de estudo, sempre do mesmo assunto (mesma área ou, em Natureza e Humanas, mesma matéria). O que não foi estudado passa sozinho para o próximo dia; o que não foi dominado se repete no dia seguinte.
- `/materias`: as cinco áreas do ENEM, com Natureza (Química, Física, Biologia) e Humanas (Geografia, História, Filosofia, Sociologia) divididas em matérias. Nenhum tópico vem pronto: o estudante cria os próprios. Busca, filtros, ordenação, editar, ocultar e excluir.
- `/timer`: Pomodoro e cronômetro, estudo geral, reflexão pós-sessão, sessões de hoje.
- `/revisoes`: atrasadas, hoje, próximos 7 dias e futuras; concluir com feedback, adiar e reagendar. `/revisoes/erros`: caderno de erros, com cada erro voltando em 1, 7, 15 e 30 dias.
- `/simulados`: acertos por área e ritmo dos simulados feitos fora do app (sem nota TRI). `/redacao`: notas por competência e repertório pessoal. `/prova`: checklist do dia da prova.
- No Painel: reta final (contagem e prioridade para revisões nas 4 semanas antes da prova) e "Dia leve" para dias cansativos. No Timer: modo foco.
- `/comecar`: configuração inicial opcional. `/ajustes`: preferências, meta, cronograma, backup. `/planos`.

## Onde ficam os dados

Não há servidor nem conta. Tudo fica no `localStorage` do navegador, na chave `enem-flow:v2`.

- Na primeira abertura, se existir a chave `enem-flow:v1` (formato do protótipo), os dados são migrados para a v2 e a v1 fica intacta como cópia de segurança.
- Sem nada salvo, o app carrega dados de exemplo, identificados por um aviso com "Apagar e começar do zero".
- Se o JSON salvo estiver corrompido, o texto bruto vai para `enem-flow:v2:corrompido` e o app começa do zero.
- Se o navegador recusar a gravação, um aviso aparece com "Tentar de novo".
- Em produção, o app funciona offline depois da primeira visita (service worker em `public/sw.js`).
- Não há sincronização entre aparelhos. Em Ajustes dá para baixar um backup (JSON) e importar em outro navegador.

## Configuração opcional

Copie `.env.example` para `.env.local` e preencha o que quiser. Sem as variáveis, o app funciona e só esconde o que depende delas.

| Variável | Efeito |
|---|---|
| `NEXT_PUBLIC_PRO_INTEREST_URL` | link https para a lista de interesse do Pro (ex.: formulário). Sem ela, a tela diz que a lista ainda não está aberta. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | e-mail de contato no rodapé do site. |
| `NEXT_PUBLIC_ANALYTICS_URL` | endpoint https que recebe eventos anônimos. Só envia se o estudante ativar em Ajustes. |
| `NEXT_PUBLIC_SITE_URL` | endereço público do site (ex.: `https://flow.exemplo.com`), usado no sitemap, no robots e nos cartões de compartilhamento. Sem ela, esses links apontam para `http://localhost:3000`. |

## O que ainda depende de decisão ou serviço externo

- **Cobrança do Flow Pro (R$ 19,90/mês, preço experimental).** Não há provedor de pagamento nem backend. Os recursos Pro (cronograma sugerido, reorganização, resumo detalhado) estão liberados para todos durante o teste e a interface diz isso; nada é vendido nem simulado. Para cobrar, é preciso um backend que valide a assinatura com o provedor e devolva o acesso a `currentEntitlement()` em `lib/plan.ts`, além de textos de cobrança, cancelamento e reembolso.
- **Coleta de métricas para a validação com 20 a 30 estudantes.** O app emite `app_aberto`, `onboarding_concluido`, `onboarding_pulado`, `plano_gerado`, `sessao_registrada`, `revisao_concluida` e `pro_interesse`, com o dia e um código aleatório do navegador. Falta um endpoint que receba esses eventos (ver `NEXT_PUBLIC_ANALYTICS_URL`) e uma forma de coletar motivos de abandono (entrevista ou formulário). Intenção declarada na lista de interesse não é compra.
- **Política de privacidade e termos.** As páginas descrevem o funcionamento real do app, mas são uma versão preliminar: revisar com orientação jurídica antes de abrir ao público, inclusive pelos cuidados com menores de idade (LGPD).
- **Contato.** Definir um e-mail de suporte e configurar `NEXT_PUBLIC_CONTACT_EMAIL`.
