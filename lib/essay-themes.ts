import type { Essay } from "./essays";

export type EssayAxis = "educacao" | "saude" | "tecnologia" | "ambiente" | "cidadania" | "cultura" | "trabalho" | "violencia";

export const ESSAY_AXES: { value: EssayAxis; label: string }[] = [
  { value: "cidadania", label: "Cidadania" },
  { value: "educacao", label: "Educação" },
  { value: "saude", label: "Saúde" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "ambiente", label: "Meio ambiente" },
  { value: "cultura", label: "Cultura" },
  { value: "trabalho", label: "Trabalho" },
  { value: "violencia", label: "Violência" },
];

export interface EssayTheme {
  id: string;
  title: string;
  axis: EssayAxis;
  // Ano em que caiu no Enem; null = tema de treino escrito para o Flow.
  year: number | null;
  // Perguntas para puxar a discussão. Sem textos motivadores: os oficiais estão nas provas do Inep.
  points: string[];
}

function official(year: number, title: string, axis: EssayAxis, points: string[]): EssayTheme {
  return { id: `enem-${year}`, title, axis, year, points };
}

function practice(id: string, title: string, axis: EssayAxis, points: string[]): EssayTheme {
  return { id: `treino-${id}`, title, axis, year: null, points };
}

export const ESSAY_THEMES: readonly EssayTheme[] = [
  official(2024, "Desafios para a valorização da herança africana no Brasil", "cultura", [
    "Onde a herança africana aparece no dia a dia e por que ela é pouco reconhecida?",
    "Qual o papel da escola e da mídia nessa valorização?",
    "Que ações concretas o poder público pode tomar?",
  ]),
  official(2023, "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil", "trabalho", [
    "Por que o cuidado com a casa e com a família não é visto como trabalho?",
    "Quais os efeitos dessa sobrecarga na renda e na saúde das mulheres?",
    "Como dividir essa responsabilidade entre família, Estado e empresas?",
  ]),
  official(2022, "Desafios para a valorização de comunidades e povos tradicionais no Brasil", "cultura", [
    "Quem são os povos tradicionais e o que eles preservam?",
    "Como a disputa por terra e a falta de visibilidade os ameaçam?",
    "Que políticas garantem território e voz a essas comunidades?",
  ]),
  official(2021, "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil", "cidadania", [
    "O que acontece com quem não tem certidão de nascimento?",
    "Por que ainda há sub-registro em algumas regiões?",
    "Como levar o registro a quem está longe dos cartórios?",
  ]),
  official(2020, "O estigma associado às doenças mentais na sociedade brasileira", "saude", [
    "De onde vem o preconceito com quem tem uma doença mental?",
    "Como o estigma afasta as pessoas do tratamento?",
    "Que papel têm a informação e o sistema de saúde?",
  ]),
  official(2019, "Democratização do acesso ao cinema no Brasil", "cultura", [
    "Por que muitas cidades não têm uma sala de cinema?",
    "O streaming resolve ou aprofunda a desigualdade de acesso?",
    "Como a escola e o poder público podem aproximar o cinema das pessoas?",
  ]),
  official(2018, "Manipulação do comportamento do usuário pelo controle de dados na internet", "tecnologia", [
    "Como os algoritmos decidem o que cada pessoa vê?",
    "Quais os riscos para a liberdade de escolha e para a democracia?",
    "O que cabe ao usuário, às empresas e ao Estado?",
  ]),
  official(2017, "Desafios para a formação educacional de surdos no Brasil", "educacao", [
    "A escola está preparada para ensinar em Libras?",
    "Quais barreiras os surdos encontram até a universidade?",
    "Que mudanças garantem uma educação bilíngue de verdade?",
  ]),
  official(2016, "Caminhos para combater a intolerância religiosa no Brasil", "cidadania", [
    "Por que algumas religiões sofrem mais ataques que outras?",
    "Como a liberdade de crença aparece na Constituição?",
    "Que papel têm a educação e a punição dos agressores?",
  ]),
  official(2015, "A persistência da violência contra a mulher na sociedade brasileira", "violencia", [
    "Que raízes culturais mantêm essa violência?",
    "Por que muitas vítimas não denunciam?",
    "Como fortalecer a rede de proteção e a prevenção?",
  ]),
  official(2014, "Publicidade infantil em questão no Brasil", "cidadania", [
    "Por que a criança é mais vulnerável à publicidade?",
    "Qual a responsabilidade das famílias, das marcas e do Estado?",
    "Proibir ou regular melhor?",
  ]),
  official(2013, "Efeitos da implantação da Lei Seca no Brasil", "violencia", [
    "O que mudou no trânsito depois da lei?",
    "Por que ainda há quem dirija depois de beber?",
    "Fiscalização, educação ou as duas?",
  ]),
  official(2012, "O movimento imigratório para o Brasil no século XXI", "cidadania", [
    "Por que pessoas de outros países escolhem o Brasil?",
    "Que dificuldades os imigrantes encontram aqui?",
    "Como acolher e integrar quem chega?",
  ]),
  official(2011, "Viver em rede no século XXI: os limites entre o público e o privado", "tecnologia", [
    "O que as pessoas expõem nas redes sem perceber?",
    "Quais os riscos da exposição para a segurança e a reputação?",
    "Como educar para o uso consciente da internet?",
  ]),
  official(2010, "O trabalho na construção da dignidade humana", "trabalho", [
    "O que torna um trabalho digno?",
    "Como o trabalho precário e o infantil ferem a dignidade?",
    "Que garantias o Estado deve oferecer?",
  ]),
  practice("ia-escola", "Os desafios do uso da inteligência artificial na educação brasileira", "tecnologia", [
    "A IA ajuda a aprender ou só a entregar a tarefa pronta?",
    "Quem tem acesso a essas ferramentas e quem fica de fora?",
    "Como a escola pode ensinar a usar a IA com senso crítico?",
  ]),
  practice("desinformacao", "Caminhos para combater a desinformação nas redes sociais no Brasil", "tecnologia", [
    "Por que notícias falsas se espalham mais rápido?",
    "Quais os efeitos na saúde pública e nas eleições?",
    "Educação midiática, regulação das plataformas ou as duas?",
  ]),
  practice("apostas", "Os impactos das apostas on-line na vida dos jovens brasileiros", "saude", [
    "Por que as apostas atraem tanto os jovens?",
    "Quais os riscos para a saúde mental e as finanças?",
    "Como regular a publicidade e proteger quem já está viciado?",
  ]),
  practice("saude-mental-jovens", "A saúde mental dos jovens em debate no Brasil", "saude", [
    "O que tem pesado na saúde mental de quem tem entre 15 e 24 anos?",
    "A escola sabe acolher quem está sofrendo?",
    "Como ampliar o acesso a psicólogos no SUS?",
  ]),
  practice("evasao", "Desafios para combater a evasão escolar no ensino médio brasileiro", "educacao", [
    "Por que tantos jovens deixam a escola antes de terminar?",
    "Qual a relação entre trabalho, renda e evasão?",
    "Que medidas mantêm o estudante na escola?",
  ]),
  practice("leitura", "A formação de leitores no Brasil", "educacao", [
    "Por que tantos brasileiros leem pouco?",
    "O acesso a livros e bibliotecas é igual em todo o país?",
    "Como a escola e a família formam o hábito de ler?",
  ]),
  practice("agua", "Caminhos para garantir o acesso à água potável no Brasil", "ambiente", [
    "Quem ainda vive sem água tratada?",
    "Como a seca e a poluição dos rios agravam o problema?",
    "Que investimentos em saneamento são urgentes?",
  ]),
  practice("lixo", "O desafio do descarte correto do lixo nas cidades brasileiras", "ambiente", [
    "Por que tantos lixões continuam abertos?",
    "Qual o papel dos catadores na reciclagem?",
    "Como cidadãos, empresas e prefeituras podem dividir a responsabilidade?",
  ]),
  practice("eventos-extremos", "Os efeitos das mudanças climáticas nas cidades brasileiras", "ambiente", [
    "Enchentes e ondas de calor atingem todos da mesma forma?",
    "As cidades estão preparadas para eventos extremos?",
    "O que precisa mudar no planejamento urbano?",
  ]),
  practice("alimentacao", "A insegurança alimentar no Brasil do século XXI", "saude", [
    "Por que um país que produz tanto alimento ainda tem fome?",
    "Qual a relação entre renda, preço e qualidade da comida?",
    "Que políticas garantem comida no prato?",
  ]),
  practice("idosos", "Desafios para a valorização da pessoa idosa no Brasil", "cidadania", [
    "Como o envelhecimento da população muda o país?",
    "Onde aparece o preconceito contra os mais velhos?",
    "O que garante cuidado e participação na velhice?",
  ]),
  practice("acessibilidade", "Caminhos para a inclusão das pessoas com deficiência no mercado de trabalho", "trabalho", [
    "A lei de cotas basta para incluir?",
    "Que barreiras físicas e de atitude ainda existem nas empresas?",
    "Como preparar escolas e empresas para a inclusão?",
  ]),
  practice("aplicativos", "O trabalho por aplicativos e a garantia de direitos no Brasil", "trabalho", [
    "Autonomia ou precarização?",
    "Quem paga a conta de acidentes e doenças?",
    "Que direitos mínimos esses trabalhadores precisam ter?",
  ]),
  practice("violencia-escolar", "Desafios para combater a violência nas escolas brasileiras", "violencia", [
    "O que leva a violência para dentro da escola?",
    "Bullying, discurso de ódio na internet e ataques têm relação?",
    "Como unir acolhimento, prevenção e segurança?",
  ]),
  practice("racismo", "Caminhos para combater o racismo estrutural no Brasil", "cidadania", [
    "Onde o racismo aparece além das ofensas diretas?",
    "Como ele se reflete no emprego, na renda e na violência?",
    "Que papel têm as cotas e a educação antirracista?",
  ]),
  practice("patrimonio", "A preservação do patrimônio histórico e cultural brasileiro", "cultura", [
    "Por que tantos prédios e acervos se perdem?",
    "Patrimônio é só o que está em museu?",
    "Como envolver as comunidades na preservação?",
  ]),
  practice("esporte", "O esporte como ferramenta de inclusão social no Brasil", "cultura", [
    "O que o esporte oferece além da atividade física?",
    "Quem tem acesso a quadras, treinadores e equipamentos?",
    "Como transformar o esporte em política pública?",
  ]),
];

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

// Já escrito: alguma redação registrada com o mesmo tema (sem diferenciar acento, maiúscula ou pontuação).
export function themeWritten(theme: EssayTheme, essays: readonly Essay[]): boolean {
  const title = normalize(theme.title);
  return essays.some((essay) => {
    const written = normalize(essay.theme);
    return written.length > 10 && (written.includes(title) || title.includes(written));
  });
}

// Sugere temas ainda não escritos, de eixos diferentes, começando pelos menos treinados. A semana muda a ordem
// dentro do mesmo peso, para a sugestão não ficar parada.
export function recommendThemes(themes: readonly EssayTheme[], essays: readonly Essay[], weekSeed: number, count = 3): EssayTheme[] {
  const written = themes.filter((theme) => themeWritten(theme, essays));
  const axisCount = (axis: EssayAxis) => written.filter((theme) => theme.axis === axis).length;
  const ranked = themes
    .filter((theme) => !themeWritten(theme, essays))
    .map((theme, index) => ({ theme, weight: axisCount(theme.axis), order: (index * 7 + weekSeed * 11) % themes.length }))
    .sort((first, second) => first.weight - second.weight || first.order - second.order)
    .map(({ theme }) => theme);
  const picked: EssayTheme[] = [];
  for (const theme of ranked) if (picked.length < count && !picked.some((item) => item.axis === theme.axis)) picked.push(theme);
  for (const theme of ranked) if (picked.length < count && !picked.includes(theme)) picked.push(theme);
  return picked;
}
