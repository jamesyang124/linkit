import { Suspense } from "react";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { GalleryThumb } from "@/components/gallery-thumb";
import { CommentSection } from "@/components/comment-section";
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import { getProfileFeedItemFromStore } from "@/src/feed/load-feed";

export const revalidate = 60;

export default async function ProfilePage({
  params
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const databaseUrl = process.env.DATABASE_URL;

  const store = databaseUrl
    ? createPostgresLinkitStore(createDb(databaseUrl))
    : null;

  const post = store
    ? await getProfileFeedItemFromStore(store, postId)
    : null;

  if (!post) {
    notFound();
  }

  return (
    <main className="profile-page px-5 py-6 md:px-8">
      <article className="profile-pin" data-testid="profile-pin">
        <section className="profile-image" data-testid="profile-image">
          <GalleryThumb
            thumbnailUrl={post.profileThumbnailUrl ?? post.thumbnailUrl}
            providerName={post.providerName}
          />
        </section>
        <section className="profile-detail" data-testid="profile-detail">
          <div className="profile-actions">
            <BackButton />
            <a href={post.href} className="visit-button">Visit →</a>
          </div>
          <p className="profile-source">{post.providerName}</p>
          <h1>{post.title}</h1>
          <p className="profile-body">
            Saved as part of the Linkit visual catalogue. Open the source,
            review the response, or add a note for the next pass.
          </p>
          <dl>
            <div>
              <dt>Comments</dt>
              <dd>{post.commentsCount}</dd>
            </div>
            <div>
              <dt>Visits</dt>
              <dd data-testid="profile-visits">{post.clickCount}</dd>
            </div>
          </dl>
          <div className="profile-comments">
            <h2>Comments</h2>
            <Suspense fallback={<p className="comment-loading">Loading comments…</p>}>
              <CommentSection postId={postId} />
            </Suspense>
          </div>
        </section>
        <aside className="profile-related" aria-hidden="true">
          <span />
          <span />
          <span />
        </aside>
      </article>
    </main>
  );
}
