import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "./site";

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
