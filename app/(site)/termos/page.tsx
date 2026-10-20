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
          oferece aulas e não é oficial: não tem vínculo com o INEP nem com o MEC. As provas e gabaritos usados no simulado do
          app são os publicados pelo INEP, com link para os arquivos oficiais.
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
        <h2>Conta e dados</h2>
        <p>
          Para usar o Flow é preciso criar uma conta, com pelo menos 13 anos. Quem tem menos de 18 usa com o conhecimento de um
          responsável. Os dados ficam no aparelho; no Pro, uma cópia fica na conta, sincronizada entre os seus aparelhos, e apagar os
          dados em um aparelho conectado apaga também a cópia. Recomendamos baixar backups de tempos em tempos em Ajustes.
        </p>
      </section>
      <section>
        <h2>Análise com IA</h2>
        <p>
          No Pro, a análise de erros é feita por inteligência artificial. Pode errar, não é a
          resposta oficial e não substitui um professor. Confira sempre antes de salvar.
        </p>
      </section>
      <section>
        <h2>Plano gratuito e Pro</h2>
        <ul>
          <li>O plano gratuito não tem prazo e não exige pagamento.</li>
          <li>O preço do Flow Pro aparece em Planos, dentro do app, antes de qualquer pagamento, que é feito no Mercado Pago.</li>
          <li>
            Mensal: no cartão. Renova sozinho todo mês até você cancelar em Planos; depois de cancelar, nada mais é cobrado e o Pro
            continua até o fim do período pago.
          </li>
          <li>Anual: uma cobrança só, por Pix ou cartão. Vale por 365 dias e não renova sozinho.</li>
          <li>
            Você pode desistir em até 7 dias depois do pagamento e receber o valor de volta (Código de Defesa do Consumidor, art.
            49), pelo contato do rodapé.
          </li>
          <li>Análise de erros com IA: até 60 por mês. O limite renova no dia 1º.</li>
          <li>Enquanto a assinatura não estiver aberta, nada é cobrado.</li>
        </ul>
      </section>
      <section>
        <h2>Uso do app</h2>
        <p>
          Podemos mudar recursos para melhorar o produto, sempre preservando os dados já salvos. Mudanças de preço valem só a
          partir da renovação seguinte e são avisadas antes.
        </p>
      </section>
    </LegalPage>
  );
}
