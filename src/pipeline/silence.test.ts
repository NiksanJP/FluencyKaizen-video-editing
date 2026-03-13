import { describe, expect, test } from "bun:test";
import { detectSilenceGaps } from "./silence.js";

describe("detectSilenceGaps", () => {
  test("does not cut off the end of a long final word", () => {
    const gaps = detectSilenceGaps(
      [
        { start: 0.2, end: 0.6 },
        { start: 1.0, end: 2.9 },
      ],
      0,
      4,
      0.5,
      0.1
    );

    const trailingGap = gaps[gaps.length - 1];

    expect(trailingGap).toBeDefined();
    expect(trailingGap.originalStart).toBeCloseTo(3.08, 2);
    expect(trailingGap.originalEnd).toBeCloseTo(4, 5);
  });

  test("keeps extra tail padding before an inter-word cut", () => {
    const gaps = detectSilenceGaps(
      [
        { start: 0.0, end: 1.9 },
        { start: 3.1, end: 3.4 },
      ],
      0,
      4,
      0.5,
      0.1
    );

    expect(gaps).toHaveLength(2);
    expect(gaps[0].originalStart).toBeGreaterThanOrEqual(2.08);
    expect(gaps[0].originalEnd).toBeCloseTo(2.98, 2);
  });
});
