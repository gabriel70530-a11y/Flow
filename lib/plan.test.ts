import { afterEach, describe, expect, it, vi } from "vitest";
import { contactEmail, currentEntitlement, hasProAccess, interestListUrl } from "./plan";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("plan access", () => {
  it("never reports a confirmed Pro subscription without a payment provider", () => {
    expect(currentEntitlement()).toEqual({ tier: "gratuito", source: "teste" });
  });

  it("opens Pro features during the trial and to confirmed subscribers only", () => {
    expect(hasProAccess({ tier: "gratuito", source: "teste" })).toBe(true);
    expect(hasProAccess({ tier: "pro", source: "provedor" })).toBe(true);
    expect(hasProAccess({ tier: "gratuito", source: "provedor" })).toBe(false);
  });

  it("only exposes valid interest list and contact settings", () => {
    expect(interestListUrl()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_PRO_INTEREST_URL", "http://inseguro.example");
    expect(interestListUrl()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_PRO_INTEREST_URL", "https://forms.example/pro");
    expect(interestListUrl()).toBe("https://forms.example/pro");
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "não é email");
    expect(contactEmail()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "contato@example.com");
    expect(contactEmail()).toBe("contato@example.com");
  });
});
