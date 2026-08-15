import { describe, it, expect } from "vitest";
import { isGmail, resolveSignUpFallbackError } from "./auth";
import { en } from "../../translations/en";
import { he } from "../../translations/he";

describe("isGmail", () => {
  it("accepts a gmail address whatever the casing or spacing", () => {
    expect(isGmail("someone@gmail.com")).toBe(true);
    expect(isGmail("  Someone@Gmail.com  ")).toBe(true);
  });

  it("rejects any other provider", () => {
    expect(isGmail("someone@hotmail.com")).toBe(false);
    expect(isGmail("someone@gmail.co.il")).toBe(false);
    expect(isGmail("")).toBe(false);
  });
});

describe("resolveSignUpFallbackError", () => {
  const t = en.home.authErrors;

  // The defect this closes: one form signs in and registers, so a failed
  // sign-in is retried as a registration. On a real account that retry comes
  // back "email already in use", and passing it through told a customer who
  // had merely mistyped her password that she should sign in instead.
  it("reports wrong credentials when the account already exists", () => {
    expect(resolveSignUpFallbackError("auth/email-already-in-use", t)).toBe(
      t.wrongPassword,
    );
  });

  it("never confirms that the address is registered", () => {
    for (const dict of [en, he]) {
      const message = resolveSignUpFallbackError(
        "auth/email-already-in-use",
        dict.home.authErrors,
      );

      expect(message).not.toBe(dict.home.authErrors.emailInUse);
    }
  });

  it("leaves a genuine registration failure to its own message", () => {
    expect(resolveSignUpFallbackError("auth/weak-password", t)).toBeNull();
    expect(resolveSignUpFallbackError("auth/invalid-email", t)).toBeNull();
    expect(resolveSignUpFallbackError("auth/too-many-requests", t)).toBeNull();
  });

  it("leaves a successful registration alone", () => {
    expect(resolveSignUpFallbackError(undefined, t)).toBeNull();
    expect(resolveSignUpFallbackError(null, t)).toBeNull();
  });
});

describe("password length wording", () => {
  // The form refuses anything under eight characters before Firebase is
  // reached, so a message quoting six would describe a rule that never runs.
  it("quotes the length the form actually enforces", () => {
    expect(en.home.authErrors.weakPassword).toContain("8");
    expect(he.home.authErrors.weakPassword).toContain("8");
    expect(en.home.authErrors.passwordTooShort).toContain("8");
    expect(he.home.authErrors.passwordTooShort).toContain("8");
  });
});
