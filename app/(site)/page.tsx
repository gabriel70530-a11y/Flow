import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { PlanCards } from "@/components/planos/PlanCards";
import { Wordmark } from "@/components/shell/Wordmark";
import { AppPreview } from "@/components/site/AppPreview";

export const metadata: Metadata = {
  title: { absolute: "Flow · Sua preparação para o ENEM, no ritmo certo." },
  description:
    "Organize as matérias do ENEM, descubra o que estudar hoje, use o timer e faça revisões espaçadas. Grátis, sem cadastro.",
};

const BENEFITS = [
  ["Semana organizada, sem rigidez", "Até 2 matérias por dia nos dias que você escolher. Sem limite de horas e sem obrigação de fazer tudo."],
  ["Saber o que estudar hoje", "O painel abre com as matérias do dia e um botão para começar."],
  ["Timer Pomodoro e cronômetro", "O tempo de foco entra sozinho no painel. Pausas não contam como estudo."],
  ["Revisões espaçadas", "Ao concluir um tópico, as revisões de 1, 7, 15 e 30 dias são agendadas."],
  ["Evolução com dados reais", "Horas por dia e por área, planejado x realizado, tudo a partir das suas sessões."],
  ["Estude até dominar", "Ainda não dominou? A matéria volta no dia seguinte. Não deu tempo? Ela passa para o próximo dia, sem culpa."],
];

const STEPS = [
  ["Conte sua rotina", "Em quais dias você quer estudar, as áreas mais difíceis e, se souber, a data da prova."],
  ["Organize a semana", "Receba as matérias de cada dia ou monte você mesmo. Ajuste quando a vida mudar."],
  ["Acompanhe o progresso", "Estude pelo timer, marque revisões e veja a semana tomar forma."],
];

const FAQ = [
  [
    "O Flow garante aprovação?",
    "Não. Ele ajuda a organizar o estudo, mas nota e aprovação dependem de muitos fatores. Nenhuma ferramenta pode prometer isso.",
  ],
  ["É oficial do INEP ou do MEC?", "Não. É uma ferramenta independente, sem vínculo com o INEP ou o MEC."],
  [
    "Preciso criar conta?",
    "Não. Os dados ficam salvos no seu navegador. Por isso, não há sincronização entre aparelhos; você pode baixar um backup e importar em outro.",
  ],
  ["Funciona no celular?", "Sim, direto no navegador do celular, do tablet ou do computador."],
  [
    "Quanto custa?",
    "O plano gratuito é gratuito de verdade. O Flow Pro tem preço experimental de R$ 19,90/mês, mas ainda não é vendido: durante o teste, os recursos Pro estão liberados.",
  ],
  ["E se eu não conseguir seguir o plano?", "Normal. O que não deu para estudar passa sozinho para o próximo dia, e você pode mover qualquer matéria quando quiser."],
  [
    "O app já vem com as matérias do ENEM?",
    "Vem só com as cinco áreas: Matemática, Linguagens, Ciências da Natureza, Ciências Humanas e Redação. Você cria os tópicos que quer estudar e decide quanto estudar.",
  ],
];

export default function LandingPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-20 px-4 py-12 md:px-8 md:py-16">
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="grid gap-5">
          <h1 className="text-[36px] leading-tight md:text-[44px]">Sua preparação para o ENEM, no ritmo certo.</h1>
          <p className="text-lg text-muted">
            Transforme sua meta de passar no ENEM em um plano de ação. Organize as matérias, descubra o que estudar hoje e
            acompanhe sua evolução, um dia de cada vez.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/painel" className={buttonStyles("primary", "lg")}>
              Começar grátis
            </Link>
            <a href="#planos" className={buttonStyles("secondary", "lg")}>
              Conhecer o Pro
            </a>
          </div>
          <p className="text-[13px] text-muted">Sem cadastro. Os dados ficam no seu navegador.</p>
        </div>
        <AppPreview />
      </section>

      <section className="grid gap-6" aria-labelledby="beneficios">
        <h2 id="beneficios" className="text-[22px]">
          O que você ganha
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(([title, text]) => (
            <div key={title} className="grid gap-1.5 rounded-xl bg-surface p-5 shadow-card">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="grid scroll-mt-24 gap-6" aria-labelledby="como-funciona-titulo">
        <h2 id="como-funciona-titulo" className="text-[22px]">
          Como funciona
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([title, text], index) => (
            <li key={title} className="grid gap-1.5 rounded-xl bg-surface p-5 shadow-card">
              <span className="font-heading text-2xl font-extrabold text-muted font-stretch-120% italic">{index + 1}</span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="planos" className="grid scroll-mt-24 gap-6" aria-labelledby="planos-titulo">
        <h2 id="planos-titulo" className="text-[22px]">
          Planos
        </h2>
        <PlanCards />
      </section>

      <section id="perguntas" className="grid scroll-mt-24 gap-6" aria-labelledby="perguntas-titulo">
        <h2 id="perguntas-titulo" className="text-[22px]">
          Perguntas frequentes
        </h2>
        <div className="grid gap-2">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group rounded-xl bg-surface px-5 py-4 shadow-card">
              <summary className="cursor-pointer font-semibold marker:text-muted">{question}</summary>
              <p className="mt-2 text-sm text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="grid justify-items-center gap-6 rounded-xl bg-surface px-5 py-14 text-center shadow-card"
        aria-labelledby="comecar-titulo"
      >
        <Wordmark size="lg" tagline />
        <h2 id="comecar-titulo" className="text-[22px]">
          Comece pelo que importa hoje.
        </h2>
        <p className="max-w-md text-muted">Leva 2 minutos para montar o plano. Ou abra o app e estude do seu jeito.</p>
        <Link href="/painel" className={buttonStyles("primary", "lg")}>
          Organizar meus estudos
        </Link>
      </section>
    </div>
  );
}
