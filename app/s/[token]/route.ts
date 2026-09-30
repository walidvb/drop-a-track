import { NextResponse, type NextRequest } from "next/server";
import { getScanTarget } from "@/lib/bags";
import { bagPath } from "@/lib/handle";
import { issueTicket, ticketCookieName, TICKET_TTL_SECONDS } from "@/lib/ticket";
import { parseToken } from "@/lib/token";
import { UID_COOKIE, UID_MAX_AGE, isUid, newUid } from "@/lib/uid";

/**
 * What a QR code points at. Hands out a scan ticket for the shirt's current
 * bag and redirects straight away, so the address bar never shows a URL that
 * lets someone else drop.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/s/[token]">) {
  const { token: raw } = await ctx.params;
  const token = parseToken(raw);
  const target = token ? await getScanTarget(token) : null;

  if (!target) return redirect(new URL("/", request.url));
  if (!target.handle || !target.bagId) return redirect(new URL(`/closed?n=${target.number}`, request.url));

  const res = redirect(new URL(bagPath(target.handle), request.url));
  const secure = request.nextUrl.protocol === "https:";
  res.cookies.set(ticketCookieName(target.bagId), await issueTicket(target.bagId), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: TICKET_TTL_SECONDS,
  });
  if (!isUid(request.cookies.get(UID_COOKIE)?.value)) {
    res.cookies.set(UID_COOKIE, newUid(), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: UID_MAX_AGE });
  }
  return res;
}

function redirect(url: URL) {
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
