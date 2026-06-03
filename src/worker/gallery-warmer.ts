import type { LinkitStore } from "@/domain/linkit";
import {
  getGalleryFeedPageFromStore,
  getProviderFeedPageFromStore,
  defaultGalleryPageSize,
  type FeedItemsPage
} from "@/feed/load-feed";
import { setCachedGalleryPage } from "@/server/redis";

// Walk the full cursor chain for a single feed (global or per-provider) and
// store every page in Redis. Serial iteration is required because each page's
// cursor is only known after fetching the previous one.
export async function warmFeedPages(
  fetchPage: (cursor: string | null) => Promise<FeedItemsPage>,
  provider: string | null
): Promise<void> {
  let cursor: string | null = null;
  do {
    const page = await fetchPage(cursor);
    await setCachedGalleryPage(provider, cursor, page);
    cursor = page.nextCursor;
  } while (cursor !== null);
}

export async function warmGalleryCache(store: LinkitStore): Promise<void> {
  const providers = await store.listProviders();

  await Promise.all([
    warmFeedPages(
      (cursor) => getGalleryFeedPageFromStore(store, { limit: defaultGalleryPageSize, cursor }),
      null
    ),
    ...providers.map((p) =>
      warmFeedPages(
        (cursor) =>
          getProviderFeedPageFromStore(store, p.providerName, {
            limit: defaultGalleryPageSize,
            cursor
          }),
        p.providerName
      )
    )
  ]);
}
