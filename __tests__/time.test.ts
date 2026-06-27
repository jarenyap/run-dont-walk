import { formatRelativeTime } from "../utils/time";
import { Timestamp } from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
    })),
  },
}));

function msAgo(ms: number): Timestamp {
  const date = new Date(Date.now() - ms);
  return { toDate: () => date } as unknown as Timestamp;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("returns 'just now' for null timestamp", () => {
    expect(formatRelativeTime(null)).toBe("just now");
  });

  it("returns 'just now' for undefined timestamp", () => {
    expect(formatRelativeTime(undefined)).toBe("just now");
  });

  it("returns 'just now' for a timestamp less than 1 minute ago", () => {
    expect(formatRelativeTime(msAgo(30 * 1000))).toBe("just now");
  });

  it("returns minutes ago for a timestamp between 1-59 minutes ago", () => {
    expect(formatRelativeTime(msAgo(5 * MINUTE))).toBe("5m ago");
  });

  it("returns '1m ago' for exactly 1 minute ago", () => {
    expect(formatRelativeTime(msAgo(MINUTE))).toBe("1m ago");
  });

  it("returns '59m ago' for 59 minutes ago", () => {
    expect(formatRelativeTime(msAgo(59 * MINUTE))).toBe("59m ago");
  });

  it("returns hours ago for a timestamp between 1-23 hours ago", () => {
    expect(formatRelativeTime(msAgo(2 * HOUR))).toBe("2h ago");
  });

  it("returns '1h ago' for exactly 1 hour ago", () => {
    expect(formatRelativeTime(msAgo(HOUR))).toBe("1h ago");
  });

  it("returns '23h ago' for 23 hours ago", () => {
    expect(formatRelativeTime(msAgo(23 * HOUR))).toBe("23h ago");
  });

  it("returns days ago for a timestamp 1+ days ago", () => {
    expect(formatRelativeTime(msAgo(DAY))).toBe("1d ago");
  });

  it("returns '3d ago' for 3 days ago", () => {
    expect(formatRelativeTime(msAgo(3 * DAY))).toBe("3d ago");
  });
});