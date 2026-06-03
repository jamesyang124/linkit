import { describe, expect, it } from "vitest";

import { authorizeRevalidation } from "@/server/revalidate";

describe("cache revalidation authorization", () => {
  it("rejects when no server secret is configured", () => {
    expect(
      authorizeRevalidation({
        configuredSecret: undefined,
        providedSecret: "provided-secret"
      })
    ).toEqual({ ok: false, status: 503, message: "Revalidation is not configured." });
  });

  it("rejects missing request secret", () => {
    expect(
      authorizeRevalidation({
        configuredSecret: "configured-secret",
        providedSecret: null
      })
    ).toEqual({ ok: false, status: 401, message: "Missing revalidation secret." });
  });

  it("rejects mismatched request secret", () => {
    expect(
      authorizeRevalidation({
        configuredSecret: "configured-secret",
        providedSecret: "wrong-secret"
      })
    ).toEqual({ ok: false, status: 403, message: "Invalid revalidation secret." });
  });

  it("accepts matching request secret", () => {
    expect(
      authorizeRevalidation({
        configuredSecret: "configured-secret",
        providedSecret: "configured-secret"
      })
    ).toEqual({ ok: true });
  });
});
