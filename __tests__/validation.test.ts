import { validatePassword, validateEmail } from "../utils/validation";

describe("validatePassword", () => {
  it("returns null for a valid password meeting all requirements", () => {
    expect(validatePassword("Secure1!")).toBeNull();
  });

  it("returns error if password is shorter than 6 characters", () => {
    expect(validatePassword("Ab1!")).toBe("Password must be at least 6 characters.");
  });

  it("returns error if password has no uppercase letter", () => {
    expect(validatePassword("secure1!")).toBe(
      "Password must contain at least one uppercase letter."
    );
  });

  it("returns error if password has no number", () => {
    expect(validatePassword("SecurePass!")).toBe(
      "Password must contain at least one number."
    );
  });

  it("returns error if password has no special character", () => {
    expect(validatePassword("Secure123")).toBe(
      "Password must contain a special character (!@#$%^&*)."
    );
  });

  it("validates passwords with each allowed special character", () => {
    const specials = ["!", "@", "#", "$", "%", "^", "&", "*"];
    specials.forEach((char) => {
      expect(validatePassword(`Secure1${char}`)).toBeNull();
    });
  });

  it("returns length error first before checking other rules (short password)", () => {
    expect(validatePassword("Ab1!")).toBe("Password must be at least 6 characters.");
  });

  it("accepts a long complex password", () => {
    expect(validatePassword("MySuper$ecureP4ssword!")).toBeNull();
  });
});

describe("validateEmail", () => {
  it("returns true for a valid email address", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("returns true for email with subdomain", () => {
    expect(validateEmail("user@mail.example.com")).toBe(true);
  });

  it("returns true for NUS email format", () => {
    expect(validateEmail("e1234567@u.nus.edu")).toBe(true);
  });

  it("returns false for email missing @ symbol", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("returns false for email missing domain", () => {
    expect(validateEmail("user@")).toBe(false);
  });

  it("returns false for email missing local part", () => {
    expect(validateEmail("@example.com")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateEmail("")).toBe(false);
  });

  it("returns false for email with spaces", () => {
    expect(validateEmail("user @example.com")).toBe(false);
  });
});