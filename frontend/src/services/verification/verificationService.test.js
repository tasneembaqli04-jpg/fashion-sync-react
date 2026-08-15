import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Firestore and the mailer are replaced with in-memory stand-ins so the
// timing rules can be exercised directly.
const store = new Map();
const sent = [];

vi.mock("../../firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, _collection, id) => ({ id })),
  getDoc: vi.fn(async (ref) => {
    const data = store.get(ref.id);
    return { exists: () => data !== undefined, data: () => data };
  }),
  setDoc: vi.fn(async (ref, payload, options) => {
    store.set(
      ref.id,
      options?.merge ? { ...store.get(ref.id), ...payload } : payload
    );
  }),
}));

vi.mock("../email/emailService", () => ({
  sendVerificationCodeEmail: vi.fn(async (args) => {
    sent.push(args);
    return { success: true };
  }),
}));

const {
  createAndSendVerificationCode,
  resendVerificationCode,
  verifyCode,
  isEmailVerified,
  CODE_TTL_MS,
  CODE_TTL_MINUTES,
  PREVIOUS_CODE_GRACE_MS,
  MAX_SENDS_PER_WINDOW,
  SEND_WINDOW_MS,
} = await import("./verificationService");

const EMAIL = "dana@example.com";
const codeOf = (email = EMAIL) => store.get(email).code;

beforeEach(() => {
  store.clear();
  sent.length = 0;
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the three timings and how they relate", () => {
  it("gives the code five minutes", () => {
    expect(CODE_TTL_MS).toBe(5 * 60 * 1000);
  });

  // The verification email states the lifetime, and takes the figure from
  // here rather than writing it into a template once per language.
  it("exposes the same lifetime in whole minutes for the email wording", () => {
    expect(CODE_TTL_MINUTES).toBe(5);
    expect(CODE_TTL_MINUTES * 60000).toBe(CODE_TTL_MS);
  });

  it("keeps a replaced code recognisable for one minute", () => {
    expect(PREVIOUS_CODE_GRACE_MS).toBe(60 * 1000);
  });

  // The ordering is the point: the spam-folder hint has to arrive while the
  // code still works, and after the resend button is usable again.
  it("orders cooldown below the hint below the code lifetime", () => {
    const cooldownMs = 60 * 1000;
    const hintMs = 180 * 1000;

    expect(cooldownMs).toBeLessThan(hintMs);
    expect(hintMs).toBeLessThan(CODE_TTL_MS);
  });

  // The hint sends the customer to her spam folder, so there has to be a
  // usable stretch of time left after it appears.
  it("leaves time to act on the hint before the code dies", () => {
    const hintMs = 180 * 1000;
    expect(CODE_TTL_MS - hintMs).toBeGreaterThanOrEqual(2 * 60 * 1000);
  });
});

describe("createAndSendVerificationCode", () => {
  it("stores a six digit code and emails it", async () => {
    await createAndSendVerificationCode(EMAIL, "דנה", "he");

    expect(codeOf()).toMatch(/^\d{6}$/);
    expect(sent).toHaveLength(1);
    expect(sent[0].toEmail).toBe(EMAIL);
    expect(sent[0].code).toBe(codeOf());
  });

  // Every other email in the system passes the language through; this one
  // used to drop it, so a verification email always arrived in one language.
  it("passes the interface language to the mailer", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "en");
    expect(sent[0].lang).toBe("en");
  });

  it("passes the language through a resend as well", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "en");
    await resendVerificationCode(EMAIL, "Dana", "en");
    expect(sent[1].lang).toBe("en");
  });

  it("lowercases and trims the address", async () => {
    await createAndSendVerificationCode("  DANA@Example.COM  ", "Dana", "he");
    expect(store.has(EMAIL)).toBe(true);
  });

  it("sets the expiry five minutes out", async () => {
    const before = Date.now();
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const { expiresAt } = store.get(EMAIL);

    expect(expiresAt).toBeGreaterThanOrEqual(before + CODE_TTL_MS);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + CODE_TTL_MS);
  });
});

describe("verifyCode", () => {
  it("accepts the current code", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");

    await expect(verifyCode(EMAIL, codeOf())).resolves.toEqual({ ok: true });
    expect(store.get(EMAIL).verified).toBe(true);
  });

  it("tolerates surrounding whitespace", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    await expect(verifyCode(EMAIL, `  ${codeOf()}  `)).resolves.toEqual({ ok: true });
  });

  it("reports a wrong code as a mismatch", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const wrong = codeOf() === "000000" ? "111111" : "000000";

    await expect(verifyCode(EMAIL, wrong)).resolves.toEqual({
      ok: false,
      reason: "mismatch",
    });
  });

  it("reports an unknown address as notFound", async () => {
    await expect(verifyCode("nobody@example.com", "123456")).resolves.toEqual({
      ok: false,
      reason: "notFound",
    });
  });

  it("reports the correct code as expired once the window passes", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const code = codeOf();

    store.set(EMAIL, { ...store.get(EMAIL), expiresAt: Date.now() - 1 });

    await expect(verifyCode(EMAIL, code)).resolves.toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("does not mark an expired attempt as verified", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const code = codeOf();
    store.set(EMAIL, { ...store.get(EMAIL), expiresAt: Date.now() - 1 });

    await verifyCode(EMAIL, code);
    expect(store.get(EMAIL).verified).toBe(false);
  });
});

describe("a code that was replaced by a newer one", () => {
  // Requesting a second code while the first email is still in transit is
  // ordinary. The earlier code came back as simply "wrong", which reads as a
  // typing mistake rather than as "that one has been replaced".
  it("is reported as superseded, not as a mismatch", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const firstCode = codeOf();

    await resendVerificationCode(EMAIL, "Dana", "he");
    const secondCode = codeOf();

    expect(secondCode).not.toBe(firstCode);
    await expect(verifyCode(EMAIL, firstCode)).resolves.toEqual({
      ok: false,
      reason: "superseded",
    });
  });

  it("still accepts the newest code", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    await resendVerificationCode(EMAIL, "Dana", "he");

    await expect(verifyCode(EMAIL, codeOf())).resolves.toEqual({ ok: true });
  });

  it("stops recognising the replaced code after the grace minute", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const firstCode = codeOf();
    await resendVerificationCode(EMAIL, "Dana", "he");

    store.set(EMAIL, {
      ...store.get(EMAIL),
      previousCodeExpiresAt: Date.now() - 1,
    });

    await expect(verifyCode(EMAIL, firstCode)).resolves.toEqual({
      ok: false,
      reason: "mismatch",
    });
  });

  it("does not carry over a code that had already expired", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const firstCode = codeOf();

    store.set(EMAIL, { ...store.get(EMAIL), expiresAt: Date.now() - 1 });
    await resendVerificationCode(EMAIL, "Dana", "he");

    expect(store.get(EMAIL).previousCode).toBe("");
    await expect(verifyCode(EMAIL, firstCode)).resolves.toEqual({
      ok: false,
      reason: "mismatch",
    });
  });

  it("never holds more than one usable code", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    const first = codeOf();
    await resendVerificationCode(EMAIL, "Dana", "he");
    const second = codeOf();

    const firstResult = await verifyCode(EMAIL, first);
    expect(firstResult.ok).toBe(false);

    const secondResult = await verifyCode(EMAIL, second);
    expect(secondResult.ok).toBe(true);
  });
});

describe("send ceiling", () => {
  it("allows the first five sends", async () => {
    for (let i = 0; i < MAX_SENDS_PER_WINDOW; i++) {
      const result = await createAndSendVerificationCode(EMAIL, "Dana", "he");
      expect(result.ok).toBe(true);
    }
    expect(sent).toHaveLength(MAX_SENDS_PER_WINDOW);
  });

  it("refuses the sixth within the hour", async () => {
    for (let i = 0; i < MAX_SENDS_PER_WINDOW; i++) {
      await createAndSendVerificationCode(EMAIL, "Dana", "he");
    }

    const result = await createAndSendVerificationCode(EMAIL, "Dana", "he");

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("rateLimited");
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(sent).toHaveLength(MAX_SENDS_PER_WINDOW);
  });

  it("does not overwrite the live code when it refuses", async () => {
    for (let i = 0; i < MAX_SENDS_PER_WINDOW; i++) {
      await createAndSendVerificationCode(EMAIL, "Dana", "he");
    }
    const live = codeOf();

    await createAndSendVerificationCode(EMAIL, "Dana", "he");

    expect(codeOf()).toBe(live);
    await expect(verifyCode(EMAIL, live)).resolves.toEqual({ ok: true });
  });

  it("opens a fresh window once the hour has passed", async () => {
    for (let i = 0; i < MAX_SENDS_PER_WINDOW; i++) {
      await createAndSendVerificationCode(EMAIL, "Dana", "he");
    }

    store.set(EMAIL, {
      ...store.get(EMAIL),
      windowStartedAt: Date.now() - SEND_WINDOW_MS - 1,
    });

    const result = await createAndSendVerificationCode(EMAIL, "Dana", "he");

    expect(result.ok).toBe(true);
    expect(store.get(EMAIL).sendCount).toBe(1);
  });

  // The cooldown in the modal lives in component state and resets on every
  // page refresh; the counter is what survives one.
  it("counts across what would be separate page loads", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    await createAndSendVerificationCode(EMAIL, "Dana", "he");

    expect(store.get(EMAIL).sendCount).toBe(2);
  });
});

describe("isEmailVerified", () => {
  it("is false before the code is entered", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    await expect(isEmailVerified(EMAIL)).resolves.toBe(false);
  });

  it("is true once the code is accepted", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");
    await verifyCode(EMAIL, codeOf());

    await expect(isEmailVerified(EMAIL)).resolves.toBe(true);
  });

  // Accounts predating verification have no document, and must keep working.
  it("is true when no document exists", async () => {
    await expect(isEmailVerified("legacy@example.com")).resolves.toBe(true);
  });
});

describe("the email is told how long the code lasts", () => {
  it("sends the lifetime in minutes with the request", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");

    expect(sent[0].expiresInMinutes).toBe(CODE_TTL_MINUTES);
  });

  // The template used to state "one minute" in both languages while the code
  // actually lasted longer, because the figure was written into the wording.
  it("keeps the stated lifetime and the real one in step", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "he");

    const { expiresAt, createdAt } = store.get(EMAIL);
    const actualMinutes = (expiresAt - createdAt) / 60000;

    expect(sent[0].expiresInMinutes).toBe(actualMinutes);
  });

  it("sends it on a resend too", async () => {
    await createAndSendVerificationCode(EMAIL, "Dana", "en");
    await resendVerificationCode(EMAIL, "Dana", "en");

    expect(sent[1].expiresInMinutes).toBe(CODE_TTL_MINUTES);
  });
});
