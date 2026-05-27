import { getPublicGalleryFeedPage, getPublicProviderSummaries } from "@/src/feed/load-feed";
import { GalleryFeed } from "@/components/gallery-feed";
import { SubmitForm } from "@/components/submit-form";

export const revalidate = 60;

export default async function HomePage() {
  const [galleryPage, providers] = await Promise.all([
    getPublicGalleryFeedPage(),
    getPublicProviderSummaries()
  ]);

  return (
    <main className="infinite-page site-shell min-h-screen px-5 md:px-8">
      <section
        className="infinite-shell"
        data-testid="infinite-gallery"
        aria-labelledby="sources-heading"
      >
        <GalleryFeed
          initialItems={galleryPage.items}
          providers={providers}
        />
      </section>

      <section className="submit-dock" id="submit" data-testid="submit-dock">
        <SubmitForm />
      </section>
    </main>
  );
}
