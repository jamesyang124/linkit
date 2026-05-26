import { describe, expect, it } from "vitest";

import { readEnv, validateProductionEnv } from "@/src/env";

const baseEnv = {
  DATABASE_URL: "postgres://linkit:linkit@localhost:55432/linkit",
  RABBITMQ_URL: "amqp://linkit:linkit@localhost:5673",
  APP_URL: "https://linkit.example.com",
  AUTH_SECRET: "a-production-secret-at-least-32-chars",
  REVALIDATE_SECRET: "a-revalidation-secret-at-least-32"
};

describe("environment contract", () => {
  it("normalizes blank optional provider values", () => {
    const env = readEnv({
      ...baseEnv,
      AUTH_FACEBOOK_ID: "",
      AUTH_FACEBOOK_SECRET: "",
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: ""
    });

    expect(env.AUTH_FACEBOOK_ID).toBeUndefined();
    expect(env.AUTH_FACEBOOK_SECRET).toBeUndefined();
    expect(env.CLOUDINARY_CLOUD_NAME).toBeUndefined();
    expect(env.CLOUDINARY_API_KEY).toBeUndefined();
    expect(env.CLOUDINARY_API_SECRET).toBeUndefined();
  });

  it("accepts a complete production configuration", () => {
    expect(() =>
      validateProductionEnv({
        ...baseEnv,
        MAILGUN_API_KEY: "mailgun-key",
        MAILGUN_DOMAIN: "mail.linkit.example.com",
        MAIL_FROM: "Linkit <notifications@linkit.example.com>"
      })
    ).not.toThrow();
  });

  it("rejects development auth secrets in production", () => {
    expect(() =>
      validateProductionEnv({
        ...baseEnv,
        AUTH_SECRET: "development-change-me"
      })
    ).toThrow(/AUTH_SECRET/);
  });

  it("rejects missing revalidation secret in production", () => {
    expect(() =>
      validateProductionEnv({
        ...baseEnv,
        REVALIDATE_SECRET: undefined
      })
    ).toThrow(/REVALIDATE_SECRET/);
  });

  it("rejects partial Facebook credentials", () => {
    expect(() =>
      validateProductionEnv({
        ...baseEnv,
        AUTH_FACEBOOK_ID: "facebook-id"
      })
    ).toThrow(/AUTH_FACEBOOK/);
  });

  it("rejects partial Cloudinary credentials", () => {
    expect(() =>
      validateProductionEnv({
        ...baseEnv,
        CLOUDINARY_CLOUD_NAME: "cloud-name",
        CLOUDINARY_API_KEY: "api-key"
      })
    ).toThrow(/CLOUDINARY/);
  });

  it("rejects incomplete Mailgun notification settings", () => {
    expect(() =>
      validateProductionEnv({
        ...baseEnv,
        MAILGUN_API_KEY: "mailgun-key",
        MAIL_FROM: "Linkit <notifications@linkit.example.com>"
      })
    ).toThrow(/MAILGUN/);
  });
});
