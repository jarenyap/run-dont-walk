import { followUser, unfollowUser } from "../services/followService";

jest.mock("../firebaseConfig", () => ({ db: {} }));

const mockCommit = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn();
const mockBatch = { update: mockUpdate, commit: mockCommit };

jest.mock("firebase/firestore", () => ({
  writeBatch: jest.fn(() => mockBatch),
  doc: jest.fn((_db: unknown, _col: string, id: string) => ({ id })),
  arrayUnion: jest.fn((val: unknown) => ({ __type: "arrayUnion", val })),
  arrayRemove: jest.fn((val: unknown) => ({ __type: "arrayRemove", val })),
  increment: jest.fn((n: number) => ({ __type: "increment", n })),
}));

const { arrayUnion, arrayRemove, increment } = jest.requireMock("firebase/firestore");

describe("followUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls batch.commit exactly once", async () => {
    await followUser("user-A", "user-B");
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("adds targetId to current user's followingIds with arrayUnion", async () => {
    await followUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      { id: "user-A" },
      { followingIds: arrayUnion("user-B") }
    );
  });

  it("adds currentId to target user's followerIds with arrayUnion", async () => {
    await followUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      { id: "user-B" },
      expect.objectContaining({ followerIds: arrayUnion("user-A") })
    );
  });

  it("increments target user's followersCount by 1", async () => {
    await followUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      { id: "user-B" },
      expect.objectContaining({ followersCount: increment(1) })
    );
  });

  it("calls batch.update exactly twice (once per user doc)", async () => {
    await followUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("unfollowUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls batch.commit exactly once", async () => {
    await unfollowUser("user-A", "user-B");
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("removes targetId from current user's followingIds with arrayRemove", async () => {
    await unfollowUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      { id: "user-A" },
      { followingIds: arrayRemove("user-B") }
    );
  });

  it("removes currentId from target user's followerIds with arrayRemove", async () => {
    await unfollowUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      { id: "user-B" },
      expect.objectContaining({ followerIds: arrayRemove("user-A") })
    );
  });

  it("decrements target user's followersCount by 1", async () => {
    await unfollowUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      { id: "user-B" },
      expect.objectContaining({ followersCount: increment(-1) })
    );
  });

  it("calls batch.update exactly twice (once per user doc)", async () => {
    await unfollowUser("user-A", "user-B");
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
});