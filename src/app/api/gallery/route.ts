import { NextResponse } from "next/server";

import { createDb } from "@/db/client";
import { createPostgresLinkitStore } from "@/db/linkit-store";
import {
  getProviderFeedPageFromStore,
  getGalleryFeedPageFromStore,
  normalizePageLimit,
  defaultGalleryPageSize
} from "@/feed/load-feed";
import { InvalidPostCursorError } from "@/feed/keyset";
import {
  getCachedGalleryFirstPage,
  setCachedGalleryFirstPage
} from "@/server/redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const cursor = url.searchParams.get("cursor");
  const limit = normalizePageLimit(Number(url.searchParams.get("limit")));

  // Serve first-page requests from Redis when available.
  // Subsequent pages (cursor present) always hit the DB — they're keyset-based
  // and can't be pre-warmed without knowing all cursor values in advance.
  const isFirstPage = !cursor && limit === defaultGalleryPageSize;
  if (isFirstPage) {
    const cached = await getCachedGalleryFirstPage(provider);
    if (cached) return NextResponse.json(cached);
  }

  const store = createPostgresLinkitStore(createDb(databaseUrl));

  try {
    let page;
    if (provider) {
      page = await getProviderFeedPageFromStore(store, provider, { cursor, limit });
    } else {
      page = await getGalleryFeedPageFromStore(store, { cursor, limit });
    }

    if (isFirstPage) {
      await setCachedGalleryFirstPage(provider, page);
    }

    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof InvalidPostCursorError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
