import type { Metadata } from "next";
import { PageHeading } from "@/components/ui";
import { ProfileForm } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { safeNext } from "@/lib/redirects";
import type { Profile } from "@/lib/validation";

export const metadata: Metadata = { title: "Your profile" };
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next, "/circles");
  const { client, userId } = await requireUser("/profile");
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error(
      "Your profile could not be loaded. Check database setup, then try again.",
    );
  return (
    <div className="profile-page">
      <PageHeading
        eyebrow="YOUR STARTING POINT"
        title={
          data ? "Make yourself known." : "Every connection starts with you."
        }
      >
        A goal to work towards. Experience to build on. Something to share.
      </PageHeading>
      <ProfileForm
        profile={data as Profile | null}
        next={data ? safeNext((await searchParams).next, "/profile") : next}
      />
    </div>
  );
}
