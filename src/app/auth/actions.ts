"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { googleOAuthOptions } from "@/lib/auth-options";
import { checkOrigin } from "@/lib/action-origin";
import { requireConfig } from "@/lib/config";
import { authNextCookie, safeNext } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(form: FormData) {
  await checkOrigin();
  const config = requireConfig();
  const client = await createClient();
  const next = safeNext(form.get("next"));
  (await cookies()).set(authNextCookie, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.origin.startsWith("https://"),
    path: "/auth/callback",
    maxAge: 600,
  });
  const { data, error } = await client.auth.signInWithOAuth(
    googleOAuthOptions(config.origin),
  );
  if (error || !data.url)
    redirect(`/login?error=provider&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

// Shared by all Supabase authentication methods; never depends on Google tokens.
export async function signOut() {
  await checkOrigin();
  const client = await createClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Sign-out failed. Please try again.");
  revalidatePath("/", "layout");
  redirect("/login?signedOut=1");
}
