"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { createDb } from "@/db/client";
import { createRegisterPort, registerUser } from "@/server/register";

type AuthState = { error?: string; field?: string } | null;

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password.", field: "password" };
    }
    throw error;
  }
  return null;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgres://linkit:linkit@localhost:55432/linkit";
  const db = createDb(databaseUrl);
  const result = await registerUser(createRegisterPort(db), {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });
  if (!result.ok) return { error: result.message, field: result.field };
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirectTo: "/"
  });
}
