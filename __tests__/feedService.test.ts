import { subscribeFeed } from "../services/feedService";

jest.mock("../firebaseConfig", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  onSnapshot: jest.fn(),
}));

import {
  collection,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

const mockCollection = collection as jest.Mock;
const mockWhere = where as jest.Mock;
const mockOrderBy = orderBy as jest.Mock;
const mockLimit = limit as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;

describe("subscribeFeed", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onSnapshot and returns an unsubscribe function", () => {
    const mockUnsubscribe = jest.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const unsubscribe = subscribeFeed("user-A", ["user-B"], jest.fn());
    expect(typeof unsubscribe).toBe("function");
  });

  it("includes currentUserId in the feedIds list passed to where()", () => {
    mockOnSnapshot.mockReturnValue(jest.fn());
    subscribeFeed("user-A", ["user-B", "user-C"], jest.fn());

    expect(mockWhere).toHaveBeenCalledWith(
      "userId",
      "in",
      expect.arrayContaining(["user-A"])
    );
  });

  it("includes followingIds in the feedIds list passed to where()", () => {
    mockOnSnapshot.mockReturnValue(jest.fn());
    subscribeFeed("user-A", ["user-B", "user-C"], jest.fn());

    expect(mockWhere).toHaveBeenCalledWith(
      "userId",
      "in",
      expect.arrayContaining(["user-B", "user-C"])
    );
  });

  it("caps feedIds at 30 (Firestore in-query limit)", () => {
    mockOnSnapshot.mockReturnValue(jest.fn());
    const largeFollowList = Array.from({ length: 35 }, (_, i) => `user-${i}`);
    subscribeFeed("current-user", largeFollowList, jest.fn());

    const passedIds = mockWhere.mock.calls[0][2] as string[];
    expect(passedIds.length).toBeLessThanOrEqual(30);
  });

  it("queries the 'runs' collection", () => {
    mockOnSnapshot.mockReturnValue(jest.fn());
    subscribeFeed("user-A", [], jest.fn());
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "runs");
  });

  it("orders results by createdAt descending", () => {
    mockOnSnapshot.mockReturnValue(jest.fn());
    subscribeFeed("user-A", ["user-B"], jest.fn());
    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("limits results to 30", () => {
    mockOnSnapshot.mockReturnValue(jest.fn());
    subscribeFeed("user-A", ["user-B"], jest.fn());
    expect(mockLimit).toHaveBeenCalledWith(30);
  });

  it("calls onUpdate with mapped run objects when snapshot fires", () => {
    const mockRun = {
      userId: "user-B",
      title: "Morning Run",
      distance: 5.0,
      duration: "0:30:00",
      type: "easy",
      notes: "",
      likes: [],
      commentCount: 0,
      createdAt: null,
      authorName: "Bob",
      authorAvatarUrl: null,
    };

    mockOnSnapshot.mockImplementationOnce((_q: any, callback: any) => {
      callback({ docs: [{ id: "run-1", data: () => mockRun }] });
      return jest.fn();
    });

    const onUpdate = jest.fn();
    subscribeFeed("user-A", ["user-B"], onUpdate);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith([{ id: "run-1", ...mockRun }]);
  });

  it("calls onError when snapshot fires an error", () => {
    const testError = new Error("Firestore permission denied");

    mockOnSnapshot.mockImplementationOnce((_q: any, _onNext: any, onError: any) => {
      onError(testError);
      return jest.fn();
    });

    const onError = jest.fn();
    subscribeFeed("user-A", ["user-B"], jest.fn(), onError);
    expect(onError).toHaveBeenCalledWith(testError);
  });
});