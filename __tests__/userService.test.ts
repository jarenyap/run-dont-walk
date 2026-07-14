import { updateUserProfile, uploadAvatar } from "../services/userService";

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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const mockDoc = doc as jest.Mock;
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