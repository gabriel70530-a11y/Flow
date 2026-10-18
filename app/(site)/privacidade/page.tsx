import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de privacidade">
      <section>
        <h2>Onde ficam seus dados</h2>
        <p>
          O Flow não tem conta nem servidor de dados. Tópicos, sessões, revisões, cronograma, caderno de erros, simulados, redações e preferências ficam salvos no
          armazenamento local do seu navegador, neste aparelho. Nós não recebemos esse conteúdo.
        </p>
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
          Em Ajustes, &quot;Apagar todos os dados&quot; remove o conteúdo do app neste navegador. Limpar os dados do site nas
          configurações do navegador também apaga tudo.
        </p>
      </section>
      <section>
        <h2>Menores de idade</h2>
        <p>
          Muitos estudantes têm menos de 18 anos. Por isso o app não pede dados pessoais e o compartilhamento de uso fica desligado
          até alguém ativá-lo. Se você for menor, converse com um responsável antes de ativar.
        </p>
      </section>
      <section>
        <h2>Seus direitos</h2>
        <p>
          O Flow segue os princípios da LGPD: coletar o mínimo, com finalidade clara e controle seu. Como não guardamos seus
          dados de estudo, o acesso, a correção e a exclusão estão nas suas mãos, no próprio app.
        </p>
      </section>
    </LegalPage>
  );
}
