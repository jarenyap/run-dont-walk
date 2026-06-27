import { getAuthErrorMessage } from "../utils/authErrors";

describe("getAuthErrorMessage", () => {
  it("returns friendly message for auth/user-not-found", () => {
    expect(getAuthErrorMessage("auth/user-not-found")).toBe(
      "Incorrect email or password. Please try again."
    );
  });

  it("returns friendly message for auth/wrong-password", () => {
    expect(getAuthErrorMessage("auth/wrong-password")).toBe(
      "Incorrect email or password. Please try again."
    );
  });

  it("returns friendly message for auth/invalid-credential", () => {
    expect(getAuthErrorMessage("auth/invalid-credential")).toBe(
      "Incorrect email or password. Please try again."
    );
  });

  it("returns friendly message for auth/invalid-email", () => {
    expect(getAuthErrorMessage("auth/invalid-email")).toBe(
      "Please enter a valid email address."
    );
  });

  it("returns friendly message for auth/user-disabled", () => {
    expect(getAuthErrorMessage("auth/user-disabled")).toBe(
      "This account has been disabled. Please contact support."
    );
  });

  it("returns friendly message for auth/email-already-in-use", () => {
    expect(getAuthErrorMessage("auth/email-already-in-use")).toBe(
      "An account with this email already exists. Try signing in."
    );
  });

  it("returns friendly message for auth/weak-password", () => {
    expect(getAuthErrorMessage("auth/weak-password")).toBe(
      "Password must be at least 6 characters."
    );
  });

  it("returns friendly message for auth/network-request-failed", () => {
    expect(getAuthErrorMessage("auth/network-request-failed")).toBe(
      "No internet connection. Please check your network."
    );
  });

  it("returns friendly message for auth/too-many-requests", () => {
    expect(getAuthErrorMessage("auth/too-many-requests")).toBe(
      "Too many attempts. Please wait a moment and try again."
    );
  });

  it("returns friendly message for auth/missing-email", () => {
    expect(getAuthErrorMessage("auth/missing-email")).toBe(
      "Please enter your email address."
    );
  });

  it("returns fallback message for an unknown error code", () => {
    expect(getAuthErrorMessage("auth/some-unknown-error")).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns fallback message for an empty string error code", () => {
    expect(getAuthErrorMessage("")).toBe("Something went wrong. Please try again.");
  });
});