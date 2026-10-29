"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Layers, UserRound } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation">
      <Link
        href="/circles"
        aria-current={
          pathname.startsWith("/circles") || pathname.startsWith("/join")
            ? "page"
            : undefined
        }
      >
        <Layers size={18} /> My circles{" "}
        <ArrowUpRight size={15} className="ml-auto" />
      </Link>
      <Link
        href="/profile"
        aria-current={pathname === "/profile" ? "page" : undefined}
      >
        <UserRound size={18} /> My profile
      </Link>
    </nav>
  );
}
