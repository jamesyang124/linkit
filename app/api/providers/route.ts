import { NextResponse } from "next/server";

import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json([]);
  }

  try {
    const store = createPostgresLinkitStore(createDb(databaseUrl));
    const groups = await store.listProviderGroups();
    return NextResponse.json(groups);
  } catch {
    return NextResponse.json([]);
  }
}
