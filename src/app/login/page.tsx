import { redirect } from "next/navigation";
import { ArrowUpRight, UsersRound } from "lucide-react";
import { PublicShell, Notice } from "@/components/ui";
import { SignInButton } from "@/components/submit-button";
import { signInWithGoogle } from "@/app/auth/actions";
import { readConfig } from "@/lib/config";
import { safeNext } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!readConfig().config) redirect("/setup");
  const params = await searchParams;
  const next = safeNext(params.next);
  const { data } = await (await createClient()).auth.getClaims();
  if (data?.claims?.sub) redirect(next);
  return (
    <PublicShell>
      <div className="auth-layout">
        <div className="auth-intro">
          <span className="eyebrow">A SHARED START</span>
          <h1>
            Big ambitions.
            <br />
            <em>Good company.</em>
          </h1>
          <p>You don’t have to figure out your next chapter alone.</p>
          <div className="auth-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <section className="card auth-card">
          <div className="round-icon">
            <UsersRound size={24} />
          </div>
          <h2>Welcome to Circle</h2>
          <p>Sign in to create your profile and connect with your people.</p>
          <Notice
            error={
              params.error
                ? params.error === "callback"
                  ? "Sign-in could not be completed. Try again in the same browser at Circle’s configured address. If it persists, check the provider and callback settings."
                  : "The sign-in provider could not be reached. Check provider setup and try again."
                : undefined
            }
            success={
              params.signedOut === "1"
                ? "You’re signed out of this browser."
                : undefined
            }
          />
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <SignInButton />
          </form>
          <p className="auth-disclosure">
            Your profile is shared with your circle members. Your email and
            sign-in details are never shown to them.
          </p>
          <span className="auth-card-footer">
            A real account. Your own starting point. <ArrowUpRight size={15} />
          </span>
        </section>
      </div>
    </PublicShell>
  );
}
