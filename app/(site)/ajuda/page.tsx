import type { Metadata } from "next";
import Link from "next/link";
import { linkStyles } from "@/components/ui/Button";
import { contactEmail } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Ajuda",
  description: "Dúvidas frequentes sobre o Flow: conta, dados, cronograma, revisões, simulados e o plano Pro.",
};

const QUESTIONS: { question: string; answer: string }[] = [
  {
    question: "O Flow é um cursinho?",
    answer:
      "Não. O Flow organiza a sua preparação: o que estudar em cada dia, o tempo de estudo, as revisões, os erros e os simulados. As aulas e os materiais você escolhe. O app não é oficial e não tem vínculo com o INEP ou o MEC.",
  },
  {
    question: "Por que preciso de uma conta?",
    answer:
      "A conta é a sua entrada no Flow. Os dados ficam no aparelho, então o app continua funcionando sem internet depois de entrar. No Pro, a conta também guarda uma cópia e sincroniza entre o celular e o computador.",
  },
  {
    question: "Troquei de celular. Perdi meus dados?",
    answer:
      "No Pro, não: ao entrar no aparelho novo com a mesma conta, o Flow baixa o que está na nuvem e junta com o que já existir ali. No gratuito, os dados ficam só no aparelho; baixe um backup em Ajustes antes de trocar.",
  },
  {
    question: "Como o cronograma funciona?",
    answer:
      "Você escolhe em quais dias estuda e quais áreas são prioritárias. O Flow coloca até duas matérias do mesmo assunto em cada dia, sem limitar o tempo. O que ficou para trás passa sozinho para o próximo dia de estudo, sem culpa.",
  },
  {
    question: "Como funcionam as revisões?",
    answer:
      "No gratuito, você agenda a revisão de um tópico na data que quiser. No Pro, ao concluir um tópico, o Flow agenda quatro revisões: depois de 1, 7, 15 e 30 dias.",
  },
  {
    question: "O simulado calcula a minha nota do Enem?",
    answer:
      "Nas provas oficiais feitas no Flow, sim: uma estimativa pela TRI com os parâmetros que o Inep publica para cada questão. Em testes com candidatos reais, ela bate com a nota oficial. Simulados registrados só com acertos mostram acertos e ritmo.",
  },
  {
    question: "As questões do simulado são oficiais?",
    answer:
      "Sim. São as provas aplicadas pelo INEP (caderno azul), corrigidas pelo gabarito oficial. Questões anuladas saem do total.",
  },
  {
    question: "Como cancelo o Pro?",
    answer:
      "Em Planos, dentro do app. Depois de cancelar, nada mais é cobrado e o Pro continua até o fim do período pago. Em até 7 dias depois do pagamento, você pode pedir o valor de volta.",
  },
  {
    question: "Como apago meus dados ou a conta?",
    answer:
      "Em Ajustes. \"Apagar todos os dados\" apaga no aparelho e na nuvem. \"Excluir conta\" apaga a conta e a cópia na nuvem e mantém o que está no aparelho.",
  },
];

export default function AjudaPage() {
  const email = contactEmail();
  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-4 py-12 md:px-8">
      <header className="grid gap-2">
        <h1>Ajuda</h1>
        <p className="text-muted">As dúvidas mais comuns sobre o Flow.</p>
      </header>
      <div className="grid gap-3">
        {QUESTIONS.map(({ question, answer }) => (
          <details key={question} className="group rounded-[18px] border-2 border-edge bg-surface p-5 shadow-card">
            <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {question}
                <span aria-hidden className="text-muted group-open:rotate-45 motion-safe:transition-transform">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-muted">{answer}</p>
          </details>
        ))}
      </div>
      <p className="text-muted">
        Não achou o que procurava?{" "}
        {email ? (
          <a href={`mailto:${email}`} className={linkStyles}>
            Escreva para {email}
          </a>
        ) : (
          <>
            Veja também os{" "}
            <Link href="/termos" className={linkStyles}>
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className={linkStyles}>
              política de privacidade
            </Link>
            .
          </>
        )}
      </p>
    </article>
  );
}
