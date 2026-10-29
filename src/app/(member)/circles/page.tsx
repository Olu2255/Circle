import Link from "next/link";
import { ArrowUpRight, CirclePlus, UsersRound } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { CreateCircleForm, JoinCircleForm } from "@/components/forms";
import { requireProfile } from "@/lib/auth";
import type { Circle } from "@/lib/validation";

export default async function CirclesPage() {
  const { client, profile } = await requireProfile();
  const { data, error } = await client
    .from("circles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      "Your circles could not be loaded. Please retry; check database setup if this persists.",
    );
  const circles = data as Circle[];
  return (
    <>
      <PageHeading
        eyebrow={`YOUR SPACE, ${profile.display_name}`}
        title="Good company changes things."
      >
        Your circles bring together people with ambitions, experience, and time
        to share.
      </PageHeading>
      {circles.length ? (
        <section className="circle-grid" aria-label="Your circles">
          {circles.map((circle) => (
            <Link
              className="card circle-card"
              href={`/circles/${circle.id}`}
              key={circle.id}
            >
              <div className="circle-card-top">
                <div className="round-icon">
                  <UsersRound size={23} />
                </div>
                <ArrowUpRight size={22} />
              </div>
              <span className="eyebrow">
                {circle.owner_id === profile.user_id
                  ? "CREATED BY YOU"
                  : "YOUR CIRCLE"}
              </span>
              <h2>{circle.name}</h2>
              <p>{circle.description}</p>
              <span className="circle-card-link">
                Meet your circle <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="empty-circle">
          <div className="empty-circle-art" aria-hidden="true">
            <span />
            <span />
            <UsersRound size={30} strokeWidth={1.5} />
          </div>
          <div>
            <span className="eyebrow">THERE’S ROOM FOR YOUR PEOPLE</span>
            <h2>Your first circle is waiting to happen.</h2>
            <p>
              Create a space for people you know, or ask someone for an
              invitation. A circle has room for up to six people.
            </p>
          </div>
        </section>
      )}
      <div className="two-column">
        <section className="card form-section">
          <div className="section-heading">
            <CirclePlus size={21} />
            <h2>Start a circle</h2>
          </div>
          <p className="section-description">
            Bring a few people together around a shared direction.
          </p>
          <CreateCircleForm />
        </section>
        <section className="card form-section">
          <div className="section-heading">
            <UsersRound size={21} />
            <h2>Have an invitation?</h2>
          </div>
          <p className="section-description">
            Join people who are ready to make room for you.
          </p>
          <JoinCircleForm />
        </section>
      </div>
    </>
  );
}
