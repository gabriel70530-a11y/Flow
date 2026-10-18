import type { AreaId, SubjectId } from "./syllabus";
import type { TopicRecord } from "./topics";

/*
 * Tópicos que versões anteriores do app (e o protótipo) traziam prontos, com IDs `${área}-${índice}`.
 * O app não traz mais tópicos; esta lista só serve para a migração reconstruir os que já têm histórico.
 */
const LEGACY_NAMES: Record<AreaId, string[]> = {
  mat: [
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
  lin: [
    "Interpretação de texto",
    "Gêneros textuais",
    "Funções da linguagem",
    "Figuras de linguagem",
    "Variação linguística",
    "Escolas literárias",
    "Artes e vanguardas",
    "Inglês ou espanhol",
  ],
  nat: [
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
  hum: [
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
  red: [
    "Estrutura dissertativo-argumentativa",
    "Competência 1: norma culta",
    "Competência 2: tema e repertório",
    "Competência 3: argumentação",
    "Competência 4: coesão",
    "Competência 5: proposta de intervenção",
    "Repertório sociocultural",
  ],
};

// Matéria de cada tópico antigo de Natureza e Humanas, na mesma ordem dos nomes.
const LEGACY_SUBJECTS: Partial<Record<AreaId, SubjectId[]>> = {
  nat: ["bio", "bio", "bio", "qui", "qui", "qui", "fis", "fis", "fis", "fis"],
  hum: ["his", "his", "his", "his", "fil", "soc", "geo", "geo", "geo"],
};

export function legacySubject(topicId: string): SubjectId | null {
  const [areaId, index] = topicId.split("-");
  return LEGACY_SUBJECTS[areaId as AreaId]?.[Number(index)] ?? null;
}

export function legacyTopics(): TopicRecord[] {
  return (Object.keys(LEGACY_NAMES) as AreaId[]).flatMap((areaId) =>
    LEGACY_NAMES[areaId].map((name, index) => ({
      id: `${areaId}-${index}`,
      areaId,
      subjectId: LEGACY_SUBJECTS[areaId]?.[index] ?? null,
      name,
      description: "",
      priority: "media" as const,
      hidden: false,
    })),
  );
}
