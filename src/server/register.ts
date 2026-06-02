import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import type { LinkitDb } from "@/db/client";
import { users } from "@/db/schema";

export interface RegisterPort {
  findByEmail(email: string): Promise<{ id: string } | null>;
  create(data: {
    email: string;
    name: string | null;
    passwordHash: string;
  }): Promise<{ id: string }>;
}

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; message: string; field?: string };

export async function registerUser(
  port: RegisterPort,
  input: { name?: string; email: string; password: string }
): Promise<RegisterResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name?.trim() || null;

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address.", field: "email" };
  }

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters.", field: "password" };
  }

  const existing = await port.findByEmail(email);
  if (existing) {
    return { ok: false, message: "An account with that email already exists.", field: "email" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await port.create({ email, name, passwordHash });

  return { ok: true, userId: user.id };
}

export function createRegisterPort(db: LinkitDb): RegisterPort {
  return {
    async findByEmail(email) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return user ?? null;
    },
    async create({ email, name, passwordHash }) {
      const [user] = await db
        .insert(users)
        .values({ email, name, passwordHash })
        .returning({ id: users.id });
      if (!user) throw new Error("Insert returned no rows");
      return user;
    }
  };
}
