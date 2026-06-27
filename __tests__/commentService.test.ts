import { addComment } from "../services/commentService";

jest.mock("../firebaseConfig", () => ({ db: {} }));

const mockCommit = jest.fn().mockResolvedValue(undefined);
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockBatch = { set: mockSet, update: mockUpdate, commit: mockCommit };

const mockCommentRef = { id: "comment-auto-id" };

jest.mock("firebase/firestore", () => ({
  writeBatch: jest.fn(() => mockBatch),
  doc: jest.fn((_col: unknown) => mockCommentRef),
  collection: jest.fn((_db: unknown, ..._args: string[]) => ({})),
  increment: jest.fn((n: number) => ({ __type: "increment", n })),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
}));

const { increment, serverTimestamp } = jest.requireMock("firebase/firestore");

describe("addComment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls batch.commit once for a valid comment", async () => {
    await addComment("run-1", "user-A", "Alex", null, "Great run!");
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("does NOT commit if text is empty string", async () => {
    await addComment("run-1", "user-A", "Alex", null, "");
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("does NOT commit if text is only whitespace", async () => {
    await addComment("run-1", "user-A", "Alex", null, "   ");
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("trims whitespace from comment text before saving", async () => {
    await addComment("run-1", "user-A", "Alex", null, "  Great run!  ");
    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ text: "Great run!" })
    );
  });

  it("sets correct comment fields including runId, authorUid, authorName", async () => {
    await addComment("run-1", "user-A", "Alex Tan", "http://avatar.jpg", "Nice pace!");
    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        runId: "run-1",
        authorUid: "user-A",
        authorName: "Alex Tan",
        authorAvatarUrl: "http://avatar.jpg",
        text: "Nice pace!",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("increments the run's commentCount by 1", async () => {
    await addComment("run-1", "user-A", "Alex", null, "Well done!");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { commentCount: increment(1) }
    );
  });

  it("stores null avatarUrl when no avatar is provided", async () => {
    await addComment("run-1", "user-A", "Alex", null, "Good job!");
    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ authorAvatarUrl: null })
    );
  });
});