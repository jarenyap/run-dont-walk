import { isFirestoreError } from "../utils/firestoreErrors";

describe("isFirestoreError", () => {
  it("returns true for an object with customData property", () => {
    const error = { customData: { serverResponse: "error details" } };
    expect(isFirestoreError(error)).toBe(true);
  });

  it("returns true for an object with customData set to undefined", () => {
    const error = { customData: undefined };
    expect(isFirestoreError(error)).toBe(true);
  });

  it("returns false for a plain Error object (no customData)", () => {
    expect(isFirestoreError(new Error("plain error"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isFirestoreError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isFirestoreError(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isFirestoreError("error string")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isFirestoreError(42)).toBe(false);
  });

  it("returns false for an empty object (no customData key)", () => {
    expect(isFirestoreError({})).toBe(false);
  });
});