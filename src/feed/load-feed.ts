import { unstable_cache } from "next/cache";

import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import type { LinkitStore, ProviderSummary } from "@/src/domain/linkit";
import { toFeedItems, type FeedItem } from "@/src/feed/view-model";
import {
  decodePostCursor,
  encodePostCursor
} from "@/src/feed/keyset";

export const defaultGalleryPageSize = 30;

export type FeedItemsPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

export async function getFeedItemsFromStore(
  store: Pick<LinkitStore, "listPosts" | "listCommentsForPosts">
): Promise<FeedItem[]> {
  const posts = await store.listPosts();
  const comments = await store.listCommentsForPosts(posts.map((post) => post.id));
  return toFeedItems(posts, comments);
}

export async function getFeedItemsWithFallback(
  store: Pick<LinkitStore, "listPosts" | "listCommentsForPosts">
): Promise<FeedItem[]> {
  try {
    return await getFeedItemsFromStore(store);
  } catch (error) {
    console.error("Failed to load public feed", error);
    return [];
  }
}

export async function getGalleryFeedPageFromStore(
  store: Pick<LinkitStore, "listPostsPage" | "listCommentsForPosts">,
  input: { limit?: number; cursor?: string | null } = {}
): Promise<FeedItemsPage> {
  const page = await store.listPostsPage({
    limit: normalizePageLimit(input.limit),
    cursor: input.cursor ? decodePostCursor(input.cursor) : null,
    thumbnailsOnly: true
  });
  const comments = await store.listCommentsForPosts(page.posts.map((post) => post.id));

  return {
    items: toFeedItems(page.posts, comments),
    nextCursor: page.nextCursor ? encodePostCursor(page.nextCursor) : null
  };
}

export async function getProfileFeedItemFromStore(
  store: Pick<LinkitStore, "findPostById" | "listCommentsForPosts">,
  postId: string
): Promise<FeedItem | null> {
  const post = await store.findPostById(postId);
  if (!post) {
    return null;
  }

  const comments = await store.listCommentsForPosts([post.id]);
  return toFeedItems([post], comments)[0] ?? null;
}

export async function getGalleryFeedPageWithFallback(
  store: Pick<LinkitStore, "listPostsPage" | "listCommentsForPosts">,
  input: { limit?: number; cursor?: string | null } = {}
): Promise<FeedItemsPage> {
  try {
    return await getGalleryFeedPageFromStore(store, input);
  } catch (error) {
    console.error("Failed to load gallery feed page", error);
    return { items: [], nextCursor: null };
  }
}

export const getPublicCatalogueItems = unstable_cache(
  async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return [];
    }

    const store = createPostgresLinkitStore(createDb(databaseUrl));
    const items = await getFeedItemsWithFallback(store);
    return items.filter((item) => item.thumbnailUrl != null);
  },
  ["public-catalogue"],
  {
    revalidate: 60,
    tags: ["public-feed"]
  }
);

export const getPublicFeedItems = unstable_cache(
  async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return [];
    }

    const store = createPostgresLinkitStore(createDb(databaseUrl));
    return getFeedItemsWithFallback(store);
  },
  ["public-feed"],
  {
    revalidate: 60,
    tags: ["public-feed"]
  }
);

export const getPublicGalleryFeedPage = unstable_cache(
  async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { items: [], nextCursor: null };
    }

    const store = createPostgresLinkitStore(createDb(databaseUrl));
    return getGalleryFeedPageWithFallback(store, {
      limit: defaultGalleryPageSize
    });
  },
  ["public-gallery-feed"],
  {
    revalidate: 60,
    tags: ["public-feed"]
  }
);

export async function getProviderFeedPageFromStore(
  store: Pick<LinkitStore, "listPostsPage" | "listCommentsForPosts">,
  providerName: string,
  input: { limit?: number; cursor?: string | null } = {}
): Promise<FeedItemsPage> {
  const page = await store.listPostsPage({
    limit: normalizePageLimit(input.limit),
    cursor: input.cursor ? decodePostCursor(input.cursor) : null,
    thumbnailsOnly: true,
    providerFilter: providerName
  });
  const comments = await store.listCommentsForPosts(page.posts.map((p) => p.id));
  return {
    items: toFeedItems(page.posts, comments),
    nextCursor: page.nextCursor ? encodePostCursor(page.nextCursor) : null
  };
}

export const getPublicProviderSummaries = unstable_cache(
  async (): Promise<ProviderSummary[]> => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return [];

    const store = createPostgresLinkitStore(createDb(databaseUrl));
    try {
      return await store.listProviders();
    } catch (error) {
      console.error("Failed to load provider summaries", error);
      return [];
    }
  },
  ["public-provider-summaries"],
  { revalidate: 60, tags: ["public-feed"] }
);


export function normalizePageLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) {
    return defaultGalleryPageSize;
  }

  return Math.min(Math.max(Math.floor(limit), 1), 60);
}
