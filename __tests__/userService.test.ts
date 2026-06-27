import { updateUserProfile } from "../services/userService";

jest.mock("../firebaseConfig", () => ({ db: {}, storage: {} }));
jest.mock("expo-file-system/legacy", () => ({}));
jest.mock("../utils/firestoreErrors", () => ({
  isFirestoreError: jest.fn(() => false),
}));
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db: any, _col: any, id: any) => ({ id })),
  updateDoc: jest.fn().mockResolvedValue(undefined),
}));

import { doc, updateDoc } from "firebase/firestore";

const mockDoc = doc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

describe("updateUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls updateDoc once", async () => {
    await updateUserProfile("user-A", { name: "Jaren Foo" });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it("sets nameLower when name is provided", async () => {
    await updateUserProfile("user-A", { name: "Jaren Foo" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ nameLower: "jaren foo" })
    );
  });

  it("converts name to lowercase for nameLower field", async () => {
    await updateUserProfile("user-A", { name: "UPPER CASE NAME" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ nameLower: "upper case name" })
    );
  });

  it("does NOT add nameLower when name is not in updates", async () => {
    await updateUserProfile("user-A", { bio: "Just running along" });
    const callArgs = mockUpdateDoc.mock.calls[0][1];
    expect(callArgs).not.toHaveProperty("nameLower");
  });

  it("updates bio field when provided", async () => {
    await updateUserProfile("user-A", { bio: "Running slow but steady" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ bio: "Running slow but steady" })
    );
  });

  it("does NOT include avatarUrl key when avatarUrl is undefined", async () => {
    await updateUserProfile("user-A", { name: "Jaren" });
    const callArgs = mockUpdateDoc.mock.calls[0][1];
    expect(callArgs).not.toHaveProperty("avatarUrl");
  });

  it("includes avatarUrl when explicitly provided", async () => {
    await updateUserProfile("user-A", { avatarUrl: "https://example.com/pic.jpg" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ avatarUrl: "https://example.com/pic.jpg" })
    );
  });

  it("targets the correct user document by userId", async () => {
    await updateUserProfile("user-XYZ", { bio: "test" });
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "users", "user-XYZ");
  });
});