import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

import { registerUser, type RegisterPort } from "@/src/server/register";

function makePort(existingEmails: string[] = []): RegisterPort {
  const rows: { id: string; email: string; passwordHash: string }[] =
    existingEmails.map((e, i) => ({
      id: `existing-${i}`,
      email: e,
      passwordHash: "irrelevant"
    }));

  return {
    async findByEmail(email) {
      return rows.find((r) => r.email === email) ?? null;
    },
    async create({ email, name: _name, passwordHash }) {
      const user = { id: `new-${rows.length}`, email, passwordHash };
      rows.push(user);
      return { id: user.id };
    }
  };
}

describe("registerUser", () => {
  it("rejects blank email", async () => {
    const result = await registerUser(makePort(), {
      email: "  ",
      password: "secret"
    });
    expect(result).toEqual({
      ok: false,
      message: "Email and password are required."
    });
  });

  it("rejects blank password", async () => {
    const result = await registerUser(makePort(), {
      email: "user@example.com",
      password: ""
    });
    expect(result).toEqual({
      ok: false,
      message: "Email and password are required."
    });
  });

  it("rejects invalid email", async () => {
    const result = await registerUser(makePort(), {
      email: "not-an-email",
      password: "secret"
    });
    expect(result).toEqual({
      ok: false,
      message: "Enter a valid email address."
    });
  });

  it("rejects short passwords", async () => {
    const result = await registerUser(makePort(), {
      email: "user@example.com",
      password: "short"
    });
    expect(result).toEqual({
      ok: false,
      message: "Password must be at least 8 characters."
    });
  });

  it("rejects duplicate email", async () => {
    const result = await registerUser(makePort(["taken@example.com"]), {
      email: "taken@example.com",
      password: "password"
    });
    expect(result).toEqual({
      ok: false,
      message: "An account with that email already exists."
    });
  });

  it("normalizes email to lowercase before duplicate check", async () => {
    const result = await registerUser(makePort(["taken@example.com"]), {
      email: "TAKEN@EXAMPLE.COM",
      password: "password"
    });
    expect(result.ok).toBe(false);
  });

  it("creates user and returns userId on success", async () => {
    const port = makePort();
    const result = await registerUser(port, {
      name: "Ada",
      email: "ada@example.com",
      password: "hunter22"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBeTruthy();
    }
  });

  it("stores a bcrypt hash, not plaintext password", async () => {
    let capturedHash = "";
    const port: RegisterPort = {
      async findByEmail() {
        return null;
      },
      async create({ passwordHash }) {
        capturedHash = passwordHash;
        return { id: "new-1" };
      }
    };

    await registerUser(port, { email: "hash@example.com", password: "mypassword" });

    expect(capturedHash).not.toBe("mypassword");
    await expect(bcrypt.compare("mypassword", capturedHash)).resolves.toBe(true);
  });
});
