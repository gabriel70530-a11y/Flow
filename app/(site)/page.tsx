import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { PlanCards } from "@/components/planos/PlanCards";
import { Wordmark } from "@/components/shell/Wordmark";
import { SITE_TITLE, appOpen } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
  description:
    "Organize as matérias do ENEM, descubra o que estudar hoje, use o timer e faça revisões espaçadas. Grátis, com uma conta.",
};

const BENEFITS = [
  ["Semana organizada, sem rigidez", "Até 2 matérias por dia nos dias que você escolher. Sem limite de horas e sem obrigação de fazer tudo."],
  ["Saber o que estudar hoje", "O painel abre com as matérias do dia e um botão para começar."],
  ["Timer Pomodoro e cronômetro", "O tempo de foco entra sozinho no painel. Pausas não contam como estudo."],
  ["Revisões espaçadas", "Ao concluir um tópico, as revisões de 1, 7, 15 e 30 dias são agendadas. Questões que você errou também voltam."],
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
    "Sim, com e-mail e senha ou com o Google. Seus dados ficam no aparelho, funcionam sem internet e têm uma cópia na conta para você usar no celular e no computador.",
  ],
  ["Funciona no celular?", "Sim, direto no navegador do celular, do tablet ou do computador."],
  [
    "Quanto custa?",
    "O plano gratuito é gratuito de verdade. O Flow Pro, com correção de redação por IA, simulado no app e a semana montada sozinha, abre em breve.",
  ],
  ["E se eu não conseguir seguir o plano?", "Normal. O que não deu para estudar passa sozinho para o próximo dia, e você pode mover qualquer matéria quando quiser."],
  [
    "O app já vem com as matérias do ENEM?",
    "Vem só com as cinco áreas: Matemática, Linguagens, Natureza (Química, Física e Biologia), Humanas (Geografia, História, Filosofia e Sociologia) e Redação. Nenhum tópico vem pronto: você cria os seus e decide quanto estudar.",
  ],
];

const sectionTitle = "font-heading text-[26px] leading-[1.1] font-bold uppercase font-stretch-115% md:text-[40px]";

export default function LandingPage() {
  const open = appOpen();

  return (
    <>
      <section className="relative overflow-hidden bg-hero text-white" aria-labelledby="titulo">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-32 size-[520px] rounded-full border border-hero-bright/20 shadow-[0_0_0_80px_color-mix(in_srgb,var(--hero-bright)_5%,transparent),0_0_0_160px_color-mix(in_srgb,var(--hero-bright)_3%,transparent)]"
        />
        <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-16 md:px-12 md:pt-24 md:pb-30">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-hero-soft uppercase">Organizador de estudos para o ENEM</p>
          <h1
            id="titulo"
            className="mt-5 max-w-[900px] text-[clamp(38px,6vw,76px)] leading-[1.02] font-extrabold uppercase font-stretch-118%"
          >
            Sua preparação para o ENEM, <em className="text-hero-bright">no ritmo certo.</em>
          </h1>
          <p className="mt-6 max-w-[540px] text-base text-white/85 md:text-lg">
            Saiba o que estudar hoje, organize a semana sem rigidez e lembre das revisões na hora certa. Grátis, é só criar a conta.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            {open && (
              <Link
                href="/painel"
                className="inline-flex h-[52px] items-center rounded-full border-2 border-hero-edge bg-white px-7 font-semibold text-action shadow-[4px_4px_0_var(--hero-bright)] transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Começar agora
              </Link>
            )}
            <a
              href="#como-funciona"
              className="inline-flex h-[52px] items-center rounded-full border-2 border-white px-7 font-semibold text-white hover:bg-white/10"
            >
              Ver como funciona
            </a>
          </div>
          <p className="mt-5 text-[13px] text-white/70">
            {open ? "Os dados ficam no seu navegador." : "O Flow abre em breve. Por enquanto, conheça como ele funciona."}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-20 px-5 py-12 md:gap-24 md:px-12 md:py-22">
        <section className="grid gap-10" aria-labelledby="beneficios">
          <h2 id="beneficios" className={`${sectionTitle} max-w-[640px]`}>
            Menos caos. Mais foco no que importa hoje.
          </h2>
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([title, text], index) => (
              <div key={title}>
                <span className="font-heading text-[15px] font-extrabold text-accent italic font-stretch-120%">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2.5 font-heading text-[19px] font-semibold font-stretch-108%">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="grid scroll-mt-24 gap-10" aria-labelledby="como-funciona-titulo">
          <h2 id="como-funciona-titulo" className={sectionTitle}>
            Como funciona
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, text], index) => (
              <li key={title} className="grid gap-2 rounded-[18px] border-2 border-edge bg-surface p-6 shadow-card">
                <span className="font-heading text-[28px] leading-none font-extrabold text-accent italic font-stretch-120%">
                  {index + 1}
                </span>
                <h3 className="font-heading text-[19px] font-semibold font-stretch-108%">{title}</h3>
                <p className="text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="planos" className="grid scroll-mt-24 gap-10" aria-labelledby="planos-titulo">
          <h2 id="planos-titulo" className={sectionTitle}>
            Planos
          </h2>
          <PlanCards />
        </section>

        <section id="perguntas" className="grid scroll-mt-24 gap-10" aria-labelledby="perguntas-titulo">
          <h2 id="perguntas-titulo" className={sectionTitle}>
            Perguntas frequentes
          </h2>
          <div className="grid gap-3">
            {FAQ.map(([question, answer]) => (
              <details key={question} className="group rounded-[18px] border-2 border-edge bg-surface px-6 py-5">
                <summary className="cursor-pointer font-semibold marker:text-muted">{question}</summary>
                <p className="mt-2 text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="grid justify-items-center gap-6 rounded-[22px] border-2 border-edge bg-surface px-5 py-14 text-center shadow-card"
          aria-labelledby="comecar-titulo"
        >
          <Wordmark size="lg" tagline />
          <h2 id="comecar-titulo" className="font-heading text-[22px] font-bold font-stretch-112%">
            Comece pelo que importa hoje.
          </h2>
          {open ? (
            <>
              <p className="max-w-md text-muted">Leva 2 minutos para montar o plano. Ou abra o app e estude do seu jeito.</p>
              <Link href="/painel" className={buttonStyles("primary", "lg")}>
                Organizar meus estudos
              </Link>
            </>
          ) : (
            <p className="max-w-md text-muted">O Flow abre em breve.</p>
          )}
        </section>
      </div>
    </>
  );
}
