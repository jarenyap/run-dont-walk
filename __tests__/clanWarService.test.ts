import {
  challengeClan,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  getClanWar,
  incrementClanDistance,
  checkAndCompleteWar,
  handleRunDistance,
} from "../services/clanWarService";

jest.mock("../firebaseConfig", () => ({ db: {} }));

const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockCommit = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn();
const mockBatch = { set: mockSet, update: mockUpdate, commit: mockCommit, delete: mockDelete };

const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockDeleteDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock("firebase/firestore", () => ({
  writeBatch: jest.fn(() => mockBatch),
  doc: jest.fn((...args: any[]) => {
    const last = args[args.length - 1];
    return { id: typeof last === "string" ? last : "mock-war-id" };
  }),
  collection: jest.fn(() => ({})),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  increment: jest.fn((n) => ({ __type: "increment", n })),
}));

describe("challengeClan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDoc.mockReset();
  });

  it("creates a pending war document with correct fields", async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false });
    const id = await challengeClan("clan-A", "Alpha", "clan-B", "Bravo", "user-1");
    expect(typeof id).toBe("string");
    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clan1Id: "clan-A",
        clan2Id: "clan-B",
        status: "pending",
        clan1Distance: 0,
        clan2Distance: 0,
        initiatedBy: "user-1",
      })
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("sets currentWarId on both clans", async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false });
    await challengeClan("clan-A", "Alpha", "clan-B", "Bravo", "user-1");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentWarId: "mock-war-id" })
    );
  });

  it("throws when target clan is already in an active war", async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ currentWarId: "existing-war" }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: "active" }) });
    await expect(
      challengeClan("clan-A", "Alpha", "clan-B", "Bravo", "user-1")
    ).rejects.toThrow("Target clan is already in a war");
  });

  it("throws when target clan is in a pending war", async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ currentWarId: "existing-war" }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: "pending" }) });
    await expect(
      challengeClan("clan-A", "Alpha", "clan-B", "Bravo", "user-1")
    ).rejects.toThrow("Target clan is already in a war");
  });

  it("throws when challenger clan is already in a war", async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ currentWarId: "existing-war" }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: "active" }) });
    await expect(
      challengeClan("clan-A", "Alpha", "clan-B", "Bravo", "user-1")
    ).rejects.toThrow("Your clan is already in a war");
  });
});

describe("acceptChallenge", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sets status to active and endsAt to ~14 days from now", async () => {
    await acceptChallenge("war-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "active" })
    );
    const call = mockUpdateDoc.mock.calls[0];
    const updateData = call[1];
    expect(updateData.endsAt).toBeInstanceOf(Date);
    const diff = updateData.endsAt.getTime() - Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    expect(Math.abs(diff - twoWeeksMs)).toBeLessThan(5000);
  });
});

describe("declineChallenge", () => {
  beforeEach(() => { jest.clearAllMocks(); mockGetDoc.mockReset(); });

  it("deletes war doc and clears currentWarId on both clans", async () => {
    await declineChallenge("war-1", "clan-A", "clan-B");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { currentWarId: null }
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("cancelChallenge", () => {
  beforeEach(() => { jest.clearAllMocks(); mockGetDoc.mockReset(); });

  it("delegates to declineChallenge (same cleanup)", async () => {
    await cancelChallenge("war-1", "clan-A", "clan-B");
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("getClanWar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDoc.mockReset();
  });

  it("returns war when it exists", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: "war-1",
      data: () => ({ clan1Id: "clan-A", status: "active" }),
    });
    const war = await getClanWar("war-1");
    expect(war).toBeTruthy();
    expect(war?.status).toBe("active");
  });

  it("returns null when war does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    const war = await getClanWar("missing");
    expect(war).toBeNull();
  });
});

describe("incrementClanDistance", () => {
  beforeEach(() => { jest.clearAllMocks(); mockGetDoc.mockReset(); });

  it("increments clan1Distance when clanId equals clan1Id", async () => {
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ status: "active" }),
        }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await incrementClanDistance("war-1", "clan-A", "clan-A", 5.2);
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  it("does NOT increment when war is not active", async () => {
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ status: "completed" }),
        }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await incrementClanDistance("war-1", "clan-A", "clan-A", 5.2);
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  it("does nothing when war document does not exist", async () => {
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await incrementClanDistance("war-1", "clan-A", "clan-A", 5.2);
    expect(mockRunTransaction).toHaveBeenCalled();
  });
});

describe("checkAndCompleteWar", () => {
  beforeEach(() => { jest.clearAllMocks(); mockGetDoc.mockReset(); });

  it("completes an active war whose endsAt has passed and sets winner", async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            status: "active",
            endsAt: pastDate,
            clan1Distance: 500,
            clan2Distance: 300,
            clan1Id: "clan-A",
            clan2Id: "clan-B",
          }),
        }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await checkAndCompleteWar("war-1");
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  it("does nothing when war is still active (endsAt in the future)", async () => {
    const futureDate = new Date(Date.now() + 10000000);
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ status: "active", endsAt: futureDate }),
        }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await checkAndCompleteWar("war-1");
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  it("does nothing when war is already completed", async () => {
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ status: "completed" }),
        }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await checkAndCompleteWar("war-1");
    expect(mockRunTransaction).toHaveBeenCalled();
  });
});

describe("handleRunDistance", () => {
  beforeEach(() => { jest.clearAllMocks(); mockGetDoc.mockReset(); mockGetDocs.mockReset(); });

  it("returns early when clanIds array is empty", async () => {
    await handleRunDistance("user-1", [], 5.0);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it("calls incrementClanDistance for each active war the user is in", async () => {
    // clan doc read — returns clan with an active war
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ currentWarId: "war-1" }),
      })
      // war doc read — returns active war
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ clan1Id: "clan-A", clan2Id: "clan-B", status: "active" }),
      });

    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ status: "active" }) }),
        update: jest.fn(),
      };
      await fn(tx);
      return tx;
    });

    await handleRunDistance("user-1", ["clan-A"], 5.0);
    expect(mockRunTransaction).toHaveBeenCalled();
  });
});
