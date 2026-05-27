import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import { users } from "@/src/db/schema";
import { toFeedItems } from "@/src/feed/view-model";
import { SavedGallery } from "@/components/saved-gallery";
import { ProfileForms } from "./forms";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const databaseUrl =
    process.env.DATABASE_URL ?? "postgres://linkit:linkit@localhost:55432/linkit";
  const db = createDb(databaseUrl);

  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const currentName = row?.name ?? null;

  const store = createPostgresLinkitStore(db);
  const savedPosts = await store.listSavedPosts(session.user.id).catch(() => []);
  const savedItems = toFeedItems(savedPosts);

  return (
    <main className="site-shell min-h-screen px-5 py-10 md:px-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-10 font-display text-2xl font-light tracking-wide">Profile</h1>
        <ProfileForms currentName={currentName} />
      </div>

      <section className="saved-section">
        <h2 className="saved-section-heading">Saved</h2>
        <SavedGallery initialItems={savedItems} />
      </section>
    </main>
  );
}
