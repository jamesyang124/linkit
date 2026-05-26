"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";

type SettingsState = { error?: string; success?: string; field?: string } | null;

export async function updateNameAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 1 || name.length > 60) {
    return { error: "Name must be between 1 and 60 characters." };
  }

  const db = createDb(
    process.env.DATABASE_URL ?? "postgres://linkit:linkit@localhost:55432/linkit"
  );
  const store = createPostgresLinkitStore(db);

  try {
    await store.updateName({ userId: session.user.id, name });
    return { success: "Name updated." };
  } catch {
    return { error: "Could not update name. Try again." };
  }
}

export async function changePasswordAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters.", field: "newPassword" };
  }

  const db = createDb(
    process.env.DATABASE_URL ?? "postgres://linkit:linkit@localhost:55432/linkit"
  );
  const store = createPostgresLinkitStore(db);
  const currentHash = await store.findUserPasswordHash(session.user.id);

  if (!currentHash) {
    return { error: "Password change not available for this account." };
  }

  const matches = await bcrypt.compare(currentPassword, currentHash);
  if (!matches) {
    return { error: "Current password is incorrect.", field: "currentPassword" };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await store.updatePasswordHash({
    userId: session.user.id,
    currentPasswordHash: currentHash,
    newPasswordHash: newHash
  });

  return { success: "Password changed." };
}
