import { describe, expect, it } from "vitest";
import {
  callbackUrl,
  canonicalUrl,
  parseOrigin,
  safeNext,
} from "@/lib/redirects";

describe("safe navigation", () => {
  it.each(
    [
      "https://attacker.test",
      "//attacker.test",
      "/\\attacker.test",
      "/%5cattacker.test",
      "/%2fattacker.test",
      "/circles/../login",
      "/auth/callback",
      "/login",
      "/circles?next=https://attacker.test",
      "/circles\n",
      "%E0%A4%A",
      undefined,
      ["/profile"],
    ].map((value) => ({ value })),
  )("rejects unsafe next value $value", ({ value }) => {
    expect(safeNext(value)).toBe("/circles");
  });
  it("preserves only recognized app destinations", () => {
    expect(safeNext("/profile")).toBe("/profile");
    const join = `/join/${"a".repeat(64)}`;
    expect(safeNext(join)).toBe(join);
    expect(safeNext("/circles/123e4567-e89b-42d3-a456-426614174000")).toContain(
      "/circles/",
    );
  });
  it("uses the configured origin for callbacks, with no request host dependency", () => {
    expect(callbackUrl("https://circle.example")).toBe(
      "https://circle.example/auth/callback",
    );
  });
  it.each([
    "//attacker.test",
    "/\\attacker.test",
    "/profile",
    "/%2f%2fattacker.test",
  ])("keeps the configured host when canonicalizing %s", (path) => {
    expect(
      canonicalUrl("https://circle.example", path, "?next=//attacker.test")
        .origin,
    ).toBe("https://circle.example");
  });
});
describe("origin configuration", () => {
  it.each([
    "http://circle.example",
    "https://user:secret@circle.example",
    "https://circle.example/path",
    "https://circle.example?x=1",
    "https://circle.example#hash",
    "",
    "javascript:alert(1)",
  ])("rejects unsafe origin %s", (value) => {
    expect(() => parseOrigin(value)).toThrow();
  });
  it("accepts HTTPS and local HTTP origins", () => {
    expect(parseOrigin("https://circle.example/")).toBe(
      "https://circle.example",
    );
    expect(parseOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });
});
