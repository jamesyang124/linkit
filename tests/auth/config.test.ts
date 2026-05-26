import { describe, expect, it } from "vitest";

import { buildAuthConfig, facebookProviders } from "@/src/auth/config";
import { createDb } from "@/src/db/client";

describe("auth config", () => {
  it("uses JWT sessions and credentials by default", () => {
    const config = buildAuthConfig(createDb("postgres://test:test@localhost/test"), {
      AUTH_SECRET: "test-secret"
    });

    expect(config.session).toEqual({ strategy: "jwt" });
    expect(config.secret).toBe("test-secret");
    expect(config.providers).toHaveLength(1);
  });

  it("adds Facebook only when provider credentials are configured", () => {
    expect(facebookProviders({})).toEqual([]);
    expect(
      facebookProviders({
        AUTH_FACEBOOK_ID: "facebook-id",
        AUTH_FACEBOOK_SECRET: "facebook-secret"
      })
    ).toHaveLength(1);
  });
});
