import { describe, expect, it } from "vitest";
import {
  CARD_FRONT_MAX,
  cardCounts,
  createCard,
  dueCards,
  editCard,
  intervalLabel,
  parseAnkiText,
  previewInterval,
  reviewCard,
  validateCard,
  type CardInput,
} from "./flashcards";

const input: CardInput = { front: "  Mitose  ", back: " Divisão que gera 2 células iguais ", areaId: "nat", subjectId: "bio", topicId: null };
const today = "2026-10-19";

describe("cards", () => {
  it("valida frente e verso", () => {
    expect(validateCard(input)).toBeNull();
    expect(validateCard({ ...input, front: " " })).toBe("Escreva a pergunta ou o termo da frente.");
    expect(validateCard({ ...input, back: "" })).toBe("Escreva a resposta do verso.");
    expect(validateCard({ ...input, front: "a".repeat(CARD_FRONT_MAX + 1) })).toMatch(/até/);
  });

  it("cria para hoje e edita sem perder o agendamento", () => {
    const card = createCard(input, "c1", today);
    expect(card).toMatchObject({ front: "Mitose", due: today, interval: 0, reps: 0, ease: 2.5 });
    const reviewed = reviewCard(card, "bom", today);
    const edited = editCard(reviewed, { ...input, front: "Mitose (fases)" });
    expect(edited).toMatchObject({ front: "Mitose (fases)", due: reviewed.due, reps: 1 });
  });
});

describe("reviewCard", () => {
  const card = createCard(input, "c1", today);

  it("primeira resposta: errei hoje, difícil e bom amanhã, fácil em 4 dias", () => {
    expect(reviewCard(card, "errei", today)).toMatchObject({ due: today, interval: 0, reps: 0, lapses: 1, ease: 2.3 });
    expect(reviewCard(card, "dificil", today)).toMatchObject({ due: "2026-10-20", interval: 1, ease: 2.35 });
    expect(reviewCard(card, "bom", today)).toMatchObject({ due: "2026-10-20", interval: 1, reps: 1 });
    expect(reviewCard(card, "facil", today)).toMatchObject({ due: "2026-10-23", interval: 4, ease: 2.65 });
  });

  it("cresce pela facilidade a cada acerto e recomeça ao errar", () => {
    const first = reviewCard(card, "bom", today);
    const second = reviewCard(first, "bom", "2026-10-20");
    expect(second).toMatchObject({ interval: 3, due: "2026-10-23", reps: 2 });
    const third = reviewCard(second, "bom", "2026-10-23");
    expect(third.interval).toBe(8);
    expect(reviewCard(second, "dificil", "2026-10-23").interval).toBe(4);
    expect(reviewCard(second, "facil", "2026-10-23").interval).toBe(10);
    const lapse = reviewCard(third, "errei", "2026-10-31");
    expect(lapse).toMatchObject({ interval: 0, due: "2026-10-31", reps: 0, lapses: 1 });
  });

  it("nunca deixa a facilidade abaixo de 1,3", () => {
    let current = card;
    for (let index = 0; index < 10; index++) current = reviewCard(current, "errei", today);
    expect(current.ease).toBe(1.3);
  });

  it("mostra o intervalo de cada botão antes de responder", () => {
    expect(previewInterval(card, "facil")).toBe(4);
    expect(intervalLabel(0)).toBe("hoje");
    expect(intervalLabel(8)).toBe("8 d");
    expect(intervalLabel(60)).toBe("2 m");
    expect(intervalLabel(400)).toBe("1,1 a");
  });
});

describe("queues", () => {
  it("lista os vencidos e conta por estágio", () => {
    const fresh = createCard(input, "c1", today);
    const later = { ...reviewCard(fresh, "bom", today), id: "c2" };
    const mature = { ...fresh, id: "c3", interval: 30, reps: 5, due: "2026-11-30" };
    expect(dueCards([later, fresh, mature], today).map((card) => card.id)).toEqual(["c1"]);
    expect(cardCounts([fresh, later, mature])).toEqual({ total: 3, fresh: 1, learning: 1, mature: 1 });
  });
});

describe("parseAnkiText", () => {
  it("lê a exportação do Anki com cabeçalhos, HTML e colunas extras", () => {
    const text = [
      "#separator:tab",
      "#html:true",
      "#guid column:1",
      "#notetype column:2",
      "#deck column:3",
      "#tags column:6",
      "a1\tBásico\tEnem::Bio\tMitose\tGera <b>duas</b> células<br>iguais\tbio",
      'a2\tBásico\tEnem::Bio\t"Meiose; fases"\t"Gera ""quatro"" células"\tbio',
      "a3\tBásico\tEnem::Bio\t<img src=\"x.png\">\tSó imagem\tbio",
    ].join("\n");
    expect(parseAnkiText(text)).toEqual({
      cards: [
        { front: "Mitose", back: "Gera duas células\niguais" },
        { front: "Meiose; fases", back: 'Gera "quatro" células' },
      ],
      skipped: 1,
    });
  });

  it("aceita texto simples com ponto e vírgula, aspas com quebra de linha e entidades", () => {
    const text = 'Capital do Brasil;Brasília\r\n"Fórmula\nde Bhaskara";"x = (&minus;b &plusmn; &#8730;&Delta;) / 2a"\n\n;sem frente\n';
    const result = parseAnkiText(text);
    expect(result.cards[0]).toEqual({ front: "Capital do Brasil", back: "Brasília" });
    expect(result.cards[1].front).toBe("Fórmula\nde Bhaskara");
    expect(result.cards[1].back).toContain("√");
    expect(result.skipped).toBe(1);
  });

  it("respeita html:false e o separador por nome", () => {
    expect(parseAnkiText("#separator:Pipe\n#html:false\n<b>a</b>|b").cards).toEqual([{ front: "<b>a</b>", back: "b" }]);
  });
});
