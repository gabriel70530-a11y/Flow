import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso">
      <section>
        <h2>O que é o Flow</h2>
        <p>
          Uma ferramenta para organizar estudos: matérias, cronograma, timer, revisões e acompanhamento. Não é cursinho, não
          oferece aulas e não é oficial: não tem vínculo com o INEP nem com o MEC.
        </p>
      </section>
      <section>
        <h2>Sem promessa de resultado</h2>
        <p>
          O app não garante nota, aprovação ou qualquer resultado no ENEM ou em vestibulares. Sugestões de cronograma e de
          revisão são apoio à organização, não orientação pedagógica individual.
        </p>
      </section>
      <section>
        <h2>Lista de tópicos</h2>
        <p>
          O Flow traz só as cinco áreas do ENEM como organização. Os tópicos são criados por você e não representam o
          conteúdo oficial da prova. Confira sempre o edital e as fontes oficiais.
        </p>
      </section>
      <section>
        <h2>Seus dados</h2>
        <p>
          Os dados ficam no seu navegador. Se forem apagados (por você, pelo navegador ou por falta de espaço), não há como
          recuperar sem um backup. Recomendamos baixar backups de tempos em tempos em Ajustes.
        </p>
      </section>
      <section>
        <h2>Plano gratuito e Pro</h2>
        <ul>
          <li>O plano gratuito não tem prazo e não exige pagamento.</li>
          <li>
            O Flow Pro está em validação, com preço experimental de R$ 19,90/mês. Hoje não há venda nem cobrança. Antes de
            qualquer assinatura existir, preço, forma de cobrança, renovação, cancelamento e reembolso serão informados.
          </li>
        </ul>
      </section>
      <section>
        <h2>Uso do app</h2>
        <p>
          O app é oferecido como está, durante uma fase de teste. Podemos mudar recursos para melhorar o produto, sempre
          preservando os dados já salvos no seu navegador.
        </p>
      </section>
    </LegalPage>
  );
}
