import { afterEach, describe, expect, it, vi } from "vitest";
import { contactEmail, currentEntitlement, hasProAccess, interestListUrl, isProActive, type ProRecord } from "./plan";

afterEach(() => {
  vi.unstubAllEnvs();
});

const now = new Date("2026-10-18T12:00:00Z");
const record = (proUntil: string, status: ProRecord["status"] = "ativa"): ProRecord => ({ plan: "mensal", status, proUntil });

describe("plan access", () => {
  it("keeps everyone on the free plan without a confirmed subscription", () => {
    vi.stubEnv("NEXT_PUBLIC_PRO_TRIAL", "");
    expect(currentEntitlement(null, now)).toEqual({ tier: "gratuito", source: "provedor" });
    expect(hasProAccess(currentEntitlement(null, now))).toBe(false);
  });

  it("opens Pro to everyone while the trial is on", () => {
    vi.stubEnv("NEXT_PUBLIC_PRO_TRIAL", "true");
    expect(hasProAccess(currentEntitlement(null, now))).toBe(true);
  });

  it("gives Pro until the paid period ends, even after cancelling", () => {
    vi.stubEnv("NEXT_PUBLIC_PRO_TRIAL", "");
    expect(isProActive(record("2026-11-01T00:00:00Z"), now)).toBe(true);
    expect(isProActive(record("2026-11-01T00:00:00Z", "cancelada"), now)).toBe(true);
    expect(isProActive(record("2026-10-17T00:00:00Z"), now)).toBe(false);
    expect(currentEntitlement(record("2026-11-01T00:00:00Z"), now)).toEqual({ tier: "pro", source: "provedor" });
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
