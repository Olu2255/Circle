import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Globe2, HandHeart, Target } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { InvitationForm } from "@/components/forms";
import { requireProfile } from "@/lib/auth";
import { days, uuidSchema, type Circle, type Profile } from "@/lib/validation";

export default async function CirclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { client, userId } = await requireProfile(`/circles/${id}`);
  const { data: member, error: memberError } = await client
    .from("memberships")
    .select("user_id")
    .eq("circle_id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError)
    throw new Error("Circle membership could not be checked. Please retry.");
  if (!member) notFound();
  const { data: circleData, error: circleError } = await client
    .from("circles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (circleError) throw new Error("The circle could not be loaded.");
  if (!circleData) notFound();
  const circle = circleData as Circle;
  const { data: memberships, error } = await client
    .from("memberships")
    .select("user_id,joined_at")
    .eq("circle_id", id)
    .order("joined_at");
  if (error) throw new Error("The circle’s members could not be loaded.");
  const { data: profileData, error: profileError } = await client
    .from("profiles")
    .select(
      "user_id,display_name,goal,experience,skills,timezone,availability,updated_at",
    )
    .in(
      "user_id",
      memberships!.map((m) => m.user_id),
    );
  if (profileError) throw new Error("Member profiles could not be loaded.");
  const profiles = memberships!
    .map((member) =>
      (profileData as Profile[]).find(
        (profile) => profile.user_id === member.user_id,
      ),
    )
    .filter((p): p is Profile => Boolean(p));
  return (
    <>
      <Link className="back-link" href="/circles">
        <ArrowLeft size={16} /> All your circles
      </Link>
      <PageHeading
        eyebrow="A SMALL CIRCLE. A SHARED DIRECTION."
        title={circle.name}
      >
        {circle.description}
      </PageHeading>
      <div className="members-heading">
        <h2>The people in your corner</h2>
        <span>{memberships!.length} of 6 members</span>
      </div>
      <section className="member-grid" aria-label="Circle members">
        {profiles.map((person, index) => (
          <article className="card member-card" key={person.user_id}>
            <header>
              <div className={`avatar avatar-${index % 3}`}>
                {person.display_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3>{person.display_name}</h3>
                <span>
                  {person.user_id === userId ? "You" : "Circle member"}
                  {person.user_id === circle.owner_id ? " · Creator" : ""}
                </span>
              </div>
            </header>
            <div className="member-detail">
              <Target size={17} />
              <div>
                <span className="detail-label">WORKING TOWARDS</span>
                <p>{person.goal}</p>
              </div>
            </div>
            <div className="member-detail">
              <HandHeart size={17} />
              <div>
                <span className="detail-label">CAN HELP WITH</span>
                <p>{person.skills}</p>
              </div>
            </div>
            <div className="member-experience">
              <span className="detail-label">STARTING POINT</span>
              <p>{person.experience}</p>
            </div>
            <div className="member-availability">
              <span>
                <Globe2 size={14} /> {person.timezone}
              </span>
              <div>
                <Clock3 size={14} />
                <ul>
                  {person.availability.map((window, i) => (
                    <li key={i}>
                      {days[window.day]} {window.start}–{window.end}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>
      {memberships!.length === 1 && (
        <div className="support-note">
          <HandHeart size={21} />
          <p>
            You’ve made the first move. Invite someone who’d appreciate a little
            company on their next chapter.
          </p>
        </div>
      )}
      {circle.owner_id === userId && (
        <section className="card form-section invite-section">
          <div>
            <span className="eyebrow">MAKE ROOM FOR SOMEONE</span>
            <h2>Good company starts with an invitation.</h2>
            <p className="section-description">
              Share a private link with someone you’d like in your circle.
            </p>
          </div>
          <InvitationForm circleId={id} />
        </section>
      )}
    </>
  );
}
