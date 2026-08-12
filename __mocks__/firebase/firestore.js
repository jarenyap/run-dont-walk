const fn = () => ({});
const mockFn = jest.fn(() => ({}));

module.exports = {
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db, _col, id) => ({ id: id ?? "mock-id" })),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),

  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  addDoc: jest.fn().mockResolvedValue({ id: "mock-id" }),
  deleteDoc: jest.fn().mockResolvedValue(undefined),

  onSnapshot: jest.fn(() => jest.fn()),

  arrayUnion: jest.fn((val) => ({ __type: "arrayUnion", val })),
  arrayRemove: jest.fn((val) => ({ __type: "arrayRemove", val })),
  increment: jest.fn((n) => ({ __type: "increment", n })),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),

  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
};