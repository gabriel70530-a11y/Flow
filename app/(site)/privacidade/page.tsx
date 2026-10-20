import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de privacidade">
      <section>
        <h2>Onde ficam seus dados</h2>
        <p>
          Tópicos, sessões, revisões, cronograma, caderno de erros, simulados, redações e preferências ficam salvos no seu
          aparelho, para o app funcionar sem internet, e uma cópia fica na sua conta, para você usar em outros aparelhos.
        </p>
      </section>
      <section>
        <h2>Sua conta</h2>
        <p>Para usar o Flow, gratuito ou Pro, é preciso ter uma conta.</p>
        <ul>
          <li>
            Guardamos o seu e-mail, a senha (cifrada, nem nós conseguimos ler), o ano de nascimento e os dados de estudo listados
            acima. Se você entrar com o Google, recebemos só o e-mail e o nome da conta Google, sem acesso a mais nada dela. Não
            pedimos telefone, endereço nem escola.
          </li>
          <li>
            O ano de nascimento serve só para confirmar a idade mínima de 13 anos e, para menores de 18, pedir a confirmação de que
            um responsável sabe do uso.
          </li>
          <li>
            Os dados ficam no Supabase, com servidores em São Paulo. Cada conta só acessa os próprios dados. Os e-mails de login são
            enviados por esse mesmo serviço.
          </li>
          <li>Não vendemos dados, não usamos para anúncios e não compartilhamos com escolas nem com outras empresas.</li>
          <li>A base legal é a execução do serviço que você pediu (LGPD, art. 7º, V).</li>
          <li>
            Você pode baixar tudo em Ajustes (&quot;Baixar backup&quot;) e excluir a conta quando quiser (&quot;Excluir conta&quot;):
            a conta e a cópia na nuvem são apagadas na hora.
          </li>
        </ul>
      </section>
      <section>
        <h2>Pagamento (Pro)</h2>
        <p>
          A assinatura é paga no Mercado Pago. O Flow não recebe nem guarda dados de cartão: guarda só o plano, a situação da
          assinatura, até quando o Pro vale e o código do pagamento, para confirmar o acesso e atender pedidos de reembolso.
        </p>
      </section>
      <section>
        <h2>O que mais pode sair do seu aparelho</h2>
        <ul>
          <li>
            Se você ativar &quot;Compartilhar dados de uso anônimos&quot; em Ajustes, o app envia eventos como &quot;sessão
            registrada&quot; com o dia e um código aleatório do navegador. Não envia nome, e-mail, tópicos, anotações nem horários.
            Fica desligado até você ativar.
          </li>
          <li>Se você baixar um backup, o arquivo fica com você. Guarde-o como guardaria qualquer documento pessoal.</li>
        </ul>
      </section>
      <section>
        <h2>Fontes e serviços de terceiros</h2>
        <p>
          A fonte Saira é servida junto com o próprio site. Não usamos anúncios nem rastreadores de terceiros. Os serviços que
          recebem dados são só os citados acima: Supabase (conta), Google (se você entrar com ele) e
          Mercado Pago (pagamento).
        </p>
      </section>
      <section>
        <h2>Como apagar</h2>
        <p>
          Em Ajustes, &quot;Apagar todos os dados&quot; remove o conteúdo do app neste aparelho e na nuvem. &quot;Excluir
          conta&quot; apaga a conta e a cópia na nuvem. Registros de pagamento podem ser mantidos pelo prazo que a lei fiscal exige.
        </p>
      </section>
      <section>
        <h2>Menores de idade</h2>
        <p>
          Muitos estudantes têm menos de 18 anos. Por isso a conta pede só o e-mail e o ano de nascimento, não aceita menores de 13
          anos, pede que um responsável saiba do uso por quem tem menos de 18 e o compartilhamento de uso fica desligado até alguém
          ativá-lo. A assinatura do Pro deve ser feita por um responsável quando quem estuda for menor de idade.
        </p>
      </section>
      <section>
        <h2>Seus direitos</h2>
        <p>
          O Flow segue os princípios da LGPD: coletar o mínimo, com finalidade clara e controle seu. O acesso, a correção, a
          portabilidade (backup em arquivo) e a exclusão estão nas suas mãos, no próprio app.
        </p>
      </section>
    </LegalPage>
  );
}
