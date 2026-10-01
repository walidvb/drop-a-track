"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { assignHandle, createQrCode, deleteDrop, setBagTheme } from "@/lib/admin";
import { isAdminAuthorization } from "@/lib/admin-auth";
import { parseHandle } from "@/lib/handle";

/** proxy.ts guards /admin already; server actions check again rather than trust the route. */
async function assertAdmin() {
  if (!isAdminAuthorization((await headers()).get("authorization"))) throw new Error("Unauthorized");
}

const back = (to: string, error?: string): never =>
  redirect(error ? `${to}${to.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}` : to);

export async function createQrCodesAction(formData: FormData) {
  await assertAdmin();
  const n = Math.min(100, Math.max(1, Number(formData.get("count")) || 1));
  for (let i = 0; i < n; i++) await createQrCode();
  back("/admin");
}

export async function assignHandleAction(formData: FormData) {
  await assertAdmin();
  const handle = parseHandle(String(formData.get("handle") ?? ""));
  if (!handle) return back("/admin", "Handles are 2–30 characters: a–z, 0–9, dot, dash, underscore — and not admin, api, closed or s.");
  const result = await assignHandle(Number(formData.get("id")), handle);
  if (result === "taken") return back("/admin", `${handle} is taken.`);
  if (result === "already-set") return back("/admin", "That shirt already has a handle.");
  back("/admin");
}

export async function deleteDropAction(formData: FormData) {
  await assertAdmin();
  await deleteDrop(Number(formData.get("dropId")));
  back(`/admin/${Number(formData.get("number"))}`);
}

export async function setThemeAction(formData: FormData) {
  await assertAdmin();
  await setBagTheme(Number(formData.get("bagId")), String(formData.get("theme") ?? ""));
  back(`/admin/${Number(formData.get("number"))}`);
}
