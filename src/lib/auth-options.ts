import { callbackUrl } from "./redirects";

// Only the sign-in entry point depends on the provider. Sessions, profiles and
// database permissions use Supabase user IDs, including future password accounts.
export function googleOAuthOptions(origin: string) {
  return {
    provider: "google" as const,
    options: {
      redirectTo: callbackUrl(origin),
      scopes: "openid email profile",
      queryParams: { prompt: "select_account" },
    },
  };
}
