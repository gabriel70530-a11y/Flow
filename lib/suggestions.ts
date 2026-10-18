import { subjectsOf, type AreaId, type SubjectId } from "./syllabus";
import type { TopicRecord } from "./topics";

/*
 * Atalhos para o nome do tópico, na ordem do que mais caiu no Enem de 2014 a 2024 (análise de incidência
 * "ENEM's Anatomy" e levantamentos públicos). Não são tópicos prontos: nada é criado sem a pessoa pedir.
 * Redação segue as cinco competências da correção oficial.
 */
const SUGGESTIONS: Record<Exclude<AreaId, "nat" | "hum"> | SubjectId, readonly string[]> = {
  mat: [
    "Razão e proporção",
    "Porcentagem",
    "Gráficos e tabelas",
    "Média, moda e mediana",
    "Geometria espacial",
    "Geometria plana: áreas",
    "Função afim",
    "Probabilidade",
    "Exponencial e logaritmo",
    "Unidades de medida e escalas",
  ],
  lin: [
    "Interpretação de texto",
    "Variação linguística",
    "Funções da linguagem",
    "Coesão e conectivos",
    "Figuras de linguagem",
    "Gêneros textuais",
    "Textos publicitários",
    "Machado de Assis e Realismo",
    "Modernismo",
    "Inglês ou espanhol: leitura",
  ],
  red: [
    "Estrutura dissertativa-argumentativa",
    "Tese e argumentação",
    "Repertório sociocultural",
    "Coesão e conectivos",
    "Proposta de intervenção",
    "Norma culta",
  ],
  bio: [
    "Ecologia",
    "Poluição e desequilíbrios ecológicos",
    "Ciclos biogeoquímicos",
    "Botânica",
    "Fermentação, respiração e fotossíntese",
    "Fisiologia humana",
    "Biotecnologia e DNA",
    "Evolução",
    "Genética e heredogramas",
    "Vírus, bactérias e doenças",
  ],
  fis: [
    "Circuitos elétricos",
    "Potência e energia elétrica",
    "Trabalho e energia",
    "Leis de Newton",
    "Fenômenos ondulatórios",
    "Calorimetria",
    "Transmissão de calor",
    "MU e MUV",
    "Óptica: refração e visão",
    "Hidrostática",
  ],
  qui: [
    "Estequiometria",
    "Química básica e separação de misturas",
    "Soluções e concentração",
    "Equilíbrio químico e pH",
    "Forças intermoleculares",
    "Reações orgânicas",
    "Funções inorgânicas",
    "Termoquímica",
    "Eletroquímica: pilhas",
    "Química ambiental",
  ],
  his: [
    "Brasil Colônia",
    "Era Vargas",
    "Segundo Reinado",
    "República Oligárquica",
    "Ditadura militar",
    "Expansão marítima",
    "Iluminismo e Revolução Francesa",
    "Guerra Fria",
    "Grécia e Roma antigas",
    "Povos indígenas e escravidão",
  ],
  geo: [
    "Globalização",
    "Geopolítica mundial",
    "Geologia e relevo",
    "Clima",
    "Cartografia",
    "Desmatamento e biodiversidade",
    "Questão agrária no Brasil",
    "Urbanização",
    "Demografia e migrações",
    "Vegetação do Brasil",
  ],
  fil: [
    "Filosofia política e contratualistas",
    "Descartes e o racionalismo",
    "Sócrates e os sofistas",
    "Aristóteles: ética e política",
    "Helenismo",
    "Kant",
    "Escola de Frankfurt e indústria cultural",
    "Foucault: poder e vigilância",
    "Hume e o empirismo",
    "Pré-socráticos",
  ],
  soc: [
    "Gênero",
    "Desigualdades sociais",
    "Diversidade cultural",
    "Cidadania e direitos",
    "Democracia",
    "Movimentos sociais",
    "Capitalismo e globalização",
    "Questão racial",
    "Trabalho e modelos de produção",
    "Weber, Durkheim e Marx",
  ],
};

// Sugestões da área ou matéria escolhida. Em Natureza e Humanas, sem matéria escolhida, devolve null.
export function topicSuggestions(areaId: AreaId, subjectId: SubjectId | null): readonly string[] | null {
  if (subjectsOf(areaId).length > 0) return subjectId ? SUGGESTIONS[subjectId as SubjectId] : null;
  return SUGGESTIONS[areaId as Exclude<AreaId, "nat" | "hum">];
}

function normalize(name: string): string {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLocaleLowerCase("pt-BR");
}

// A sugestão já existe se há um tópico com o mesmo nome na área, sem diferenciar acento ou maiúscula.
export function hasTopicNamed(topics: readonly TopicRecord[], areaId: AreaId, name: string): boolean {
  const target = normalize(name);
  return topics.some((topic) => topic.areaId === areaId && normalize(topic.name) === target);
}
