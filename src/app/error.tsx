"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="standalone-state">
      <span className="eyebrow">LET’S TRY THAT AGAIN</span>
      <h1>Circle couldn’t load this.</h1>
      <p>
        Check your connection and try again. If the problem continues, the
        project owner should check Supabase configuration, provider settings and
        migrations.
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-secondary" href="/setup">
          Check setup
        </Link>
      </div>
    </main>
  );
}
