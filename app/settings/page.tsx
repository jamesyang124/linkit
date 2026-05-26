import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createDb } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { ProfileForms } from "./forms";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const db = createDb(
    process.env.DATABASE_URL ?? "postgres://linkit:linkit@localhost:55432/linkit"
  );
  const [row] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const currentUsername = row?.username ?? null;

  return (
    <main className="site-shell min-h-screen px-5 py-10 md:px-8">
      <h1 className="mb-10 font-display text-2xl font-light tracking-wide">Profile</h1>
      <ProfileForms currentUsername={currentUsername} />
    </main>
  );
}
