import { getPublicGalleryFeedPage, getPublicProviderSummaries } from "@/src/feed/load-feed";
import { GalleryFeed } from "@/components/gallery-feed";

export const revalidate = 60;

export default async function HomePage() {
  const [galleryPage, providers] = await Promise.all([
    getPublicGalleryFeedPage(),
    getPublicProviderSummaries()
  ]);

  return (
    <main className="infinite-page site-shell min-h-screen px-0 md:px-8">
      <section
        className="infinite-shell"
        data-testid="infinite-gallery"
        aria-labelledby="sources-heading"
      >
        <GalleryFeed
          initialItems={galleryPage.items}
          initialNextCursor={galleryPage.nextCursor}
          providers={providers}
        />
      </section>
    </main>
  );
}
