import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="standalone-state">
      <span className="eyebrow">NOT AVAILABLE</span>
      <h1>This space isn’t available.</h1>
      <p>
        The page may not exist, or you may need a valid invitation and
        membership to access it.
      </p>
      <Link className="button" href="/circles">
        Go to your circles
      </Link>
    </main>
  );
}
