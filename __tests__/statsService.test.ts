import { aggregateDistance, aggregateRunTypes } from "../services/statsService";
import type { Run } from "../types";

const makeRun = ({
  date,
  distance = 5,
  type = "easy",
}: {
  date?: string;
  distance?: number | string | null;
  type?: string | null;
}) =>
  ({
    id: "run-id",
    userId: "user-A",
    authorName: "Alex",
    authorAvatarUrl: null,
    title: "Test Run",
    distance,
    duration: "0:30:00",
    type,
    notes: "",
    likes: [],
    commentCount: 0,
    createdAt: date ? { toDate: () => new Date(date) } : null,
  }) as unknown as Run;

describe("aggregateDistance", () => {
  it("aggregates weekly distance for runs in the same week", () => {
    const runs = [
      makeRun({ date: "2026-06-22T10:00:00Z", distance: 5 }),
      makeRun({ date: "2026-06-23T10:00:00Z", distance: 3 }),
    ];

    const result = aggregateDistance(runs, "weekly");

    expect(result).toHaveLength(1);
    expect(result[0].label).toMatch(/^W\d+$/);
    expect(result[0].distance).toBe(8);
  });

  it("aggregates monthly distance using month labels", () => {
    const runs = [
      makeRun({ date: "2026-06-01T10:00:00Z", distance: 5 }),
      makeRun({ date: "2026-06-15T10:00:00Z", distance: 4.5 }),
      makeRun({ date: "2026-07-01T10:00:00Z", distance: 10 }),
    ];

    const result = aggregateDistance(runs, "monthly");

    expect(result).toEqual([
      { label: "Jun 26", distance: 9.5 },
      { label: "Jul 26", distance: 10 },
    ]);
  });

  it("ignores runs without createdAt", () => {
    const runs = [
      makeRun({ date: undefined, distance: 5 }),
      makeRun({ date: "2026-06-01T10:00:00Z", distance: 3 }),
    ];

    const result = aggregateDistance(runs, "monthly");

    expect(result).toEqual([{ label: "Jun 26", distance: 3 }]);
  });

  it("ignores runs with zero, null, or non-numeric distance", () => {
    const runs = [
      makeRun({ date: "2026-06-01T10:00:00Z", distance: 0 }),
      makeRun({ date: "2026-06-02T10:00:00Z", distance: null }),
      makeRun({ date: "2026-06-03T10:00:00Z", distance: "not-a-number" }),
      makeRun({ date: "2026-06-04T10:00:00Z", distance: 6 }),
    ];

    const result = aggregateDistance(runs, "monthly");

    expect(result).toEqual([{ label: "Jun 26", distance: 6 }]);
  });

  it("converts numeric string distances before aggregating", () => {
    const runs = [
      makeRun({ date: "2026-06-01T10:00:00Z", distance: "4.5" }),
      makeRun({ date: "2026-06-02T10:00:00Z", distance: 2 }),
    ];

    const result = aggregateDistance(runs, "monthly");

    expect(result).toEqual([{ label: "Jun 26", distance: 6.5 }]);
  });

  it("returns at most the last 8 aggregated periods", () => {
    const runs = [
      makeRun({ date: "2026-01-01T10:00:00Z", distance: 1 }),
      makeRun({ date: "2026-02-01T10:00:00Z", distance: 2 }),
      makeRun({ date: "2026-03-01T10:00:00Z", distance: 3 }),
      makeRun({ date: "2026-04-01T10:00:00Z", distance: 4 }),
      makeRun({ date: "2026-05-01T10:00:00Z", distance: 5 }),
      makeRun({ date: "2026-06-01T10:00:00Z", distance: 6 }),
      makeRun({ date: "2026-07-01T10:00:00Z", distance: 7 }),
      makeRun({ date: "2026-08-01T10:00:00Z", distance: 8 }),
      makeRun({ date: "2026-09-01T10:00:00Z", distance: 9 }),
      makeRun({ date: "2026-10-01T10:00:00Z", distance: 10 }),
    ];

    const result = aggregateDistance(runs, "monthly");

    expect(result).toHaveLength(8);
    expect(result[0]).toEqual({ label: "Mar 26", distance: 3 });
    expect(result[7]).toEqual({ label: "Oct 26", distance: 10 });
  });

  it("returns an empty array when there are no valid runs", () => {
    const result = aggregateDistance([], "weekly");

    expect(result).toEqual([]);
  });
});

describe("aggregateRunTypes", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-28T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("aggregates run types for the current week only", () => {
    const runs = [
      makeRun({ date: "2026-06-22T10:00:00Z", type: "easy" }),
      makeRun({ date: "2026-06-23T10:00:00Z", type: "easy" }),
      makeRun({ date: "2026-06-24T10:00:00Z", type: "tempo" }),
      makeRun({ date: "2026-06-21T10:00:00Z", type: "long" }),
    ];

    const result = aggregateRunTypes(runs, "weekly");

    expect(result.totalRuns).toBe(3);
    expect(result.runType).toEqual([
      { type: "easy", count: 2, percentage: 67 },
      { type: "tempo", count: 1, percentage: 33 },
    ]);
  });

  it("aggregates run types for the current month only", () => {
    const runs = [
      makeRun({ date: "2026-06-01T10:00:00Z", type: "easy" }),
      makeRun({ date: "2026-06-15T10:00:00Z", type: "tempo" }),
      makeRun({ date: "2026-06-20T10:00:00Z", type: "tempo" }),
      makeRun({ date: "2026-05-31T10:00:00Z", type: "race" }),
    ];

    const result = aggregateRunTypes(runs, "monthly");

    expect(result.totalRuns).toBe(3);
    expect(result.runType).toEqual([
      { type: "tempo", count: 2, percentage: 67 },
      { type: "easy", count: 1, percentage: 33 },
    ]);
  });

  it("ignores runs without type or createdAt", () => {
    const runs = [
      makeRun({ date: "2026-06-22T10:00:00Z", type: null }),
      makeRun({ date: undefined, type: "easy" }),
      makeRun({ date: "2026-06-23T10:00:00Z", type: "easy" }),
    ];

    const result = aggregateRunTypes(runs, "weekly");

    expect(result.totalRuns).toBe(1);
    expect(result.runType).toEqual([
      { type: "easy", count: 1, percentage: 100 },
    ]);
  });

  it("sorts run types by count descending", () => {
    const runs = [
      makeRun({ date: "2026-06-22T10:00:00Z", type: "race" }),
      makeRun({ date: "2026-06-23T10:00:00Z", type: "easy" }),
      makeRun({ date: "2026-06-24T10:00:00Z", type: "easy" }),
      makeRun({ date: "2026-06-25T10:00:00Z", type: "tempo" }),
      makeRun({ date: "2026-06-26T10:00:00Z", type: "tempo" }),
      makeRun({ date: "2026-06-27T10:00:00Z", type: "tempo" }),
    ];

    const result = aggregateRunTypes(runs, "weekly");

    expect(result.runType[0].type).toBe("tempo");
    expect(result.runType[1].type).toBe("easy");
    expect(result.runType[2].type).toBe("race");
  });

  it("returns empty runType data when no runs match the selected period", () => {
    const runs = [
      makeRun({ date: "2026-05-01T10:00:00Z", type: "easy" }),
      makeRun({ date: "2026-05-02T10:00:00Z", type: "tempo" }),
    ];

    const result = aggregateRunTypes(runs, "weekly");

    expect(result).toEqual({
      runType: [],
      totalRuns: 0,
    });
  });
});