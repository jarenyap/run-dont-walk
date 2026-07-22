import { updateUserProfile, uploadAvatar, getUserProfile, getUserProfiles } from "../services/userService";

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
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

import { doc, updateDoc, getDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockRefFn = ref as jest.Mock;
const mockUploadBytes = uploadBytes as jest.Mock;
const mockGetDownloadURL = getDownloadURL as jest.Mock;

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

describe("uploadAvatar", () => {
  const originalXMLHttpRequest = globalThis.XMLHttpRequest;
  
  const mockXHRInstance = {
    open: jest.fn(),
    send: jest.fn(),
    responseType: "",
    onload: null as (() => void) | null,
    onerror: null as ((e: unknown) => void) | null,
    response: new Blob(["fake-image"], { type: "image/jpeg" }),
  };

  beforeAll(() => {
    globalThis.XMLHttpRequest = jest.fn(() => mockXHRInstance) as unknown as typeof XMLHttpRequest;
  });

  afterAll(() => {
    globalThis.XMLHttpRequest = originalXMLHttpRequest;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockXHRInstance.onload = null;
    mockXHRInstance.onerror = null;
    mockXHRInstance.send.mockImplementation(() => {
      mockXHRInstance.onload?.();
    });
  });

  it("calls uploadBytes with the correct storage ref and metadata", async () => {
    const mockRef = { fullPath: "profilePics/user-1.jpg" };
    mockRefFn.mockReturnValue(mockRef);
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue("https://storage.example.com/pic.jpg");

    await uploadAvatar("user-1", "file://local/image.jpg");

    expect(mockUploadBytes).toHaveBeenCalledWith(
      mockRef,
      expect.any(Blob),
      expect.objectContaining({ contentType: "image/jpeg" })
    );
  });

  it("returns the download URL from Firebase Storage", async () => {
    mockRefFn.mockReturnValue({});
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue("https://storage.example.com/avatar.jpg");

    const result = await uploadAvatar("user-1", "file://local/image.jpg");
    expect(result).toBe("https://storage.example.com/avatar.jpg");
  });

  it("uses the correct storage path profilePics/{userId}.jpg", async () => {
    mockRefFn.mockReturnValue({});
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue("https://example.com/pic.jpg");

    await uploadAvatar("user-XYZ", "file://local/image.jpg");
    expect(mockRefFn).toHaveBeenCalledWith(expect.anything(), "profilePics/user-XYZ.jpg");
  });

  it("throws when XHR network request fails", async () => {
    mockXHRInstance.send.mockImplementation(() => {
      mockXHRInstance.onerror?.(new Error("Network failure"));
    });

    await expect(uploadAvatar("user-1", "file://bad-uri")).rejects.toThrow(
      "Network request failed"
    );
  });

  it("opens the XHR GET request against the provided image URI", async () => {
    mockRefFn.mockReturnValue({});
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue("https://example.com/pic.jpg");

    await uploadAvatar("user-1", "file://local/image.jpg");
    expect(mockXHRInstance.open).toHaveBeenCalledWith("GET", "file://local/image.jpg", true);
  });
});

describe("getUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns UserProfile with id from snap.id when doc exists", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "user-1",
      data: () => ({ name: "Jaren", email: "jaren@test.com" }),
    });
    const result = await getUserProfile("user-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("user-1");
    expect(result!.name).toBe("Jaren");
  });

  it("returns null when doc does not exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getUserProfile("missing-user");
    expect(result).toBeNull();
  });

  it("rethrows on Firestore error", async () => {
    mockGetDoc.mockRejectedValue(new Error("Firestore error"));
    await expect(getUserProfile("user-1")).rejects.toThrow("Firestore error");
  });
});

describe("getUserProfiles", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty array when userIds is empty", async () => {
    const result = await getUserProfiles([]);
    expect(result).toEqual([]);
  });

  it("batches reads and returns profiles with correct ids", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: "user-1", data: () => ({ name: "Alice" }) },
        { id: "user-2", data: () => ({ name: "Bob" }) },
      ],
    });
    const result = await getUserProfiles(["user-1", "user-2"]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("user-1");
    expect(result[1].id).toBe("user-2");
  });

  it("rethrows on Firestore error", async () => {
    mockGetDocs.mockRejectedValue(new Error("Query failed"));
    await expect(getUserProfiles(["user-1"])).rejects.toThrow("Query failed");
  });
});