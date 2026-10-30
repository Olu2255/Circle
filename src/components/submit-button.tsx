"use client";
import { useFormStatus } from "react-dom";
import { ArrowRight, LogOut } from "lucide-react";

export function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button w-full" disabled={pending}>
      {pending ? "Connecting…" : "Continue with Google"}
      <ArrowRight size={18} />
    </button>
  );
}

export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button className="signout" disabled={pending}>
      <LogOut size={16} />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
