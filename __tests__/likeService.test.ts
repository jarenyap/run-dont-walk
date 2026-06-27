import { toggleLike } from "../services/likeService";

jest.mock("../firebaseConfig", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db: any, _col: any, id: any) => ({ id })),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  arrayUnion: jest.fn((val: any) => ({ __type: "arrayUnion", val })),
  arrayRemove: jest.fn((val: any) => ({ __type: "arrayRemove", val })),
}));

import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

const mockDoc = doc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockArrayUnion = arrayUnion as jest.Mock;
const mockArrayRemove = arrayRemove as jest.Mock;

describe("toggleLike", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls updateDoc exactly once", async () => {
    await toggleLike("run-123", "user-A", false);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it("uses arrayUnion when isLiked is false (user is adding a like)", async () => {
    await toggleLike("run-123", "user-A", false);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { likes: { __type: "arrayUnion", val: "user-A" } }
    );
  });

  it("uses arrayRemove when isLiked is true (user is removing a like)", async () => {
    await toggleLike("run-123", "user-A", true);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { likes: { __type: "arrayRemove", val: "user-A" } }
    );
  });

  it("targets the correct run document by runId", async () => {
    await toggleLike("run-xyz", "user-A", false);
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "runs", "run-xyz");
  });

  it("targets the correct run document for a different runId", async () => {
    await toggleLike("run-abc", "user-B", true);
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "runs", "run-abc");
  });

  it("passes the correct uid into arrayUnion", async () => {
    await toggleLike("run-123", "user-XYZ", false);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { likes: { __type: "arrayUnion", val: "user-XYZ" } }
    );
  });
});