import {
  createClan,
  getClanById,
  getUserClans,
  discoverPublicClans,
  subscribeToClan,
  deriveClanRole,
  getClanPermissions,
  joinPublicClan,
  requestToJoinClan,
  getJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  removeMember,
  leaveClan,
  promoteToModerator,
  demoteModerator,
  promoteToCoLeader,
  demoteCoLeader,
  transferLeadership,
  postAnnouncement,
  updateClanDetails,
  disbandClan,
} from "../services/clanService";
import type { Clan } from "../types/index";

jest.mock("../firebaseConfig", () => ({ db: {}, storage: {} }));
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

const mockCommit = jest.fn().mockResolvedValue(undefined);
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockBatch = { set: mockSet, update: mockUpdate, commit: mockCommit, delete: jest.fn() };

const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockDeleteDoc = jest.fn().mockResolvedValue(undefined);
const mockAddDoc = jest.fn().mockResolvedValue({ id: "mock-request-id" });
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockOnSnapshot = jest.fn();

jest.mock("firebase/firestore", () => ({
  writeBatch: jest.fn(() => mockBatch),
  doc: jest.fn((...args: any[]) => {
    const last = args[args.length - 1];
    return { id: typeof last === "string" ? last : "mock-clan-id" };
  }),
  collection: jest.fn(() => ({})),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  arrayUnion: jest.fn((v) => ({ __type: "arrayUnion", v })),
  arrayRemove: jest.fn((v) => ({ __type: "arrayRemove", v })),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));

const makeClan = (overrides: Partial<Clan> = {}): Clan => ({
  id: "clan-1",
  name: "Test Clan",
  description: "",
  isPrivate: false,
  bannerUrl: null,
  leaderId: "leader-uid",
  coLeaderIds: [],
  moderatorIds: [],
  memberIds: ["leader-uid"],
  currentWarId: null,
  announcement: null,
  createdAt: {} as any,
  ...overrides,
});

describe("createClan", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the new clan's document ID", async () => {
    const id = await createClan("user-A", "Test Clan", "desc", false);
    expect(typeof id).toBe("string");
  });

  it("sets the creator as leaderId and only member", async () => {
    await createClan("user-A", "Test Clan", "", false);
    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ leaderId: "user-A", memberIds: ["user-A"] })
    );
  });

  it("calls batch.commit once", async () => {
    await createClan("user-A", "Test Clan", "", false);
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("adds the new clan ID to the creator's clanIds via arrayUnion", async () => {
    await createClan("user-A", "Test Clan", "", false);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clanIds: { __type: "arrayUnion", v: "mock-clan-id" } })
    );
  });
});

describe("getClanById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a clan when it exists", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: "clan-1",
      data: () => ({ name: "Test Clan" }),
    });
    const clan = await getClanById("clan-1");
    expect(clan).toEqual({ id: "clan-1", name: "Test Clan" });
  });

  it("returns null when the clan does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    const clan = await getClanById("missing-clan");
    expect(clan).toBeNull();
  });
});

describe("getUserClans", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an empty array when given no clan IDs", async () => {
    const result = await getUserClans([]);
    expect(result).toEqual([]);
  });

  it("fetches and returns clans for given IDs, filtering out missing ones", async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, id: "clan-1", data: () => ({ name: "A" }) })
      .mockResolvedValueOnce({ exists: () => false });
    const result = await getUserClans(["clan-1", "clan-2"]);
    expect(result).toEqual([{ id: "clan-1", name: "A" }]);
  });
});

describe("discoverPublicClans", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns public clans mapped from Firestore docs", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: "clan-1", data: () => ({ name: "Public Clan", isPrivate: false }) }],
    });
    const result = await discoverPublicClans();
    expect(result).toEqual([{ id: "clan-1", name: "Public Clan", isPrivate: false }]);
  });

  it("returns an empty array when there are no public clans", async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const result = await discoverPublicClans();
    expect(result).toEqual([]);
  });
});

describe("subscribeToClan", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onUpdate with mapped clan data when snapshot exists", () => {
    const mockOnUpdate = jest.fn();
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snap: any) => void) => {
      cb({ exists: () => true, id: "clan-1", data: () => ({ name: "Test Clan" }) });
      return jest.fn();
    });
    subscribeToClan("clan-1", mockOnUpdate);
    expect(mockOnUpdate).toHaveBeenCalledWith({ id: "clan-1", name: "Test Clan" });
  });

  it("calls onUpdate with null when the clan no longer exists", () => {
    const mockOnUpdate = jest.fn();
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snap: any) => void) => {
      cb({ exists: () => false });
      return jest.fn();
    });
    subscribeToClan("clan-1", mockOnUpdate);
    expect(mockOnUpdate).toHaveBeenCalledWith(null);
  });

  it("returns an unsubscribe function", () => {
    const unsubscribeMock = jest.fn();
    mockOnSnapshot.mockReturnValue(unsubscribeMock);
    const unsub = subscribeToClan("clan-1", jest.fn());
    expect(unsub).toBe(unsubscribeMock);
  });
});

describe("joinPublicClan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // isUserInWarWithClan reads the user doc — return empty clanIds = no wars
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ clanIds: [] }) });
  });

  it("adds the user to memberIds and calls commit", async () => {
    await joinPublicClan("clan-1", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ memberIds: { __type: "arrayUnion", v: "user-B" } })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("adds the clan ID to the joining user's clanIds", async () => {
    await joinPublicClan("clan-1", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clanIds: { __type: "arrayUnion", v: "clan-1" } })
    );
  });
});

describe("requestToJoinClan", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a join request and returns its ID", async () => {
    const id = await requestToJoinClan("clan-1", "user-B", "Bob", null);
    expect(id).toBe("mock-request-id");
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clanId: "clan-1", userId: "user-B", status: "pending" })
    );
  });
});

describe("getJoinRequests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns pending join requests for a clan", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: "req-1", data: () => ({ userId: "user-B", status: "pending" }) }],
    });
    const result = await getJoinRequests("clan-1");
    expect(result).toEqual([{ id: "req-1", userId: "user-B", status: "pending" }]);
  });

  it("returns an empty array when there are no pending requests", async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const result = await getJoinRequests("clan-1");
    expect(result).toEqual([]);
  });
});

describe("acceptJoinRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ clanIds: [] }) });
  });

  it("adds user to memberIds, updates clanIds, and marks request accepted", async () => {
    await acceptJoinRequest("req-1", "clan-1", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ memberIds: { __type: "arrayUnion", v: "user-B" } })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "accepted" })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("declineJoinRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("marks the join request as rejected", async () => {
    await declineJoinRequest("req-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "rejected" })
    );
  });
});

describe("removeMember", () => {
  beforeEach(() => jest.clearAllMocks());

  it("removes the member from all clan role arrays and their clanIds", async () => {
    await removeMember("clan-1", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        memberIds: { __type: "arrayRemove", v: "user-B" },
        coLeaderIds: { __type: "arrayRemove", v: "user-B" },
        moderatorIds: { __type: "arrayRemove", v: "user-B" },
      })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("leaveClan", () => {
  beforeEach(() => jest.clearAllMocks());

  it("delegates to removeMember behavior", async () => {
    await leaveClan("clan-1", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ memberIds: { __type: "arrayRemove", v: "user-B" } })
    );
  });
});

describe("promoteToModerator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("adds the user to moderatorIds", async () => {
    await promoteToModerator("clan-1", "user-B");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ moderatorIds: { __type: "arrayUnion", v: "user-B" } })
    );
  });
});

describe("demoteModerator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("removes the user from moderatorIds", async () => {
    await demoteModerator("clan-1", "user-B");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ moderatorIds: { __type: "arrayRemove", v: "user-B" } })
    );
  });
});

describe("promoteToCoLeader", () => {
  beforeEach(() => jest.clearAllMocks());

  it("adds to coLeaderIds and removes from moderatorIds", async () => {
    await promoteToCoLeader("clan-1", "user-B");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        coLeaderIds: { __type: "arrayUnion", v: "user-B" },
        moderatorIds: { __type: "arrayRemove", v: "user-B" },
      })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("demoteCoLeader", () => {
  beforeEach(() => jest.clearAllMocks());

  it("removes the user from coLeaderIds", async () => {
    await demoteCoLeader("clan-1", "user-B");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ coLeaderIds: { __type: "arrayRemove", v: "user-B" } })
    );
  });
});

describe("transferLeadership", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sets the new leader and demotes the old leader to co-leader", async () => {
    await transferLeadership("clan-1", "leader-uid", "user-B");
    // first update: remove new leader from coLeaderIds + set leaderId
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        leaderId: "user-B",
        coLeaderIds: { __type: "arrayRemove", v: "user-B" },
      })
    );
    // second update: promote old leader to co-leader
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        coLeaderIds: { __type: "arrayUnion", v: "leader-uid" },
      })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("postAnnouncement", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates the clan's announcement field", async () => {
    await postAnnouncement("clan-1", "Alex", "Training resumes Monday!");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        announcement: expect.objectContaining({
          text: "Training resumes Monday!",
          authorName: "Alex",
        }),
      })
    );
  });
});

describe("updateClanDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates the provided fields and backfills nameLower", async () => {
    await updateClanDetails("clan-1", { name: "New Name" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: "New Name", nameLower: "new name" })
    );
  });
});

describe("disbandClan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // clan doc read
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ memberIds: ["leader-uid", "member-2"] }),
    });
    // join requests query - mock with forEach
    mockGetDocs.mockResolvedValue({ docs: [], forEach: () => {} });
  });

  it("deletes the clan via batch and cleans up member clanIds", async () => {
    await disbandClan("clan-1");
    // batch.delete called on clan doc
    expect(mockBatch.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "clan-1" })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("removes clanId from every member's user doc", async () => {
    await disbandClan("clan-1");
    // two members → two user doc updates
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "leader-uid" }),
      expect.objectContaining({ clanIds: expect.any(Object) })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "member-2" }),
      expect.objectContaining({ clanIds: expect.any(Object) })
    );
  });
});

describe("deriveClanRole", () => {
  it("identifies the leader", () => {
    const clan = makeClan();
    expect(deriveClanRole(clan, "leader-uid")).toBe("Leader");
  });

  it("identifies a co-leader", () => {
    const clan = makeClan({ coLeaderIds: ["co-uid"], memberIds: ["leader-uid", "co-uid"] });
    expect(deriveClanRole(clan, "co-uid")).toBe("Co-Leader");
  });

  it("identifies a moderator", () => {
    const clan = makeClan({ moderatorIds: ["mod-uid"], memberIds: ["leader-uid", "mod-uid"] });
    expect(deriveClanRole(clan, "mod-uid")).toBe("Moderator");
  });

  it("identifies a regular member", () => {
    const clan = makeClan({ memberIds: ["leader-uid", "member-uid"] });
    expect(deriveClanRole(clan, "member-uid")).toBe("Member");
  });

  it("returns null for a non-member", () => {
    const clan = makeClan();
    expect(deriveClanRole(clan, "stranger-uid")).toBeNull();
  });
});

describe("getClanPermissions", () => {
  it("gives Leader all permissions", () => {
    const perms = getClanPermissions("Leader");
    expect(perms.canStartWar).toBe(true);
    expect(perms.canDisbandClan).toBe(true);
    expect(perms.canTransferLeadership).toBe(true);
  });

  it("gives Co-Leader war and edit permissions but not disband/transfer", () => {
    const perms = getClanPermissions("Co-Leader");
    expect(perms.canStartWar).toBe(true);
    expect(perms.canEditClan).toBe(true);
    expect(perms.canDisbandClan).toBe(false);
    expect(perms.canTransferLeadership).toBe(false);
  });

  it("gives Moderator accept/remove/announcement permissions only", () => {
    const perms = getClanPermissions("Moderator");
    expect(perms.canAcceptJoinRequest).toBe(true);
    expect(perms.canRemoveMember).toBe(true);
    expect(perms.canPostAnnouncement).toBe(true);
    expect(perms.canStartWar).toBe(false);
    expect(perms.canPromoteDemote).toBe(false);
  });

  it("gives Member no elevated permissions", () => {
    const perms = getClanPermissions("Member");
    expect(Object.values(perms).every((v) => v === false)).toBe(true);
  });

  it("gives null role no permissions", () => {
    const perms = getClanPermissions(null);
    expect(Object.values(perms).every((v) => v === false)).toBe(true);
  });
});

describe("error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // isUserInWarWithClan reads the user doc for join/accept paths
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ clanIds: [] }) });
  });

  it("createClan rethrows when batch.commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Firestore write failed"));
    await expect(createClan("user-A", "Test Clan", "", false)).rejects.toThrow(
      "Firestore write failed"
    );
  });

  it("getClanById rethrows when getDoc fails", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Network error"));
    await expect(getClanById("clan-1")).rejects.toThrow("Network error");
  });

  it("getUserClans rethrows when getDoc fails", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Network error"));
    await expect(getUserClans(["clan-1"])).rejects.toThrow("Network error");
  });

  it("discoverPublicClans rethrows when getDocs fails", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Query failed"));
    await expect(discoverPublicClans()).rejects.toThrow("Query failed");
  });

  it("joinPublicClan rethrows when batch.commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Write failed"));
    await expect(joinPublicClan("clan-1", "user-B")).rejects.toThrow("Write failed");
  });

  it("requestToJoinClan rethrows when addDoc fails", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("Add failed"));
    await expect(requestToJoinClan("clan-1", "user-B", "Bob", null)).rejects.toThrow(
      "Add failed"
    );
  });

  it("getJoinRequests rethrows when getDocs fails", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Query failed"));
    await expect(getJoinRequests("clan-1")).rejects.toThrow("Query failed");
  });

  it("acceptJoinRequest rethrows when batch.commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Commit failed"));
    await expect(acceptJoinRequest("req-1", "clan-1", "user-B")).rejects.toThrow(
      "Commit failed"
    );
  });

  it("declineJoinRequest rethrows when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));
    await expect(declineJoinRequest("req-1")).rejects.toThrow("Update failed");
  });

  it("removeMember rethrows when batch.commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Commit failed"));
    await expect(removeMember("clan-1", "user-B")).rejects.toThrow("Commit failed");
  });

  it("promoteToModerator rethrows when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));
    await expect(promoteToModerator("clan-1", "user-B")).rejects.toThrow("Update failed");
  });

  it("demoteModerator rethrows when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));
    await expect(demoteModerator("clan-1", "user-B")).rejects.toThrow("Update failed");
  });

  it("promoteToCoLeader rethrows when batch.commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Commit failed"));
    await expect(promoteToCoLeader("clan-1", "user-B")).rejects.toThrow("Commit failed");
  });

  it("demoteCoLeader rethrows when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));
    await expect(demoteCoLeader("clan-1", "user-B")).rejects.toThrow("Update failed");
  });

  it("transferLeadership rethrows when batch.commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Commit failed"));
    await expect(transferLeadership("clan-1", "leader-uid", "user-B")).rejects.toThrow(
      "Commit failed"
    );
  });

  it("postAnnouncement rethrows when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));
    await expect(postAnnouncement("clan-1", "Alex", "text")).rejects.toThrow("Update failed");
  });

  it("updateClanDetails rethrows when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));
    await expect(updateClanDetails("clan-1", { name: "New Name" })).rejects.toThrow(
      "Update failed"
    );
  });

  it("disbandClan rethrows when batch.commit fails", async () => {
    // first call: clan doc read
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ memberIds: ["leader-uid"] }),
    });
    // join requests query
    mockGetDocs.mockResolvedValueOnce({ docs: [], forEach: () => {} });
    mockCommit.mockRejectedValueOnce(new Error("Delete failed"));
    await expect(disbandClan("clan-1")).rejects.toThrow("Delete failed");
  });
});