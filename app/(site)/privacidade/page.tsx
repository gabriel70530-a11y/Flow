import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de privacidade">
      <section>
        <h2>Onde ficam seus dados</h2>
        <p>
          Sem conta, tópicos, sessões, revisões, cronograma, caderno de erros, simulados, redações e preferências ficam salvos só no
          armazenamento local do seu navegador, neste aparelho. Nós não recebemos esse conteúdo.
        </p>
      </section>
      <section>
        <h2>Se você criar uma conta</h2>
        <p>A conta é opcional e serve só para guardar uma cópia dos seus dados e usá-los em outros aparelhos.</p>
        <ul>
          <li>
            Guardamos o seu e-mail (e, se entrar com o Google, o identificador da conta Google) e os dados de estudo listados acima.
            Não pedimos nome, telefone, endereço, escola nem idade.
          </li>
          <li>
            Os dados ficam no Supabase, com servidores em São Paulo. Cada conta só acessa os próprios dados. Os e-mails de login são
            enviados por esse mesmo serviço.
          </li>
          <li>Não vendemos dados, não usamos para anúncios e não compartilhamos com escolas nem com outras empresas.</li>
          <li>
            A base legal é a execução do serviço que você pediu (LGPD, art. 7º, V). Com menos de 18 anos, use a conta com o
            conhecimento de um responsável.
          </li>
          <li>
            Você pode baixar tudo em Ajustes (&quot;Baixar backup&quot;) e excluir a conta quando quiser (&quot;Excluir conta&quot;):
            a conta e a cópia na nuvem são apagadas na hora.
          </li>
        </ul>
      </section>
      <section>
        <h2>O que pode sair do seu aparelho</h2>
        <ul>
          <li>Nada, por padrão.</li>
          <li>
            Se você ativar &quot;Compartilhar dados de uso anônimos&quot; em Ajustes, o app envia eventos como &quot;sessão
            registrada&quot; com o dia e um código aleatório do navegador. Não envia nome, e-mail, tópicos, anotações nem horários.
            Você pode desativar quando quiser.
          </li>
          <li>Se você baixar um backup, o arquivo fica com você. Guarde-o como guardaria qualquer documento pessoal.</li>
        </ul>
      </section>
      <section>
        <h2>Fontes e serviços de terceiros</h2>
        <p>A fonte Saira é servida junto com o próprio site. Não usamos anúncios nem rastreadores de terceiros.</p>
      </section>
      <section>
        <h2>Como apagar</h2>
        <p>
          Em Ajustes, &quot;Apagar todos os dados&quot; remove o conteúdo do app neste navegador e, se você tiver conta, também na
          nuvem. &quot;Excluir conta&quot; apaga a conta e a cópia na nuvem. Limpar os dados do site nas configurações do navegador
          apaga o que está no aparelho.
        </p>
      </section>
      <section>
        <h2>Menores de idade</h2>
        <p>
          Muitos estudantes têm menos de 18 anos. Por isso o app funciona sem conta, a conta pede só o e-mail e o compartilhamento de
          uso fica desligado até alguém ativá-lo. Se você for menor, converse com um responsável antes de criar a conta ou de ativar o
          compartilhamento.
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
