import Link from "next/link";
import { ArrowUpRight, Circle as CircleIcon } from "lucide-react";
import { signOut } from "@/app/actions";
import { Navigation } from "./navigation";
import { SignOutButton } from "./submit-button";
export { Notice } from "./ui-notice";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "text-white" : ""}`}
      aria-label="Circle home"
    >
      <span className="brand-mark">
        <CircleIcon size={21} strokeWidth={3} />
      </span>
      circle<span className="brand-dot">.</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand light />
        <div className="sidebar-intro">
          <span className="eyebrow text-sage">
            A LITTLE SUPPORT. REAL PROGRESS.
          </span>
          <p>
            Go further,
            <br />
            together.
          </p>
        </div>
        <Navigation />
        <div className="sidebar-bottom">
          <p>
            A small circle.
            <br />
            Space for your ambitions.
          </p>
          <form action={signOut}>
            <SignOutButton />
          </form>
          <span className="sidebar-caption">BUILT FOR THE NEXT CHAPTER</span>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>Your next chapter starts with people.</span>
          <span className="private-tag">
            <span /> Invitation-only circles
          </span>
        </header>
        <main id="main-content" className="content">
          {children}
        </main>
        <footer className="app-footer">
          Small steps count. So does showing up for one another.
        </footer>
      </div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <header>
        <Brand />
        <Link className="text-link" href="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="main-content">{children}</main>
      <footer>Circle · Make room for meaningful progress.</footer>
    </div>
  );
}
