import { notFound } from "next/navigation";
import { JoinCircleForm } from "@/components/forms";
import { AppShell, PageHeading } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { invitationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!invitationSchema.safeParse(code).success) notFound();
  await requireProfile(`/join/${code}`);
  // GET never redeems a link: the member must explicitly agree to join.
  return (
    <AppShell>
      <div className="join-page">
        <PageHeading
          eyebrow="YOU’VE BEEN INVITED"
          title="A new connection starts here."
        >
          Use your invitation to join a circle. Your profile will be visible to
          its members when you join.
        </PageHeading>
        <section className="card form-section">
          <h2>Ready to join?</h2>
          <p className="section-description">
            The invitation will be checked when you continue. An expired or
            revoked link cannot grant access.
          </p>
          <JoinCircleForm code={code} />
        </section>
      </div>
    </AppShell>
  );
}
