import "server-only";
import { parseOrigin } from "./redirects";

export type AppConfig = {
  origin: string;
  supabaseUrl: string;
  publishableKey: string;
};

export function readConfig(): { config: AppConfig | null; issues: string[] } {
  const issues: string[] = [];
  let origin = "";
  try {
    origin = parseOrigin(process.env.APP_ORIGIN || "");
  } catch {
    issues.push(
      "Set APP_ORIGIN to this environment’s exact application origin.",
    );
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  try {
    const url = new URL(supabaseUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
  } catch {
    issues.push(
      "Set NEXT_PUBLIC_SUPABASE_URL to the project’s HTTPS API origin.",
    );
  }
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!publishableKey.startsWith("sb_publishable_"))
    issues.push(
      "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to a public publishable key (never a secret key).",
    );
  return {
    config: issues.length ? null : { origin, supabaseUrl, publishableKey },
    issues,
  };
}

export function requireConfig(): AppConfig {
  const { config } = readConfig();
  if (!config)
    throw new Error(
      "Circle setup is incomplete. See the setup screen and README.",
    );
  return config;
}
