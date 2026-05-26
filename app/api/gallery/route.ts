import { NextResponse } from "next/server";

import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import {
  getGalleryFeedPageFromStore,
  normalizePageLimit
} from "@/src/feed/load-feed";
import { InvalidPostCursorError } from "@/src/feed/keyset";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = normalizePageLimit(Number(url.searchParams.get("limit")));
  const store = createPostgresLinkitStore(createDb(databaseUrl));

  try {
    return NextResponse.json(
      await getGalleryFeedPageFromStore(store, { cursor, limit })
    );
  } catch (error) {
    if (error instanceof InvalidPostCursorError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
