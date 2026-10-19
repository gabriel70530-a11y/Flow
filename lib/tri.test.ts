import { describe, expect, it } from "vitest";
import { OFFICIAL_EXAMS, findOfficialExam, type Letter } from "./official-exams";
import { estimateExamScores, estimateTheta, hasTriItems } from "./tri";
import { TRI_ITEMS } from "./tri-items";

// Candidatos reais dos microdados do Inep (só as respostas e a nota oficial, sem nenhum dado pessoal).
const CANDIDATES = [
  { exam: "2022-1", area: "lin", language: "espanhol", answers: "DACECBAEAABBEAACDCCBAEBEBABCCDCBEEDAABDCADBEB", score: 400.2 },
  { exam: "2022-1", area: "lin", language: "ingles", answers: "CCBDBECEAECBDDECACCDBACECCBADBCAADACCCDDBCEDE", score: 551.4 },
  { exam: "2022-2", area: "mat", language: "ingles", answers: "CBEACDCDBACACCBBACAADCDEBADEABEDACCEABCADCBCD", score: 352.4 },
  { exam: "2022-2", area: "mat", language: "ingles", answers: "DCBDBBBDAEAADCEDACCBAAEBECDCBCBBCEBCACBEBECDE", score: 536.3 },
  { exam: "2023-2", area: "nat", language: "ingles", answers: "DBEEBDBBACDCABADCDAACECDBBDECDADBBECDCDDCEAAD", score: 644.9 },
  { exam: "2023-1", area: "hum", language: "ingles", answers: "CDBDBEEDAACBBEDECADDABCDCDBAECBAEAACBEDDEBEDA", score: 553.1 },
  { exam: "2023-1", area: "lin", language: "espanhol", answers: "ACCECCABEEDCCCABDDBDBCEEBDACCDCBCDACDADEBECAD", score: 512.8 },
] as const;

function dayAnswers(area: string, answers: string): (Letter | null)[] {
  const day: (Letter | null)[] = Array(90).fill(null);
  const offset = area === "hum" || area === "mat" ? 45 : 0;
  [...answers].forEach((char, index) => {
    day[offset + index] = "ABCDE".includes(char) ? (char as Letter) : null;
  });
  return day;
}

describe("estimateExamScores", () => {
  it.each(CANDIDATES)("reproduz a nota oficial ($exam, $area, $score)", ({ exam, area, language, answers, score }) => {
    const scores = estimateExamScores(findOfficialExam(exam)!, dayAnswers(area, answers), language, area);
    expect(Math.abs(scores[area]! - score)).toBeLessThanOrEqual(0.2);
  });

  it("estima as duas áreas do dia e nenhuma quando não há parâmetros", () => {
    const exam = findOfficialExam("2024-2")!;
    const perfect = [...exam.key].map((letter) => (letter === "*" ? null : (letter as Letter)));
    const scores = estimateExamScores(exam, perfect, "ingles");
    expect(scores.nat).toBeGreaterThan(750);
    expect(scores.mat).toBeGreaterThan(850);
    expect(estimateExamScores({ ...exam, id: "2010-2" }, perfect, "ingles")).toEqual({});
  });

  it("acertar mais nunca baixa a nota", () => {
    const exam = findOfficialExam("2023-2")!;
    const blank = estimateExamScores(exam, Array(90).fill(null), "ingles", "mat").mat!;
    const one = estimateExamScores(exam, [...Array(45).fill(null), exam.key[45] as Letter], "ingles", "mat").mat!;
    expect(one).toBeGreaterThan(blank);
  });
});

describe("tri items", () => {
  it("tem os parâmetros das 45 questões de cada área das provas com gabarito", () => {
    for (const exam of OFFICIAL_EXAMS) {
      expect(hasTriItems(exam)).toBe(true);
      for (const items of Object.values(TRI_ITEMS[exam.id].areas)) expect(items).toHaveLength(45);
      if (exam.day === 1) expect(TRI_ITEMS[exam.id].foreign?.espanhol).toHaveLength(5);
    }
  });

  it("sem respostas, o θ fica na média da priori", () => {
    expect(estimateTheta([])).toBeCloseTo(0, 5);
  });
});
