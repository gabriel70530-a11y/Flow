import { describe, expect, it } from "vitest";
import { isTime, nextReminder, normalizeReminder, reminderText } from "./reminders";

// Segunda a sexta.
const weekdays = [true, true, true, true, true, false, false];

describe("reminder settings", () => {
  it("aceita só HH:MM válido", () => {
    expect(isTime("19:30")).toBe(true);
    expect(isTime("24:00")).toBe(false);
    expect(isTime("7:30")).toBe(false);
    expect(normalizeReminder({ time: "08:05" })).toEqual({ time: "08:05" });
    expect(normalizeReminder({ time: "8h" })).toEqual({ time: null });
    expect(normalizeReminder(null)).toEqual({ time: null });
  });
});

describe("nextReminder", () => {
  // 19/10/2026 é uma segunda-feira.
  const monday = (hours: number, minutes = 0) => new Date(2026, 9, 19, hours, minutes);

  it("avisa 1 hora antes, 30 minutos antes e na hora", () => {
    const settings = { time: "19:00" };
    expect(nextReminder(monday(12), settings, weekdays)).toMatchObject({ at: monday(18), offset: 60, tag: "flow-lembrete-2026-10-19-60" });
    expect(nextReminder(monday(18), settings, weekdays)).toMatchObject({ at: monday(18, 30), offset: 30 });
    expect(nextReminder(monday(18, 45), settings, weekdays)).toMatchObject({ at: monday(19), offset: 0 });
  });

  it("pula para o próximo dia de estudo", () => {
    const friday = new Date(2026, 9, 23, 20, 0);
    const next = nextReminder(friday, { time: "19:00" }, weekdays);
    expect(next?.at).toEqual(new Date(2026, 9, 26, 18, 0));
  });

  it("um horário logo depois da meia-noite avisa ainda no dia anterior", () => {
    const next = nextReminder(monday(22), { time: "00:30" }, [true, true, true, true, true, true, true]);
    expect(next?.at).toEqual(new Date(2026, 9, 19, 23, 30));
    expect(next?.tag).toBe("flow-lembrete-2026-10-20-60");
  });

  it("sem horário ou sem dias de estudo, não avisa", () => {
    expect(nextReminder(monday(12), { time: null }, weekdays)).toBeNull();
    expect(nextReminder(monday(12), { time: "19:00" }, [false, false, false, false, false, false, false])).toBeNull();
  });
});

describe("reminderText", () => {
  it("diz quanto falta, sem cobrança", () => {
    expect(reminderText(60, "19:00").body).toContain("19:00");
    expect(reminderText(0, "19:00").title).toBe("Hora de estudar");
  });
});
