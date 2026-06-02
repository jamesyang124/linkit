import type { LinkitJob, LinkitStore } from "@/domain/linkit";
import type { LinkMetadataProvider } from "@/metadata/provider";
import type { ImageProcessingOptions, ImageUploader } from "@/images/uploader";
import {
  buildCommentNotification,
  type Mailer
} from "@/notifications/comment";

export type WorkerDeps = {
  store: Pick<
    LinkitStore,
    "findPostById" | "listCommentsForPosts" | "updatePostMetadata"
  >;
  metadataProvider: LinkMetadataProvider;
  imageUploader: ImageUploader;
  imageProcessing?: ImageProcessingOptions;
  mailer: Mailer;
  enqueue: (job: LinkitJob) => Promise<void>;
  appUrl: string;
};

const defaultImageProcessing: ImageProcessingOptions = {
  maxWidth: 736,
  quality: 72
};

const profileImageProcessing: ImageProcessingOptions = {
  maxWidth: 900,
  maxHeight: 1200,
  quality: 80
};

export async function handleJob(job: LinkitJob, deps: WorkerDeps): Promise<void> {
  switch (job.type) {
    case "link.enrich": {
      const metadata = await deps.metadataProvider.fetch(job.payload.link);
      await deps.store.updatePostMetadata({
        postId: job.payload.postId,
        title: metadata.title,
        body: metadata.description,
        providerName: metadata.providerName,
        thumbnailUrl: metadata.thumbnailUrl
      });
      if (metadata.thumbnailUrl) {
        await deps.enqueue({
          type: "image.process",
          payload: {
            postId: job.payload.postId,
            thumbnailUrl: metadata.thumbnailUrl
          }
        });
      }
      return;
    }
    case "image.process": {
      const post = await deps.store.findPostById(job.payload.postId);
      if (!post) {
        return;
      }

      const [standardResult, profileResult] = await Promise.allSettled([
        deps.imageUploader.uploadFromUrl(
          job.payload.thumbnailUrl,
          deps.imageProcessing ?? defaultImageProcessing
        ),
        deps.imageUploader.uploadFromUrl(
          job.payload.thumbnailUrl,
          profileImageProcessing
        )
      ]);

      await deps.store.updatePostMetadata({
        postId: post.id,
        title: post.title,
        body: post.body,
        providerName: post.providerName,
        thumbnailUrl: standardResult.status === "fulfilled"
          ? standardResult.value.secureUrl
          : post.thumbnailUrl,
        profileThumbnailUrl: profileResult.status === "fulfilled"
          ? profileResult.value.secureUrl
          : null
      });
      return;
    }
    case "comment.notify":
      const post = await deps.store.findPostById(job.payload.postId);
      if (!post) {
        return;
      }

      const comments = await deps.store.listCommentsForPosts([job.payload.postId]);
      const notification = buildCommentNotification({
        post,
        comments,
        commentId: job.payload.commentId,
        appUrl: deps.appUrl
      });

      if (notification) {
        await deps.mailer.send(notification);
      }
      return;
  }
}
