import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readConfig } from "@/lib/config";
import { canonicalUrl } from "@/lib/redirects";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { config } = readConfig();
  if (config) {
    // One canonical origin per environment keeps PKCE cookies on the callback host.
    // Request headers never determine a redirect destination.
    if (request.headers.get("host") !== new URL(config.origin).host) {
      const canonical = canonicalUrl(
        config.origin,
        request.nextUrl.pathname,
        request.nextUrl.search,
      );
      const result = ["GET", "HEAD"].includes(request.method)
        ? NextResponse.redirect(canonical)
        : new NextResponse(
            "Open Circle at its configured address and try again.",
            { status: 403 },
          );
      result.headers.set("Cache-Control", "private, no-store");
      return result;
    }
    const client = createServerClient(
      config.supabaseUrl,
      config.publishableKey,
      {
        cookieOptions: {
          sameSite: "lax",
          secure: config.origin.startsWith("https://"),
          path: "/",
        },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(values, cacheHeaders) {
            values.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            values.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
            Object.entries(cacheHeaders).forEach(([key, value]) =>
              response.headers.set(key, value),
            );
          },
        },
      },
    );
    // Verify, never trust getSession(). Protected pages/actions independently verify too.
    try {
      await client.auth.getClaims();
    } catch {
      return new NextResponse(
        "Circle could not reach sign-in. Please retry. The project owner should check Supabase connectivity and configuration.",
        {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "private, no-store",
          },
        },
      );
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
