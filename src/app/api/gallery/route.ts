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
import { getCachedGalleryPage, setCachedGalleryPage } from "@/server/redis";

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

  // Only cache standard-size pages — non-standard limits are rare and shouldn't
  // pollute the cache with entries the warmer never writes.
  const isCacheable = limit === defaultGalleryPageSize;

  if (isCacheable) {
    const cached = await getCachedGalleryPage(provider, cursor);
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

    if (isCacheable) {
      await setCachedGalleryPage(provider, cursor, page);
    }

    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof InvalidPostCursorError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
