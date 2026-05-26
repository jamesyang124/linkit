import { getPublicGalleryFeedPage, getPublicProviderGroups } from "@/src/feed/load-feed";
import { GalleryFeed } from "@/components/gallery-feed";
import { SubmitForm } from "@/components/submit-form";

export const revalidate = 60;

export default async function HomePage() {
  const [galleryPage, allProviders] = await Promise.all([
    getPublicGalleryFeedPage(),
    getPublicProviderGroups()
  ]);

  return (
    <main className="infinite-page site-shell min-h-screen px-5 md:px-8">
      <div
        className="selection-word"
        data-testid="selection-word"
        aria-hidden="true"
      >
        Catalogue
      </div>
      <section
        className="infinite-shell"
        data-testid="infinite-gallery"
        aria-labelledby="catalogue-heading"
      >
        <GalleryFeed
          initialItems={galleryPage.items}
          initialCursor={galleryPage.nextCursor}
          allProviders={allProviders}
        />
      </section>

      <section className="submit-dock" id="submit" data-testid="submit-dock">
        <SubmitForm />
      </section>
    </main>
  );
}
