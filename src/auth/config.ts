import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import { eq } from "drizzle-orm";

import {
  accounts,
  sessions,
  users,
  verificationTokens
} from "@/db/schema";
import type { LinkitDb } from "@/db/client";

export type AuthRuntimeEnv = {
  AUTH_SECRET?: string;
  AUTH_FACEBOOK_ID?: string;
  AUTH_FACEBOOK_SECRET?: string;
};

export function buildAuthConfig(
  db: LinkitDb,
  env: Partial<NodeJS.ProcessEnv> = process.env
): NextAuthConfig {
  return {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens
    }),
    session: {
      strategy: "jwt"
    },
    secret: env.AUTH_SECRET,
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        authorize: async (credentials) => {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");

          if (!email || !password) {
            return null;
          }

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user?.passwordHash) {
            return null;
          }

          const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!passwordMatches) {
            return null;
          }

          return {
            id: user.id,
            name: user.name ?? user.email,
            email: user.email,
            image: user.image
          };
        }
      }),
      ...facebookProviders(env)
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user?.id) {
          token.id = user.id;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user && token.id) {
          session.user.id = token.id as string;
        }
        return session;
      }
    }
  };
}

export function facebookProviders(env: Partial<NodeJS.ProcessEnv>) {
  if (!env.AUTH_FACEBOOK_ID || !env.AUTH_FACEBOOK_SECRET) {
    return [];
  }

  return [
    Facebook({
      clientId: env.AUTH_FACEBOOK_ID,
      clientSecret: env.AUTH_FACEBOOK_SECRET
    })
  ];
}
