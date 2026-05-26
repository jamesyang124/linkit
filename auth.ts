import NextAuth from "next-auth";

import { buildAuthConfig } from "@/src/auth/config";
import { createDb } from "@/src/db/client";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://linkit:linkit@localhost:55432/linkit";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth(
  buildAuthConfig(createDb(databaseUrl))
);
