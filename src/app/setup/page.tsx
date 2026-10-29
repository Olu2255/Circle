import Link from "next/link";
import { Settings2 } from "lucide-react";
import { PublicShell } from "@/components/ui";
import { readConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export default function Setup() {
  const { issues } = readConfig();
  return (
    <PublicShell>
      <section className="card setup-card">
        <div className="round-icon">
          <Settings2 size={24} />
        </div>
        <span className="eyebrow">A FEW THINGS TO CONNECT</span>
        <h1>Circle needs its setup.</h1>
        <p>
          Real sign-in and a connected database are required before you can use
          Circle.
        </p>
        {issues.length ? (
          <ul className="setup-list">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p>
            Application variables are set. Finish provider configuration and
            apply the database migration before testing.
          </p>
        )}
        <p className="field-help">
          Project owner: follow README.md and docs/TESTING.md in the repository.
          Configuration values are never displayed here.
        </p>
        <Link href="/login" className="button button-secondary">
          Check sign-in setup
        </Link>
      </section>
    </PublicShell>
  );
}
