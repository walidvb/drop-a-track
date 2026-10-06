// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import {
  OWNER_SESSION_SECONDS,
  hashPassword,
  issueOwnerSession,
  ownerSessionShirt,
  verifyOwnerSession,
  verifyPassword,
} from "./owner-auth";
import { issueTicket } from "./ticket";

beforeAll(() => {
  process.env.TICKET_SECRET = "test-secret-that-is-at-least-32-characters";
});

describe("owner passwords", () => {
  it("are stored salted and hashed, never as typed", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).toMatch(/^\$scrypt\$ln=15,r=8,p=3\$[\w-]+\$[\w-]+$/);
    expect(a).not.toContain("correct horse");
    expect(a).not.toBe(b);
  });

  it("verify only the password they were made from", async () => {
    const stored = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", stored)).toBe(true);
    expect(await verifyPassword("correct horsE", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("refuse a malformed hash rather than throw", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "plain-text")).toBe(false);
    expect(await verifyPassword("x", "$scrypt$ln=15,r=8$abc$def")).toBe(false);
  });
});

describe("owner sessions", () => {
  const hash = "$scrypt$ln=15,r=8,p=3$salt$key";

  it("verify for their own shirt until they expire", async () => {
    const now = Date.now();
    const session = await issueOwnerSession(7, hash, now);
    expect(ownerSessionShirt(session)).toBe(7);
    expect(await verifyOwnerSession(session, 7, hash, now)).toBe(true);
    expect(await verifyOwnerSession(session, 7, hash, now + (OWNER_SESSION_SECONDS + 1) * 1000)).toBe(false);
    expect(await verifyOwnerSession(session, 8, hash, now)).toBe(false);
  });

  it("end when the password changes or is cleared", async () => {
    const session = await issueOwnerSession(7, hash);
    expect(await verifyOwnerSession(session, 7, "$scrypt$ln=15,r=8,p=3$salt$other")).toBe(false);
    expect(await verifyOwnerSession(session, 7, null)).toBe(false);
  });

  it("can't be made from a scan ticket or edited", async () => {
    const ticket = await issueTicket(7);
    expect(ownerSessionShirt(ticket)).toBeNull();
    expect(await verifyOwnerSession(`owner.${ticket}`, 7, hash)).toBe(false);
    const [kind, , exp, mac] = (await issueOwnerSession(7, hash)).split(".");
    expect(await verifyOwnerSession(`${kind}.8.${exp}.${mac}`, 8, hash)).toBe(false);
    expect(await verifyOwnerSession(undefined, 7, hash)).toBe(false);
  });
});
