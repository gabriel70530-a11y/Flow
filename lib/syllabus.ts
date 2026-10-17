export type AreaId = "mat" | "lin" | "nat" | "hum" | "red";

export interface Area {
  id: AreaId;
  name: string;
  topics: readonly string[];
}

export interface Topic {
  id: string;
  name: string;
  area: Area;
}

export const AREAS: readonly Area[] = [
  {
    id: "mat",
    name: "Matemática",
    topics: [
      "Razão e proporção",
      "Porcentagem e juros",
      "Estatística: média, moda e mediana",
      "Probabilidade",
      "Geometria plana",
      "Geometria espacial",
      "Funções de 1º e 2º grau",
      "Análise combinatória",
      "Leitura de gráficos e tabelas",
      "Escalas e unidades",
    ],
  },
  {
    id: "lin",
    name: "Linguagens",
    topics: [
      "Interpretação de texto",
      "Gêneros textuais",
      "Funções da linguagem",
      "Figuras de linguagem",
      "Variação linguística",
      "Escolas literárias",
      "Artes e vanguardas",
      "Inglês ou espanhol",
    ],
  },
  {
    id: "nat",
    name: "Ciências da Natureza",
    topics: [
      "Ecologia",
      "Genética",
      "Citologia",
      "Estequiometria",
      "Química orgânica",
      "Eletroquímica",
      "Cinemática",
      "Eletricidade",
      "Ondulatória",
      "Energia e trabalho",
    ],
  },
  {
    id: "hum",
    name: "Ciências Humanas",
    topics: [
      "Brasil Colônia",
      "Era Vargas",
      "Ditadura militar",
      "Revolução Industrial",
      "Filosofia antiga",
      "Sociologia clássica",
      "Geopolítica",
      "Cartografia",
      "Questões ambientais",
    ],
  },
  {
    id: "red",
    name: "Redação",
    topics: [
      "Estrutura dissertativo-argumentativa",
      "Competência 1: norma culta",
      "Competência 2: tema e repertório",
      "Competência 3: argumentação",
      "Competência 4: coesão",
      "Competência 5: proposta de intervenção",
      "Repertório sociocultural",
    ],
  },
];

export const TOPICS: readonly Topic[] = AREAS.flatMap((area) =>
  area.topics.map((name, index) => ({ id: `${area.id}-${index}`, name, area })),
);

const topicsById = new Map(TOPICS.map((topic) => [topic.id, topic]));

export function findTopic(id: string): Topic | undefined {
  return topicsById.get(id);
}
