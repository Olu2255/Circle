"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile, requireUser } from "@/lib/auth";
import { requireConfig } from "@/lib/config";
import { authNextCookie, callbackUrl, safeNext } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/server";
import {
  circleSchema,
  invitationSchema,
  profileSchema,
  uuidSchema,
} from "@/lib/validation";

export type ActionState = {
  error?: string;
  success?: string;
  code?: string;
  link?: string;
  expiresAt?: string;
};

async function checkOrigin() {
  const origin = (await headers()).get("origin");
  if (origin !== requireConfig().origin)
    throw new Error("Open Circle at its configured address and try again.");
}
const value = (form: FormData, key: string) => String(form.get(key) ?? "");
const knownErrors = new Set([
  "Invitation is invalid, expired or revoked.",
  "This circle is full (six members).",
  "Only the circle creator can manage invitations.",
  "Complete your profile first.",
]);
function dbMessage(message: string, fallback: string) {
  return knownErrors.has(message) ? message : fallback;
}

export async function signIn(form: FormData) {
  await checkOrigin();
  const config = requireConfig();
  const client = await createClient();
  const next = safeNext(value(form, "next"));
  (await cookies()).set(authNextCookie, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.origin.startsWith("https://"),
    path: "/auth/callback",
    maxAge: 600,
  });
  const { data, error } = await client.auth.signInWithOAuth({
    provider: config.provider,
    options: { redirectTo: callbackUrl(config.origin) },
  });
  if (error || !data.url)
    redirect(`/login?error=provider&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOut() {
  await checkOrigin();
  const client = await createClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Sign-out failed. Please try again.");
  revalidatePath("/", "layout");
  redirect("/login?signedOut=1");
}

export async function saveProfile(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const { client, userId } = await requireUser("/profile");
  let availability: unknown;
  try {
    availability = JSON.parse(value(form, "availability"));
  } catch {
    return { error: "Add valid availability windows." };
  }
  const parsed = profileSchema.safeParse({
    display_name: value(form, "display_name"),
    goal: value(form, "goal"),
    experience: value(form, "experience"),
    skills: value(form, "skills"),
    timezone: value(form, "timezone"),
    availability,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data: existing, error: readError } = await client
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError)
    return {
      error:
        "Could not load your profile. Check the database migration and retry.",
    };
  const { error } = existing
    ? await client.from("profiles").update(parsed.data).eq("user_id", userId)
    : await client.from("profiles").insert({ ...parsed.data, user_id: userId });
  if (error)
    return {
      error:
        "Your profile could not be saved. Check your inputs and database setup, then retry.",
    };
  revalidatePath("/", "layout");
  const next = safeNext(value(form, "next"), "/profile");
  if (next !== "/profile") redirect(next);
  return {
    success: "Profile saved. Your circle members will see these details.",
  };
}

export async function createCircle(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const { client } = await requireProfile();
  const parsed = circleSchema.safeParse({
    name: value(form, "name"),
    description: value(form, "description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = await client.rpc("create_circle", {
    circle_name: parsed.data.name,
    circle_description: parsed.data.description,
  });
  if (error || !uuidSchema.safeParse(data).success)
    return {
      error:
        "Your circle could not be created. Please try again; check database setup if this persists.",
    };
  revalidatePath("/circles");
  redirect(`/circles/${data}`);
}

export async function joinCircle(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const parsed = invitationSchema.safeParse(value(form, "code"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { client } = await requireProfile(`/join/${parsed.data}`);
  const { data, error } = await client.rpc("redeem_invitation", {
    invitation_code: parsed.data,
  });
  if (error)
    return {
      error: dbMessage(
        error.message,
        "The invitation could not be redeemed. Please retry; check database setup if this persists.",
      ),
    };
  if (!uuidSchema.safeParse(data).success)
    return {
      error:
        "The server returned an unexpected response. Refresh and try again.",
    };
  revalidatePath("/circles");
  redirect(`/circles/${data}`);
}

async function generateInvitation(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const { client, userId } = await requireProfile();
  const id = uuidSchema.safeParse(value(form, "circle_id"));
  if (!id.success) return { error: "Choose a valid circle." };
  const { data: circle } = await client
    .from("circles")
    .select("owner_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!circle || circle.owner_id !== userId)
    return { error: "Only the circle creator can manage invitations." };
  const { data, error } = await client.rpc("create_invitation", {
    target_circle: id.data,
  });
  if (error)
    return {
      error: dbMessage(
        error.message,
        "Could not create an invitation. Please try again.",
      ),
    };
  const invitation = data?.[0];
  if (!invitation || !invitationSchema.safeParse(invitation.code).success)
    return {
      error: "Could not read the invitation. Try generating a new one.",
    };
  return {
    code: invitation.code,
    link: `${requireConfig().origin}/join/${invitation.code}`,
    expiresAt: invitation.expires_at,
  };
}

async function revokeInvitations(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const { client, userId } = await requireProfile();
  const id = uuidSchema.safeParse(value(form, "circle_id"));
  if (!id.success) return { error: "Choose a valid circle." };
  const { data: circle } = await client
    .from("circles")
    .select("owner_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!circle || circle.owner_id !== userId)
    return { error: "Only the circle creator can manage invitations." };
  const { error } = await client.rpc("revoke_invitations", {
    target_circle: id.data,
  });
  if (error)
    return { error: "Could not revoke invitations. Please try again." };
  return {
    success: "All existing invitation links for this circle are now revoked.",
  };
}

export async function manageInvitations(
  state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const intent = value(form, "intent");
  if (intent === "create") return generateInvitation(state, form);
  if (intent === "revoke") return revokeInvitations(state, form);
  return { error: "Choose an invitation action." };
}
