import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readConfig } from "@/lib/config";
import { authNextCookie, safeNext } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { config } = readConfig();
  if (!config)
    return new NextResponse(
      "Circle setup is incomplete. Open /setup for details.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-store",
        },
      },
    );
  const { origin } = config;
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const next = safeNext(cookieStore.get(authNextCookie)?.value);
  cookieStore.set(authNextCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/auth/callback",
    maxAge: 0,
  });
  const code = url.searchParams.get("code");
  if (code && !url.searchParams.has("error")) {
    const client = await createClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  const failure = new URL("/login?error=callback", origin);
  failure.searchParams.set("next", next);
  return NextResponse.redirect(failure);
}
