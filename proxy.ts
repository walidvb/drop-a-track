import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorization } from "@/lib/admin-auth";

/** HTTP Basic Auth in front of /admin (credentials from env). */
export function proxy(request: NextRequest) {
  if (isAdminAuthorization(request.headers.get("authorization"))) return NextResponse.next();
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="drop-a-track admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
