import { logRun, getUserRuns, subscribeToUserRuns } from "../services/runService";
import type { NewRun } from "../types";

jest.mock("../firebaseConfig", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  doc: jest.fn((...args: any[]) => {
    if (args.length === 1) return { id: "mock-run-id" };
    return { id: args[2] ?? "mock-id" };
  }),
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  increment: jest.fn((n: any) => ({ __type: "increment", n })),
}));

import { writeBatch, getDocs, serverTimestamp, increment } from "firebase/firestore";

const mockWriteBatch = writeBatch as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;

const mockNewRun: NewRun = {
  userId: "user-A",
  authorName: "Alex Tan",
  authorAvatarUrl: null,
  title: "Morning Run",
  distance: 5.2,
  duration: "0:32:15",
  type: "easy",
  notes: "Felt great!",
};

describe("logRun", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the new run's document ID", async () => {
    const id = await logRun(mockNewRun);
    expect(typeof id).toBe("string");
  });

  it("calls batch.commit once", async () => {
    await logRun(mockNewRun);
    const batch = mockWriteBatch.mock.results[0].value;
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it("sets the run document with correct fields including likes:[] and commentCount:0", async () => {
    await logRun(mockNewRun);
    const batch = mockWriteBatch.mock.results[0].value;
    expect(batch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ...mockNewRun,
        likes: [],
        commentCount: 0,
        createdAt: "SERVER_TIMESTAMP",
      })
    );
  });

  it("increments user's totalRuns by 1", async () => {
    await logRun(mockNewRun);
    const batch = mockWriteBatch.mock.results[0].value;
    expect(batch.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ totalRuns: { __type: "increment", n: 1 } })
    );
  });

  it("increments user's totalDistance by the run's distance", async () => {
    await logRun(mockNewRun);
    const batch = mockWriteBatch.mock.results[0].value;
    expect(batch.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ totalDistance: { __type: "increment", n: 5.2 } })
    );
  });
});

describe("getUserRuns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it("returns an empty array when user has no runs", async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const result = await getUserRuns("user-A");
    expect(result).toEqual([]);
  });

  it("maps Firestore docs to Run objects with id field", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "run-1",
          data: () => ({
            userId: "user-A",
            title: "Easy jog",
            distance: 3.0,
            duration: "0:20:00",
            type: "easy",
            notes: "",
            likes: [],
            commentCount: 0,
            createdAt: null,
            authorName: "Alex",
            authorAvatarUrl: null,
          }),
        },
      ],
    });
    const result = await getUserRuns("user-A");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("run-1");
    expect(result[0].distance).toBe(3.0);
  });

  it("returns multiple runs in the order returned by Firestore", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: "run-2", data: () => ({ distance: 8.0, userId: "user-A" }) },
        { id: "run-1", data: () => ({ distance: 5.0, userId: "user-A" }) },
      ],
    });
    const result = await getUserRuns("user-A");
    expect(result[0].id).toBe("run-2");
    expect(result[1].id).toBe("run-1");
  });
});

describe("logRun error handling", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws and logs an error when batch.commit fails", async () => {
    mockWriteBatch.mockReturnValueOnce({
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn().mockRejectedValue(new Error("Firestore write failed")),
    });

    await expect(logRun(mockNewRun)).rejects.toThrow("Firestore write failed");
  });
});

describe("getUserRuns error handling", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws and logs an error when getDocs fails", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Firestore read failed"));
    await expect(getUserRuns("user-A")).rejects.toThrow("Firestore read failed");
  });
});

describe("subscribeToUserRuns", () => {
  const { onSnapshot } = jest.requireMock("firebase/firestore");

  beforeEach(() => jest.clearAllMocks());

  it("returns an unsubscribe function", () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockReturnValue(mockUnsubscribe);

    const unsub = subscribeToUserRuns("user-A", jest.fn(), jest.fn());
    expect(typeof unsub).toBe("function");
  });

  it("calls onData with mapped runs when snapshot fires", () => {
    const mockOnData = jest.fn();
    const fakeSnapshot = {
      docs: [
        { id: "run-1", data: () => ({ distance: 5.0, userId: "user-A" }) },
        { id: "run-2", data: () => ({ distance: 3.0, userId: "user-A" }) },
      ],
    };

    onSnapshot.mockImplementation(
      (_query: unknown, onData: (snap: typeof fakeSnapshot) => void) => {
        onData(fakeSnapshot);
        return jest.fn();
      }
    );

    subscribeToUserRuns("user-A", mockOnData, jest.fn());

    expect(mockOnData).toHaveBeenCalledWith([
      { id: "run-1", distance: 5.0, userId: "user-A" },
      { id: "run-2", distance: 3.0, userId: "user-A" },
    ]);
  });

  it("calls onData with empty array when there are no runs", () => {
    const mockOnData = jest.fn();
    onSnapshot.mockImplementation(
      (_query: unknown, onData: (snap: { docs: [] }) => void) => {
        onData({ docs: [] });
        return jest.fn();
      }
    );

    subscribeToUserRuns("user-A", mockOnData, jest.fn());
    expect(mockOnData).toHaveBeenCalledWith([]);
  });

  it("calls onError when Firestore emits an error", () => {
    const mockOnError = jest.fn();
    const fakeError = new Error("Permission denied");

    onSnapshot.mockImplementation(
      (_query: unknown, _onData: unknown, onError: (err: Error) => void) => {
        onError(fakeError);
        return jest.fn();
      }
    );

    subscribeToUserRuns("user-A", jest.fn(), mockOnError);
    expect(mockOnError).toHaveBeenCalledWith(fakeError);
  });
});