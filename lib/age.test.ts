import { describe, expect, it } from "vitest";
import { isMinor, validateBirthYear } from "./age";

describe("birth year", () => {
  it("accepts four-digit years for people turning 13 or more this year", () => {
    expect(validateBirthYear("2008", 2026)).toBeNull();
    expect(validateBirthYear("2013", 2026)).toBeNull();
    expect(validateBirthYear("2014", 2026)).toBe("O Flow é para quem faz 13 anos ou mais neste ano.");
    expect(validateBirthYear("08", 2026)).toBe("Digite o ano com 4 números, como 2008.");
    expect(validateBirthYear("1900", 2026)).toBe("Digite o ano com 4 números, como 2008.");
  });

  it("treats people turning 18 this year as minors", () => {
    expect(isMinor(2008, 2026)).toBe(true);
    expect(isMinor(2007, 2026)).toBe(false);
  });
});
