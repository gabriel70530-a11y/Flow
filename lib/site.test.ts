import { afterEach, describe, expect, it, vi } from "vitest";
import { androidCertFingerprints, appOpen, isAppRoute, siteUrl } from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  it("prefers the configured address, then the Vercel production address, then localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(siteUrl().href).toBe("http://localhost:3000/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "flow-black.vercel.app");
    expect(siteUrl().href).toBe("https://flow-black.vercel.app/");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://flowestudos.com.br");
    expect(siteUrl().href).toBe("https://flowestudos.com.br/");
  });

  it("ignores invalid values", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "flowestudos");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "bad host/");
    expect(siteUrl().href).toBe("http://localhost:3000/");
  });
});

describe("appOpen", () => {
  it("closes the app only in Vercel production, unless APP_OPEN is true", () => {
    vi.stubEnv("APP_OPEN", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(appOpen()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(appOpen()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(appOpen()).toBe(false);
    vi.stubEnv("APP_OPEN", "true");
    expect(appOpen()).toBe(true);
  });
});

describe("isAppRoute", () => {
  it("matches app screens and their subpaths, not the site pages", () => {
    expect(isAppRoute("/painel")).toBe(true);
    expect(isAppRoute("/revisoes/erros")).toBe(true);
    expect(isAppRoute("/revisoes/cartoes")).toBe(true);
    expect(["/questoes", "/tabuada", "/conquistas"].every(isAppRoute)).toBe(true);
    expect(isAppRoute("/")).toBe(false);
    expect(isAppRoute("/privacidade")).toBe(false);
    expect(isAppRoute("/painelzinho")).toBe(false);
  });
});

describe("androidCertFingerprints", () => {
  it("keeps only valid SHA-256 fingerprints, in upper case", () => {
    vi.stubEnv("ANDROID_CERT_FINGERPRINTS", "");
    expect(androidCertFingerprints()).toEqual([]);
    vi.stubEnv("ANDROID_CERT_FINGERPRINTS", " ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:ab:cd , 12:34, AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:CD");
    expect(androidCertFingerprints()).toEqual(["AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:CD", "AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:AB:CD"]);
  });
});
