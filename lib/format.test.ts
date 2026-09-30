import { describe, expect, it } from "vitest";
import { monthYear, relativeTime } from "./format";

describe("format", () => {
  const now = new Date("2026-09-29T12:00:00Z");
  it.each([
    [30, "Just now"],
    [5 * 60, "5m ago"],
    [3 * 3600, "3h ago"],
    [2 * 86400, "2d ago"],
    [3 * 7 * 86400, "3w ago"],
  ])("%is ago → %s", (s, label) => {
    expect(relativeTime(new Date(now.getTime() - s * 1000), now)).toBe(label);
  });

  it("falls back to month.year, like the poster", () => {
    expect(relativeTime(new Date("2026-06-01T00:00:00Z"), now)).toBe("06.2026");
    expect(monthYear(new Date("2026-06-15T00:00:00Z"))).toBe("06.2026");
  });
});
