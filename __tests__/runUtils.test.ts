import { computePace } from "../utils/runUtils";

describe("computePace", () => {
  it("computes correct pace for a standard run (HH:MM:SS)", () => {
    expect(computePace("0:25:00", 5.0)).toBe("5:00/km");
  });

  it("computes correct pace for a fast tempo run (HH:MM:SS)", () => {
    expect(computePace("0:40:00", 10.0)).toBe("4:00/km");
  });

  it("pads seconds correctly when paceSec < 10", () => {
    expect(computePace("0:21:05", 5.0)).toBe("4:13/km");
  });

  it("handles a 1-hour run with hours in duration (HH:MM:SS)", () => {
    expect(computePace("1:00:00", 12.0)).toBe("5:00/km");
  });

  it("computes correct pace for MM:SS format", () => {
    expect(computePace("25:00", 5.0)).toBe("5:00/km");
  });

  // Edge cases
  it("returns '--' when distance is 0", () => {
    expect(computePace("0:30:00", 0)).toBe("--");
  });

  it("returns '--' when distance is negative", () => {
    expect(computePace("0:30:00", -1)).toBe("--");
  });

  it("returns '--' when duration is 0:00:00 (zero time)", () => {
    expect(computePace("0:00:00", 5.0)).toBe("--");
  });

  it("returns '--' when duration contains non-numeric parts", () => {
    expect(computePace("abc:xx:yy", 5.0)).toBe("--");
  });

  it("returns '--' when duration is empty string", () => {
    expect(computePace("", 5.0)).toBe("--");
  });
});