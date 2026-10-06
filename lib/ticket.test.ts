// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { CLAIM_WINDOW_SECONDS, issueTicket, readTickets, ticketCookieName, verifyFreshTicket, verifyTicket } from "./ticket";

beforeAll(() => {
  process.env.TICKET_SECRET = "test-secret-that-is-at-least-32-characters";
});

const YEAR = 365 * 24 * 60 * 60 * 1000;

describe("scan tickets", () => {
  it("verify for their own bag, however long ago the scan", async () => {
    expect(await verifyTicket(await issueTicket(7), 7)).toBe(true);
    expect(await verifyTicket(await issueTicket(7, Date.now() - YEAR), 7)).toBe(true);
  });

  it("only claim a shirt from a scan within the claim window", async () => {
    const now = Date.now();
    const ticket = await issueTicket(7, now);
    expect(await verifyFreshTicket(ticket, 7, now + (CLAIM_WINDOW_SECONDS - 1) * 1000)).toBe(true);
    expect(await verifyFreshTicket(ticket, 7, now + (CLAIM_WINDOW_SECONDS + 1) * 1000)).toBe(false);
    expect(await verifyFreshTicket(ticket, 8, now)).toBe(false);
  });

  it("don't open another bag", async () => {
    expect(await verifyTicket(await issueTicket(7), 8)).toBe(false);
  });

  it("reject tampering", async () => {
    const [id, at, mac] = (await issueTicket(7)).split(".");
    expect(await verifyTicket(`${id}.${Number(at) + 999999}.${mac}`, 7)).toBe(false);
    expect(await verifyTicket(`8.${at}.${mac}`, 8)).toBe(false);
    expect(await verifyTicket("garbage", 7)).toBe(false);
    expect(await verifyTicket(undefined, 7)).toBe(false);
  });

  it("are read from the cookies they were issued under", async () => {
    const seven = await issueTicket(7);
    const tickets = await readTickets([
      { name: ticketCookieName(7), value: seven },
      { name: ticketCookieName(9), value: seven }, // moved to another bag's cookie
      { name: ticketCookieName(8), value: "garbage" },
      { name: "dat_uid", value: "x" },
    ]);
    expect(tickets.map((t) => t.bagId)).toEqual([7]);
  });
});
