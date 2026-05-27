import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ savedIds: [] });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ savedIds: [] });
  }

  const store = createPostgresLinkitStore(createDb(databaseUrl));
  const savedIds = await store.listSavedPostIds(session.user.id);
  return NextResponse.json({ savedIds });
}
