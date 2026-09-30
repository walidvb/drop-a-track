// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { TICKET_TTL_SECONDS, issueTicket, verifyTicket } from "./ticket";

beforeAll(() => {
  process.env.TICKET_SECRET = "test-secret-that-is-at-least-32-characters";
});

describe("scan tickets", () => {
  it("verify for their own bag until they expire", async () => {
    const now = Date.now();
    const ticket = await issueTicket(7, now);
    expect(await verifyTicket(ticket, 7, now)).toBe(true);
    expect(await verifyTicket(ticket, 7, now + (TICKET_TTL_SECONDS - 1) * 1000)).toBe(true);
    expect(await verifyTicket(ticket, 7, now + (TICKET_TTL_SECONDS + 1) * 1000)).toBe(false);
  });

  it("don't open another bag", async () => {
    expect(await verifyTicket(await issueTicket(7), 8)).toBe(false);
  });

  it("reject tampering", async () => {
    const [id, exp, mac] = (await issueTicket(7)).split(".");
    expect(await verifyTicket(`${id}.${Number(exp) + 999999}.${mac}`, 7)).toBe(false);
    expect(await verifyTicket(`8.${exp}.${mac}`, 8)).toBe(false);
    expect(await verifyTicket("garbage", 7)).toBe(false);
    expect(await verifyTicket(undefined, 7)).toBe(false);
  });
});
