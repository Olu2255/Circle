import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireConfig } from "@/lib/config";

export async function createClient() {
  const config = requireConfig();
  const cookieStore = await cookies();
  return createServerClient(config.supabaseUrl, config.publishableKey, {
    cookieOptions: {
      sameSite: "lax",
      secure: config.origin.startsWith("https://"),
      path: "/",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies; proxy refreshes before rendering. */
        }
      },
    },
  });
}
