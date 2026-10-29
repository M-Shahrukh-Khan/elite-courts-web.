import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_PORTAL_PATH,
  isAdminPortalPath,
} from "@/lib/admin/portal-path";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPortal = isAdminPortalPath(pathname);
  const isAdminApi = pathname.startsWith("/api/admin/");

  // The implementation stays under /admin internally, but direct requests to
  // that conventional address reveal nothing about the protected portal.
  if (pathname === "/admin" || pathname.startsWith("/admin/"))
    return new NextResponse("Not found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" },
    });

  if (!isPortal && !isAdminApi) return NextResponse.next({ request });

  const responseForRequest = () => {
    if (!isPortal) return NextResponse.next({ request });
    const destination = request.nextUrl.clone();
    const suffix = pathname.slice(ADMIN_PORTAL_PATH.length);
    destination.pathname = `/admin${suffix}`;
    const rewritten = NextResponse.rewrite(destination, { request });
    rewritten.headers.set("Cache-Control", "private, no-store, max-age=0");
    rewritten.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return rewritten;
  };

  let response = responseForRequest();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = responseForRequest();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ["/:path*"] };
