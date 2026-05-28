import type { LinkitComment, LinkitPost } from "@/src/domain/linkit";

export type FeedComment = {
  id: string;
  postId: string;
  body: string;
  authorName: string;
};

export type CommentCard = {
  id: string;
  postId: string;
  body: string;
  authorName: string;
  authorId: string;
  replyToUserName: string | null;
  replyCount: number;
  parentId: string | null;
  createdAt: Date;
};

export type FeedItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  profileThumbnailUrl: string | null;
  providerName: string;
  tags: string[];
  commentsCount: number;
  clickCount: number;
  href: string;
  comments: FeedComment[];
};

export function toFeedItems(
  posts: LinkitPost[],
  comments: LinkitComment[] = []
): FeedItem[] {
  const commentsByPostId = new Map<string, FeedComment[]>();

  for (const comment of comments) {
    const feedComment: FeedComment = {
      id: comment.id,
      postId: comment.postId,
      body: comment.body,
      authorName: comment.user.name ?? "Anonymous"
    };
    const existing = commentsByPostId.get(comment.postId) ?? [];
    commentsByPostId.set(comment.postId, [...existing, feedComment]);
  }

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    thumbnailUrl: post.thumbnailUrl,
    profileThumbnailUrl: post.profileThumbnailUrl,
    providerName: post.providerName,
    tags: post.tags ?? [],
    commentsCount: post.commentsCount,
    clickCount: post.clickCount,
    href: `/r/${post.id}`,
    comments: commentsByPostId.get(post.id) ?? []
  }));
}

export function toCommentCard(comment: LinkitComment): CommentCard {
  return {
    id: comment.id,
    postId: comment.postId,
    body: comment.body,
    authorName: comment.user.name ?? "Anonymous",
    authorId: comment.user.id,
    replyToUserName: comment.replyToUserName,
    replyCount: comment.replyCount,
    parentId: comment.parentId,
    createdAt: comment.createdAt
  };
}
