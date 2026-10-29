import "server-only";
import { redirect } from "next/navigation";
import { readConfig } from "./config";
import { createClient } from "./supabase/server";
import { safeNext } from "./redirects";
import type { Profile } from "./validation";

export async function requireUser(next = "/circles") {
  if (!readConfig().config) redirect("/setup");
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub)
    redirect(`/login?next=${encodeURIComponent(safeNext(next))}`);
  return { client, userId: data.claims.sub };
}

export async function requireProfile(next = "/circles") {
  const auth = await requireUser(next);
  const { data, error } = await auth.client
    .from("profiles")
    .select("*")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (error)
    throw new Error(
      "Your profile could not be loaded. Check database setup and try again.",
    );
  if (!data) redirect(`/profile?next=${encodeURIComponent(safeNext(next))}`);
  return { ...auth, profile: data as Profile };
}
