import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlanTask } from "@/lib/planner";
import { GENERAL_STUDY } from "@/lib/sessions";
import { legacyTopics } from "@/lib/legacy-topics";
import { findOfficialExam } from "@/lib/official-exams";
import { poolFromExam } from "@/lib/question-blocks";
import { findTopic } from "@/lib/topics";
import { usePro } from "./pro";
import { emptyData } from "./state";
import { useStudyStore } from "./study-store";

const today = "2026-10-16";
const start = new Date(2026, 9, 16, 10, 0, 0);
const advance = (seconds: number) => vi.setSystemTime(start.getTime() + seconds * 1000);
const state = () => useStudyStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(start);
  useStudyStore.setState({ ...emptyData(), topics: legacyTopics() });
  // A maior parte dos testes cobre o Pro; o plano gratuito tem o próprio bloco no fim.
  usePro.setState({ record: { plan: "mensal", status: "ativa", proUntil: "2027-01-01T00:00:00Z" } });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("timer and sessions", () => {
  it("does not start without choosing what to study", () => {
    expect(state().startTimer()).toBe(false);
    expect(state().timer.running).toBe(false);
  });

  it("records focus time without pauses and never duplicates on repeated finish", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    state().pauseTimer();
    advance(900);
    state().startTimer();
    advance(1200);

    expect(state().finishTimer()?.sec).toBe(900);
    expect(state().finishTimer()).toBeNull();
    expect(state().sessions).toHaveLength(1);
    expect(state().sessions[0]).toMatchObject({
      topicId: "mat-2",
      areaId: "mat",
      date: today,
      sec: 900,
      start: start.getTime(),
      end: start.getTime() + 1_200_000,
      state: "interrompida",
    });
    expect(state().progress["mat-2"].status).toBe("and");
  });

  it("records general study without area and finishes the stopwatch as concluded", () => {
    state().setTimerMode("cronometro");
    state().setTimerTopic(GENERAL_STUDY);
    state().startTimer();
    advance(300);
    expect(state().finishTimer()).toMatchObject({ topicId: null, areaId: null, state: "concluida", mode: "cronometro" });
  });

  it("discards without recording", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    state().discardTimer();
    expect(state().sessions).toEqual([]);
    expect(state().timer.running).toBe(false);
  });

  it("offers the break after a focus block and the next block after the break", () => {
    state().setTimerTopic("lin-0");
    state().startTimer();
    advance(25 * 60 - 1);
    expect(state().tick()).toBeNull();

    advance(25 * 60 + 3);
    expect(state().tick()).toMatchObject({ kind: "focus-done", session: { topicId: "lin-0", sec: 1500, state: "concluida" } });
    expect(state().timer).toMatchObject({ phase: "break", running: false });
    expect(state().tick()).toBeNull();

    state().startTimer();
    advance(35 * 60);
    expect(state().tick()).toEqual({ kind: "break-done" });
    expect(state().timer).toMatchObject({ phase: "focus", running: false });
    expect(state().sessions).toHaveLength(1);
  });

  it("locks mode, durations and topic while a session is in progress", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    state().setTimerMode("cronometro");
    state().setFocusMinutes(50);
    state().setTimerTopic("lin-0");
    expect(state().studyTopic("lin-0")).toBe(false);
    expect(state().timer).toMatchObject({ mode: "pomodoro", focus: 25, topicId: "mat-2" });
  });

  it("opens a plan task in the stopwatch with no time limit and only closes it by mastery", () => {
    const task: PlanTask = {
      id: "t1", topicId: "nat-1", areaId: "nat", kind: "estudo", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [task] });
    expect(state().studyTopic("nat-1", "t1")).toBe(true);
    expect(state().timer).toMatchObject({ topicId: "nat-1", taskId: "t1", mode: "cronometro" });

    state().startTimer();
    expect(state().tasks[0].status).toBe("iniciada");
    advance(2 * 60 * 60);
    state().finishTimer();
    expect(state().tasks[0]).toMatchObject({ status: "iniciada", focusSec: 7200 });

    const result = state().answerMastery("t1", false);
    expect(state().tasks[0].status).toBe("concluida");
    expect(result?.repeat).toMatchObject({ topicId: "nat-1", date: "2026-10-17", origin: "repeticao", status: "planejada" });
    expect(state().progress["nat-1"].status).toBe("and");

    expect(state().answerMastery(result!.repeat.id, true)).toBeNull();
    expect(state().progress["nat-1"].status).toBe("concluido");
    expect(state().progress["nat-1"].reviews).toHaveLength(4);
    expect(state().answerMastery("t1", true)).toBeNull();
  });

  it("completes the review when a review task is mastered", () => {
    state().setStatus("lin-0", "concluido");
    const task: PlanTask = {
      id: "r1", topicId: "lin-0", areaId: "lin", kind: "revisao", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [task] });
    state().answerMastery("r1", true);
    expect(state().progress["lin-0"].reviews[0]).toMatchObject({ done: today, feedback: "bem" });
  });

  it("stores reflection and a trimmed note on the session", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    const session = state().finishTimer()!;
    state().setSessionReflection(session.id, "dificuldade");
    state().setSessionNote(session.id, "  revisar regra de três  ");
    expect(state().sessions[0]).toMatchObject({ reflection: "dificuldade", note: "revisar regra de três" });
    expect(state().progress["mat-2"].status).toBe("and");
  });
});

describe("topics", () => {
  it("creates, validates and edits custom topics", () => {
    expect(state().addTopic({ name: " ", areaId: "mat", subjectId: null, description: "", priority: "media" })).toEqual({
      error: "Dê um nome ao tópico.",
    });
    const result = state().addTopic({ name: "Matrizes", areaId: "mat", subjectId: null, description: "", priority: "alta" });
    if (!("id" in result)) throw new Error(result.error);
    expect(result.id).toMatch(/^custom-/);
    expect(state().editTopic(result.id, { name: "Probabilidade", areaId: "mat", subjectId: null, description: "", priority: "alta" })).toMatch(/Já existe/);
    expect(state().topics).toHaveLength(45);
  });

  it("keeps sessions when hiding or deleting a topic", () => {
    const result = state().addTopic({ name: "Matrizes", areaId: "mat", subjectId: null, description: "", priority: "alta" });
    if (!("id" in result)) throw new Error(result.error);
    state().setTimerTopic(result.id);
    state().startTimer();
    advance(600);
    state().finishTimer();

    state().setTopicHidden(result.id, true);
    expect(state().sessions).toHaveLength(1);
    state().removeTopic(result.id);
    expect(findTopic(state().topics, result.id)).toBeUndefined();
    expect(state().progress[result.id]).toBeUndefined();
    expect(state().sessions[0]).toMatchObject({ topicId: result.id, areaId: "mat" });
  });

  it("deletes any topic", () => {
    state().removeTopic("mat-0");
    expect(findTopic(state().topics, "mat-0")).toBeUndefined();
  });
});

describe("reviews and settings", () => {
  it("rejects rescheduling to the past", () => {
    state().setStatus("mat-0", "concluido");
    expect(state().rescheduleReview("mat-0", "2026-10-01")).toBe(false);
    expect(state().rescheduleReview("mat-0", "2026-10-20")).toBe(true);
    expect(state().progress["mat-0"].reviews[0].due).toBe("2026-10-20");
  });

  it("clamps the weekly goal per type and the durations", () => {
    state().setGoal({ type: "horas", value: 500 });
    expect(state().goal).toEqual({ type: "horas", value: 100 });
    state().setGoal({ type: "topicos", value: 0 });
    expect(state().goal).toEqual({ type: "topicos", value: 5 });
    state().setFocusMinutes(0);
    state().setBreakMinutes(90);
    expect(state().timer).toMatchObject({ focus: 25, brk: 60 });
  });

  it("sets and clears the mastery level", () => {
    state().setMastery("nat-1", 3);
    expect(state().progress["nat-1"].mastery).toBe(3);
    state().setMastery("nat-1", 0);
    expect(state().progress["nat-1"].mastery).toBe(0);
  });

  it("keeps interface preferences when resetting the data", () => {
    useStudyStore.setState({ demo: true, theme: "dark", sound: false, showStreak: false });
    state().resetData();
    expect(state()).toMatchObject({ demo: false, sessions: [], progress: {}, theme: "dark", sound: false, showStreak: false });
    expect(state().topics).toEqual([]);
  });
});

describe("plan", () => {
  it("finishes onboarding with at most two topics on each chosen day", () => {
    const settings = { ...state().planner, studyDays: [true, true, true, true, true, false, false] };
    expect(state().finishOnboarding(settings, "sugerido")).toBeNull();
    expect(state().onboarding.status).toBe("concluido");
    expect(state().tasks.filter((task) => task.date === today)).toHaveLength(2);
    expect(state().tasks.filter((task) => task.date === "2026-10-17")).toHaveLength(0);
  });

  it("saves preferences without a plan in manual mode and needs at least one study day", () => {
    const none = { ...state().planner, studyDays: Array(7).fill(false) };
    const monday = { ...state().planner, studyDays: [true, false, false, false, false, false, false] };
    expect(state().finishOnboarding(none, "manual")).toMatch(/pelo menos um dia/);
    expect(state().finishOnboarding(monday, "manual")).toBeNull();
    expect(state().tasks).toEqual([]);
  });

  it("keeps completed tasks when regenerating", () => {
    state().regeneratePlan();
    const first = state().tasks[0];
    state().setTaskDone(first.id, true);
    state().regeneratePlan();
    expect(state().tasks.find((task) => task.id === first.id)?.status).toBe("concluida");
    expect(new Set(state().tasks.map((task) => `${task.kind}:${task.topicId}`)).size).toBe(state().tasks.length);
  });

  it("carries topics that were not studied to the next study day", () => {
    const missed: PlanTask = {
      id: "m1", topicId: "mat-3", areaId: "mat", kind: "estudo", date: "2026-10-15",
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [missed] });
    expect(state().carryOver().map((task) => task.date)).toEqual([today]);
    expect(state().tasks[0]).toMatchObject({ date: today, origin: "transferida" });
    expect(state().carryOver()).toEqual([]);
  });

  it("validates manual tasks, keeps two per day and unlinks the timer when a task is removed", () => {
    expect(state().addTask({ topicId: "mat-0", date: "2026-10-01", priority: "media" })).toMatch(/data/);
    expect(state().addTask({ topicId: "mat-0", date: today, priority: "media" })).toBeNull();
    expect(state().addTask({ topicId: "mat-1", date: today, priority: "media" })).toBeNull();
    expect(state().addTask({ topicId: "mat-2", date: today, priority: "media" })).toMatch(/2 matérias/);
    expect(state().addTask({ topicId: "lin-0", date: "2026-10-17", priority: "media" })).toBeNull();
    expect(state().addTask({ topicId: "mat-2", date: "2026-10-17", priority: "media" })).toMatch(/dia é de Linguagens/);
    expect(state().addTask({ topicId: "area:lin", date: "2026-10-17", priority: "media" })).toBeNull();
    const task = state().tasks[0];
    expect(task).toMatchObject({ origin: "manual", areaId: "mat", status: "planejada" });
    state().studyTopic("mat-0", task.id);
    state().removeTask(task.id);
    expect(state().tasks).toHaveLength(3);
    expect(state().tasks.at(-1)).toMatchObject({ topicId: null, areaId: "lin" });
    expect(state().timer.taskId).toBe("");
  });

  it("moves tasks only to today or later, never to a full day, and to another week", () => {
    state().addTask({ topicId: "mat-0", date: today, priority: "alta" });
    state().addTask({ topicId: "mat-1", date: "2026-10-17", priority: "media" });
    state().addTask({ topicId: "mat-2", date: "2026-10-17", priority: "media" });
    const { id } = state().tasks[0];
    expect(state().moveTask(id, "2026-10-01")).toMatch(/data futura/);
    expect(state().moveTask(id, "2026-10-17")).toMatch(/2 matérias/);
    expect(state().moveTask(id, null)).toBeNull();
    expect(state().tasks[0]).toMatchObject({ date: null, status: "adiada" });
    state().lowerTaskPriority(id);
    expect(state().tasks[0].priority).toBe("media");
  });
});

describe("backup", () => {
  it("exports and imports the data without the running timer", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    state().finishTimer();
    state().startTimer();
    const backup = state().exportBackup();
    expect(JSON.parse(backup)).not.toHaveProperty("addTopic");

    useStudyStore.setState({ ...emptyData(), topics: legacyTopics() });
    expect(state().importBackup("nope")).toMatch(/não parece/);
    expect(state().importBackup(backup)).toBeNull();
    expect(state().sessions).toHaveLength(1);
    expect(state().timer.running).toBe(false);
    expect(state().demo).toBe(false);
  });
});

describe("mastery outcome", () => {
  it("records whether the topic was mastered or will be repeated", () => {
    const base: PlanTask = {
      id: "a", topicId: "mat-3", areaId: "mat", kind: "estudo", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [base, { ...base, id: "b", topicId: "lin-3" }] });
    const repeat = state().answerMastery("a", false)?.repeat;
    state().answerMastery("b", true);
    expect(state().tasks.find((task) => task.id === "a")).toMatchObject({ status: "concluida", outcome: "repetir" });
    expect(state().tasks.find((task) => task.id === "b")).toMatchObject({ status: "concluida", outcome: "dominada" });
    expect(repeat).not.toHaveProperty("outcome");
    state().setTaskDone("a", false);
    expect(state().tasks.find((task) => task.id === "a")?.outcome).toBeUndefined();
  });
});

describe("final stretch tools", () => {
  const mistake = { topicId: "mat-0", areaId: "mat" as const, subjectId: null, reason: "conteudo" as const, question: "Questão 150", lesson: "", source: "" };

  it("records mistakes, suggests reviewing the topic on the second one and moves them through reviews", () => {
    expect(state().addMistake({ ...mistake, question: " " })).toEqual({ error: "Descreva a questão ou o que você errou." });
    expect(state().addMistake(mistake)).toMatchObject({ suggestReview: false });
    const second = state().addMistake(mistake);
    expect(second).toMatchObject({ suggestReview: true });
    state().setStatus("mat-0", "revisar");
    expect(state().addMistake(mistake)).toMatchObject({ suggestReview: false });
    const id = state().mistakes[0].id;
    state().answerMistake(id, true);
    expect(state().mistakes[0]).toMatchObject({ stage: 1, due: "2026-10-23" });
    state().removeMistake(id);
    expect(state().mistakes).toHaveLength(2);
    state().clearMistakes();
    expect(state().mistakes).toEqual([]);
  });

  it("lightens today by moving the second topic to the next study day", () => {
    state().addTask({ topicId: "mat-0", date: today, priority: "media" });
    state().addTask({ topicId: "mat-1", date: today, priority: "media" });
    const moved = state().lightenToday();
    expect(moved).toHaveLength(1);
    expect(state().tasks.filter((task) => task.date === today)).toHaveLength(1);
    expect(state().lightenToday()).toEqual([]);
  });

  it("validates mock exams, essays and repertoire", () => {
    expect(state().addMockExam({ date: today, day: 2, minutes: null, sections: [], note: "" })).toMatch(/pelo menos uma/);
    expect(state().addMockExam({ date: today, day: 2, minutes: 290, sections: [{ areaId: "mat", correct: 30, total: 45 }], note: "" })).toBeNull();
    expect(state().addEssay({ date: today, theme: " Tema ", scores: [160, 160, 120, 160, 120], corrector: "", improve: "" })).toBeNull();
    expect(state().essays[0].theme).toBe("Tema");
    expect(state().addRepertoire({ title: "", detail: "", themes: "" })).toMatch(/repertório/);
    expect(state().mockExams).toHaveLength(1);
  });

  it("checks exam checklist items per day", () => {
    state().toggleChecklistItem("d1-caneta");
    state().toggleChecklistItem("d2-caneta");
    state().resetChecklist(1);
    expect(state().examChecklist).toEqual(["d2-caneta"]);
  });
});

describe("scheduling reviews for topics already studied", () => {
  it("concludes the chosen topics with four reviews from today and skips concluded or missing ones", () => {
    state().setStatus("mat-1", "concluido");
    expect(state().markStudied(["mat-0", "mat-1", "inexistente"])).toBe(1);
    expect(state().progress["mat-0"]).toMatchObject({ status: "concluido", completedAt: today });
    expect(state().progress["mat-0"].reviews.map((review) => review.due)).toEqual([
      "2026-10-17",
      "2026-10-23",
      "2026-10-31",
      "2026-11-15",
    ]);
  });
});

describe("official mock exam in the app", () => {
  it("grades by the official key, records the mock exam and the time without pauses", () => {
    expect(state().startExam("2024-2", { language: "ingles", format: "pdf", scope: "dia" })).toBeNull();
    expect(state().startExam("2024-1", { language: "ingles", format: "pdf", scope: "dia" })).toBe("Termine ou descarte o simulado em andamento.");
    state().answerExam(0, "B");
    state().answerExam(1, "A");
    advance(1800);
    state().pauseExam();
    advance(2400);
    state().resumeExam();
    advance(4200);

    const result = state().finishExam();
    expect(result).toMatchObject({ examId: "2024-2" });
    expect(state().examDraft).toBeNull();
    expect(state().mockExams).toEqual([
      expect.objectContaining({
        date: today,
        day: 2,
        minutes: 60,
        sections: [
          { areaId: "nat", correct: 1, total: 44, score: expect.any(Number) },
          { areaId: "mat", correct: 0, total: 45, score: expect.any(Number) },
        ],
      }),
    ]);
  });

  it("sends the wrong answers to the mistake log, due tomorrow", () => {
    state().startExam("2024-2", { language: "ingles", format: "pdf", scope: "dia" });
    state().answerExam(0, "A");
    const result = state().finishExam();
    if ("error" in result) throw new Error(result.error);
    expect(state().addExamMistakes(result.examId, result.graded.wrong)).toBe(89);
    expect(state().mistakes[0]).toMatchObject({
      areaId: "nat",
      topicId: null,
      source: "Enem 2024, questão 91",
      question: "Questão 91: você marcou A, a resposta é B. Refaça e descubra onde errou.",
      due: "2026-10-17",
    });
  });

  it("does the 2023 exam inside the app, one area only, and saves the stem with each mistake", () => {
    expect(state().startExam("2024-1", { language: "ingles", format: "app", scope: "dia" })).toBe(
      "Esta prova ainda não está no app. Use o PDF.",
    );
    expect(state().startExam("2023-2", { language: "ingles", format: "app", scope: "mat" })).toBeNull();
    expect(state().examDraft).toMatchObject({ format: "app", scope: "mat", current: 45 });
    state().goToQuestion(46);
    state().toggleExamFlag(46);
    state().answerExam(46, "B");
    expect(state().examDraft).toMatchObject({ current: 46, flagged: [46] });

    const result = state().finishExam();
    if ("error" in result) throw new Error(result.error);
    expect(result.graded.sections).toEqual([{ areaId: "mat", correct: 0, total: 44, score: expect.any(Number) }]);
    expect(state().addExamMistakes(result.examId, result.graded.wrong.slice(1, 2), { 137: "A média dos salários é" })).toBe(1);
    expect(state().mistakes[0]).toMatchObject({
      question: "Questão 137: A média dos salários é",
      lesson: "Você marcou B; a resposta certa é C.",
      source: "Enem 2023, questão 137",
    });
  });

  it("discards a draft without recording", () => {
    state().startExam("2023-1", { language: "espanhol", format: "pdf", scope: "dia" });
    state().discardExam();
    expect(state().examDraft).toBeNull();
    expect(state().mockExams).toEqual([]);
  });
});

describe("question blocks", () => {
  const exam = findOfficialExam("2023-2")!;
  const pool = poolFromExam(
    exam,
    [136, 137, 138].map((number) => ({
      number,
      areaId: "mat" as const,
      language: null,
      text: "Uma porcentagem.",
      stem: `Comando ${number}`,
      alternatives: (["A", "B", "C", "D", "E"] as const).map((letter) => ({ letter, text: letter, image: null })),
    })),
    "ingles",
  );

  it("opens one block at a time, grades it and sends the mistakes to the notebook", () => {
    expect(state().startBlock({ areaId: "mat", theme: "", language: "ingles", picked: [] })).toMatch(/Nenhuma questão/);
    expect(state().startBlock({ areaId: "mat", theme: "porcentagem", language: "ingles", picked: pool })).toBeNull();
    expect(state().startBlock({ areaId: "mat", theme: "", language: "ingles", picked: pool })).toBe("Termine ou descarte o bloco aberto.");
    const [first, second] = state().questionBlocks[0].items;
    state().answerBlockQuestion(0, first.correct);
    state().answerBlockQuestion(1, second.correct === "A" ? "B" : "A");
    state().goToBlockQuestion(2);
    expect(state().questionBlocks[0]).toMatchObject({ current: 2, date: today, theme: "porcentagem" });
    const finished = state().finishBlock();
    expect(finished?.finished).toBe(true);
    expect(state().finishBlock()).toBeNull();
    expect(state().addBlockMistakes(finished!.id, { [`2023-2:${second.number}`]: `Comando ${second.number}` })).toBe(2);
    expect(state().mistakes[0]).toMatchObject({ areaId: "mat", source: `Enem 2023, questão ${second.number}` });
    expect(state().mistakes[0].question).toContain(`Comando ${second.number}`);
  });

  it("discards only the open block", () => {
    state().startBlock({ areaId: "mat", theme: "", language: "ingles", picked: pool });
    state().finishBlock();
    state().startBlock({ areaId: "mat", theme: "", language: "ingles", picked: pool });
    state().discardBlock();
    expect(state().questionBlocks).toHaveLength(1);
    expect(state().questionBlocks[0].finished).toBe(true);
  });
});

describe("flashcards", () => {
  const input = { front: "Mitose", back: "Gera duas células iguais", areaId: "nat" as const, subjectId: "bio" as const, topicId: null };

  it("creates, reviews, edits and removes a card", () => {
    expect(state().addCard({ ...input, back: " " })).toBe("Escreva a resposta do verso.");
    expect(state().addCard(input)).toBeNull();
    const card = state().flashcards[0];
    expect(card).toMatchObject({ due: today, reps: 0 });
    state().answerCard(card.id, "bom");
    expect(state().flashcards[0]).toMatchObject({ due: "2026-10-17", reps: 1 });
    expect(state().updateCard(card.id, { ...input, front: "Mitose e meiose" })).toBeNull();
    expect(state().flashcards[0]).toMatchObject({ front: "Mitose e meiose", due: "2026-10-17" });
    state().removeCard(card.id);
    expect(state().flashcards).toEqual([]);
  });

  it("imports cards without repeating the ones that already exist", () => {
    state().addCard(input);
    const subject = { areaId: "nat" as const, subjectId: "bio" as const, topicId: null };
    const cards = [
      { front: "Mitose", back: "Gera duas células iguais" },
      { front: "Meiose", back: "Gera quatro células" },
      { front: "Meiose", back: "Gera quatro células" },
    ];
    expect(state().importCards(cards, subject)).toBe(1);
    expect(state().flashcards.map((card) => card.front)).toEqual(["Mitose", "Meiose"]);
    expect(state().flashcards[1]).toMatchObject({ due: today, subjectId: "bio" });
  });
});

describe("free plan", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRO_TRIAL", "");
    usePro.setState({ record: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the timer on the stopwatch: Pomodoro is Pro", () => {
    state().setTimerMode("pomodoro");
    state().setTimerTopic("mat-1");
    expect(state().startTimer()).toBe(true);
    expect(state().timer).toMatchObject({ mode: "cronometro", running: true });
  });

  it("concludes a topic without scheduling reviews", () => {
    const updated = state().setStatus("mat-1", "concluido");
    expect(updated).toMatchObject({ status: "concluido", completedAt: today, reviews: [] });
  });

  it("schedules a review on the date the student picks and moves it when picked again", () => {
    expect(state().scheduleReview("mat-1", "2026-10-15")).toBe("Escolha hoje ou uma data futura.");
    expect(state().scheduleReview("nada", "2026-10-20")).toBe("Escolha o tópico.");
    expect(state().scheduleReview("mat-1", "2026-10-20")).toBeNull();
    expect(state().scheduleReview("mat-1", "2026-10-22")).toBeNull();
    expect(state().progress["mat-1"].reviews).toEqual([
      { stage: 1, due: "2026-10-22", manual: true, reschedules: [{ from: "2026-10-20", to: "2026-10-22", at: today }] },
    ]);
  });

  it("does not start the official mock exam", () => {
    expect(state().startExam("2024-1", { language: "ingles", format: "pdf", scope: "dia" })).toBe("O simulado no app faz parte do Pro.");
  });

  it("finishes onboarding without generating the plan", () => {
    const settings = { ...state().planner, studyDays: [true, true, true, true, true, false, false] };
    expect(state().finishOnboarding(settings, "sugerido")).toBeNull();
    expect(state().tasks).toEqual([]);
  });
});
