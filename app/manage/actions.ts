"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseHandle } from "@/lib/handle";
import { getOwner, getShirtByNumber, parseShirtNumber, renameShirt, setOwnerPassword } from "@/lib/owner";
import {
  OWNER_COOKIE,
  OWNER_SESSION_SECONDS,
  PASSWORD_MAX,
  PASSWORD_MIN,
  hashPassword,
  issueOwnerSession,
  verifyPassword,
} from "@/lib/owner-auth";
import { claim } from "@/lib/throttle";
import { ticketCookieName, verifyTicket } from "@/lib/ticket";
import type { ManageError } from "./ui";

const fail = (to: string, error: ManageError): never => redirect(`${to}${to.includes("?") ? "&" : "?"}error=${error}`);

async function startSession(qrCodeId: number, passwordHash: string) {
  (await cookies()).set(OWNER_COOKIE, await issueOwnerSession(qrCodeId, passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/manage",
    maxAge: OWNER_SESSION_SECONDS,
  });
}

/** The first scan: whoever holds a fresh scan ticket for an unclaimed shirt sets its password. */
export async function setPasswordAction(formData: FormData) {
  const number = parseShirtNumber(String(formData.get("number") ?? ""));
  const password = String(formData.get("password") ?? "");
  const shirt = number ? await getShirtByNumber(number) : null;
  if (!shirt?.handle || !shirt.bagId) return redirect("/");
  const here = `/manage/setup?n=${shirt.number}`;
  if (shirt.passwordHash) return redirect(`/manage?n=${shirt.number}`);
  const ticket = (await cookies()).get(ticketCookieName(shirt.bagId))?.value;
  if (!(await verifyTicket(ticket, shirt.bagId))) return fail(here, "scan");
  if (password.length < PASSWORD_MIN) return fail(here, "short");
  if (password.length > PASSWORD_MAX) return fail(here, "long");
  if (password !== formData.get("again")) return fail(here, "mismatch");

  const passwordHash = await hashPassword(password);
  // Someone set one in the meantime: theirs stands.
  if (!(await setOwnerPassword(shirt.qrCodeId, passwordHash))) return redirect(`/manage?n=${shirt.number}`);
  await startSession(shirt.qrCodeId, passwordHash);
  redirect("/manage");
}

/** Shirt number + password. One try per shirt every few seconds, so a password can't be guessed at speed. */
export async function logInAction(formData: FormData) {
  const number = parseShirtNumber(String(formData.get("number") ?? ""));
  const password = String(formData.get("password") ?? "");
  const here = `/manage?n=${number ?? ""}`;
  const shirt = number ? await getShirtByNumber(number) : null;
  if (!shirt?.handle || !shirt.passwordHash || password.length > PASSWORD_MAX) return fail(here, "wrong");
  if (!(await claim(`manage:${shirt.qrCodeId}`, 3000))) return fail(here, "slow");
  if (!(await verifyPassword(password, shirt.passwordHash))) return fail(here, "wrong");
  await startSession(shirt.qrCodeId, shirt.passwordHash);
  redirect("/manage");
}

export async function renameAction(formData: FormData) {
  const owner = await getOwner();
  if (!owner) return redirect("/manage");
  const handle = parseHandle(String(formData.get("handle") ?? ""));
  if (!handle) return fail("/manage", "handle");
  if (handle !== owner.handle && (await renameShirt(owner.qrCodeId, handle)) === "taken") return fail("/manage", "taken");
  redirect("/manage?saved=1");
}

export async function logOutAction() {
  (await cookies()).set(OWNER_COOKIE, "", { path: "/manage", maxAge: 0 });
  redirect("/manage");
}
