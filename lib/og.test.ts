// @vitest-environment node
import { expect, test } from "vitest";
import { kiss, wallGrid } from "./og";

test("the cover wall grows with the bag", () => {
  expect([0, 1, 2, 3, 4, 5, 7, 9, 16, 25, 41, 200].map(wallGrid)).toEqual([
    [1, 1], [1, 1], [2, 1], [3, 1], [2, 2], [3, 2], [4, 2], [5, 3], [8, 3], [8, 5], [12, 5], [12, 5],
  ]);
});

test("a handle kisses its box as the design measured it", async () => {
  const fit = await kiss("MIRA.K", 584);
  expect(fit.size).toBeCloseTo(109.46, 1);
  expect(fit.bearing / fit.size).toBeCloseTo(0.0322, 3);
});
