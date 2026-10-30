import { describe, expect, it } from "vitest";
import { googleOAuthOptions } from "@/lib/auth-options";

describe("Google sign-in configuration", () => {
  it.each([
    "http://localhost:3000",
    "https://circle-git-foundation.example.com",
    "https://circle.example.com",
  ])("uses the environment callback on %s", (origin) => {
    const options = googleOAuthOptions(origin);
    expect(options.provider).toBe("google");
    expect(options.options.redirectTo).toBe(`${origin}/auth/callback`);
    expect(options.options.scopes.split(" ")).toEqual([
      "openid",
      "email",
      "profile",
    ]);
    expect(options.options.queryParams).toEqual({ prompt: "select_account" });
  });
  it("rejects nonlocal HTTP origins before starting OAuth", () => {
    expect(() => googleOAuthOptions("http://circle.example.com")).toThrow();
  });
});
