export type LinkitUser = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
};

export type LinkitPost = {
  id: string;
  legacyId: number | null;
  title: string;
  body: string | null;
  link: string;
  thumbnailUrl: string | null;
  profileThumbnailUrl: string | null;
  providerName: string;
  clickCount: number;
  commentsCount: number;
  user: LinkitUser;
  createdAt: Date;
  updatedAt: Date;
};

export type LinkitComment = {
  id: string;
  legacyId: number | null;
  postId: string;
  body: string;
  parentId: string | null;
  replyToUserName: string | null;
  replyCount: number;
  user: LinkitUser;
  createdAt: Date;
  updatedAt: Date;
};

export type LinkitJob =
  | {
      type: "link.enrich";
      payload: {
        postId: string;
        link: string;
      };
    }
  | {
      type: "image.process";
      payload: {
        postId: string;
        thumbnailUrl: string;
      };
    }
  | {
      type: "comment.notify";
      payload: {
        postId: string;
        commentId: string;
      };
    };

export type UpdateNameInput = {
  userId: string;
  name: string;
};

export type UpdatePasswordInput = {
  userId: string;
  currentPasswordHash: string;
  newPasswordHash: string;
};

export type LinkitStore = {
  createPost(input: CreateStoredPostInput): Promise<LinkitPost>;
  findPostById(id: string): Promise<LinkitPost | null>;
  findPostByLink(link: string): Promise<LinkitPost | null>;
  updatePostMetadata(input: UpdatePostMetadataInput): Promise<LinkitPost>;
  incrementPostClickCount(id: string): Promise<LinkitPost>;
  incrementPostCommentsCount(id: string): Promise<LinkitPost>;
  createComment(input: CreateStoredCommentInput): Promise<LinkitComment>;
  listPosts(): Promise<LinkitPost[]>;
  listPostsPage(input: ListPostsPageInput): Promise<LinkitPostPage>;
  listPostsByProvider(providerName: string): Promise<LinkitPost[]>;
  listProviderGroups(): Promise<{ providerName: string; count: number }[]>;
  listCommentsForPosts(postIds: string[]): Promise<LinkitComment[]>;
  listTopLevelComments(postId: string): Promise<LinkitComment[]>;
  listRepliesForComment(commentId: string): Promise<LinkitComment[]>;
  updateName(input: UpdateNameInput): Promise<void>;
  findUserPasswordHash(userId: string): Promise<string | null>;
  updatePasswordHash(input: UpdatePasswordInput): Promise<void>;
};

export type PostPageCursor = {
  providerName: string;
  createdAt: Date;
  id: string;
};

export type ListPostsPageInput = {
  limit: number;
  cursor?: PostPageCursor | null;
  thumbnailsOnly?: boolean;
};

export type LinkitPostPage = {
  posts: LinkitPost[];
  nextCursor: PostPageCursor | null;
};

export type CreateStoredPostInput = {
  link: string;
  title: string;
  body: string | null;
  providerName: string;
  thumbnailUrl: string | null;
  user: LinkitUser;
};

export type CreateStoredCommentInput = {
  postId: string;
  body: string;
  user: LinkitUser;
  parentId?: string | null;
  replyToUserName?: string | null;
};

export type UpdatePostMetadataInput = {
  postId: string;
  title: string;
  body: string | null;
  providerName: string;
  thumbnailUrl: string | null;
  profileThumbnailUrl?: string | null;
};

export type PostMetadataProvider = {
  fetch(link: string): Promise<{
    title: string;
    description: string | null;
    providerName: string;
    thumbnailUrl: string | null;
  }>;
};

export type CreateLinkitServiceInput = {
  store: LinkitStore;
  enqueue: (job: LinkitJob) => Promise<void>;
  metadataProvider?: PostMetadataProvider;
};

export class BlankLinkError extends Error {
  constructor() {
    super("Link is required.");
    this.name = "BlankLinkError";
  }
}

export class DuplicateLinkError extends Error {
  constructor(link: string) {
    super(`Link has already been shared: ${link}`);
    this.name = "DuplicateLinkError";
  }
}

export class BlankCommentError extends Error {
  constructor() {
    super("Comment is required.");
    this.name = "BlankCommentError";
  }
}

export class PostNotFoundError extends Error {
  constructor(postId: string) {
    super(`Post not found: ${postId}`);
    this.name = "PostNotFoundError";
  }
}

export function createLinkitService({ store, enqueue, metadataProvider }: CreateLinkitServiceInput) {
  return {
    async submitLink(input: { link: string; user: LinkitUser }): Promise<LinkitPost> {
      const link = normalizeLink(input.link);
      if (link.length === 0) {
        throw new BlankLinkError();
      }

      const existingPost = await store.findPostByLink(link);
      if (existingPost) {
        throw new DuplicateLinkError(link);
      }

      let title: string;
      let body: string | null;
      let providerName: string;
      let thumbnailUrl: string | null;

      if (metadataProvider) {
        try {
          const metadata = await metadataProvider.fetch(link);
          title = metadata.title;
          body = metadata.description;
          providerName = metadata.providerName;
          thumbnailUrl = metadata.thumbnailUrl;
        } catch {
          const hostname = new URL(link).hostname;
          title = hostname;
          body = null;
          providerName = hostname;
          thumbnailUrl = null;
        }
      } else {
        const hostname = new URL(link).hostname;
        title = hostname;
        body = null;
        providerName = hostname;
        thumbnailUrl = null;
      }

      const post = await store.createPost({
        link,
        title,
        body,
        providerName,
        thumbnailUrl,
        user: input.user
      });

      if (!metadataProvider) {
        await enqueue({
          type: "link.enrich",
          payload: { postId: post.id, link }
        });
      } else if (thumbnailUrl) {
        await enqueue({
          type: "image.process",
          payload: { postId: post.id, thumbnailUrl }
        });
      }

      return post;
    },

    async addComment(input: {
      postId: string;
      body: string;
      user: LinkitUser;
      parentId?: string | null;
      replyToUserName?: string | null;
    }): Promise<LinkitComment> {
      const body = input.body.trim();
      if (body.length === 0) {
        throw new BlankCommentError();
      }

      const post = await store.findPostById(input.postId);
      if (!post) {
        throw new PostNotFoundError(input.postId);
      }

      const comment = await store.createComment({
        postId: input.postId,
        body,
        user: input.user,
        parentId: input.parentId,
        replyToUserName: input.replyToUserName
      });
      await store.incrementPostCommentsCount(input.postId);

      await enqueue({
        type: "comment.notify",
        payload: {
          postId: input.postId,
          commentId: comment.id
        }
      });

      return comment;
    },

    async registerRedirect(postId: string): Promise<string> {
      const post = await store.findPostById(postId);
      if (!post) {
        throw new PostNotFoundError(postId);
      }

      const updatedPost = await store.incrementPostClickCount(postId);
      return updatedPost.link;
    }
  };
}

export function createMemoryLinkitStore(): LinkitStore {
  const posts = new Map<string, LinkitPost>();
  const comments = new Map<string, LinkitComment>();
  let nextPostId = 1;
  let nextCommentId = 1;

  return {
    async createPost(input) {
      const now = new Date();
      const post: LinkitPost = {
        id: `post-${nextPostId++}`,
        legacyId: null,
        title: input.title,
        body: input.body,
        link: input.link,
        thumbnailUrl: input.thumbnailUrl,
        profileThumbnailUrl: null,
        providerName: input.providerName,
        clickCount: 0,
        commentsCount: 0,
        user: input.user,
        createdAt: now,
        updatedAt: now
      };
      posts.set(post.id, post);
      return post;
    },

    async findPostById(id) {
      return posts.get(id) ?? null;
    },

    async findPostByLink(link) {
      for (const post of posts.values()) {
        if (post.link === link) {
          return post;
        }
      }
      return null;
    },

    async incrementPostClickCount(id) {
      const post = requirePost(posts, id);
      const updatedPost = {
        ...post,
        clickCount: post.clickCount + 1,
        updatedAt: new Date()
      };
      posts.set(id, updatedPost);
      return updatedPost;
    },

    async updatePostMetadata(input) {
      const post = requirePost(posts, input.postId);
      const updatedPost = {
        ...post,
        title: input.title,
        body: input.body,
        providerName: input.providerName,
        thumbnailUrl: input.thumbnailUrl,
        profileThumbnailUrl: input.profileThumbnailUrl ?? post.profileThumbnailUrl,
        updatedAt: new Date()
      };
      posts.set(input.postId, updatedPost);
      return updatedPost;
    },

    async incrementPostCommentsCount(id) {
      const post = requirePost(posts, id);
      const updatedPost = {
        ...post,
        commentsCount: post.commentsCount + 1,
        updatedAt: new Date()
      };
      posts.set(id, updatedPost);
      return updatedPost;
    },

    async createComment(input) {
      const now = new Date();
      const id = `comment-${nextCommentId++}`;

      if (input.parentId) {
        const parent = comments.get(input.parentId);
        if (parent) {
          comments.set(input.parentId, {
            ...parent,
            replyCount: parent.replyCount + 1,
            updatedAt: now
          });
        }
      }

      const comment: LinkitComment = {
        id,
        legacyId: null,
        postId: input.postId,
        body: input.body,
        parentId: input.parentId ?? null,
        replyToUserName: input.replyToUserName ?? null,
        replyCount: 0,
        user: input.user,
        createdAt: now,
        updatedAt: now
      };
      comments.set(comment.id, comment);
      return comment;
    },

    async listPosts() {
      return [...posts.values()].sort(
        comparePostsForKeyset
      );
    },

    async listPostsByProvider(providerName) {
      return [...posts.values()]
        .filter((p) => p.providerName === providerName)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async listProviderGroups() {
      const map = new Map<string, number>();
      for (const post of posts.values()) {
        map.set(post.providerName, (map.get(post.providerName) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([providerName, count]) => ({ providerName, count }))
        .sort((a, b) => a.providerName.localeCompare(b.providerName));
    },

    async listPostsPage(input) {
      const sortedPosts = [...posts.values()]
        .filter((post) => !input.thumbnailsOnly || post.thumbnailUrl !== null)
        .filter((post) => !input.cursor || isAfterCursor(post, input.cursor))
        .sort(comparePostsForKeyset);
      const pagePosts = sortedPosts.slice(0, input.limit);
      const hasNextPage = sortedPosts.length > input.limit;
      const lastPagePost = pagePosts[pagePosts.length - 1] ?? null;

      return {
        posts: pagePosts,
        nextCursor: hasNextPage && lastPagePost
          ? {
              providerName: lastPagePost.providerName,
              createdAt: lastPagePost.createdAt,
              id: lastPagePost.id
            }
          : null
      };
    },

    async listCommentsForPosts(postIds) {
      const postIdSet = new Set(postIds);
      return [...comments.values()]
        .filter((comment) => postIdSet.has(comment.postId))
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    },

    async listTopLevelComments(postId) {
      return [...comments.values()]
        .filter((c) => c.postId === postId && c.parentId === null)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    async listRepliesForComment(commentId) {
      return [...comments.values()]
        .filter((c) => c.parentId === commentId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    async updateName() {},
    async findUserPasswordHash() { return null; },
    async updatePasswordHash() {}
  };
}

function normalizeLink(link: string): string {
  return link.trim();
}

function requirePost(posts: Map<string, LinkitPost>, postId: string): LinkitPost {
  const post = posts.get(postId);
  if (!post) {
    throw new PostNotFoundError(postId);
  }
  return post;
}

function comparePostsForKeyset(left: LinkitPost, right: LinkitPost): number {
  const providerDiff = left.providerName.localeCompare(right.providerName);
  if (providerDiff !== 0) return providerDiff;
  const timeDiff = right.createdAt.getTime() - left.createdAt.getTime();
  if (timeDiff !== 0) return timeDiff;
  return right.id.localeCompare(left.id);
}

function isAfterCursor(post: LinkitPost, cursor: PostPageCursor): boolean {
  const providerCmp = post.providerName.localeCompare(cursor.providerName);
  if (providerCmp > 0) return true;
  if (providerCmp < 0) return false;
  const postTime = post.createdAt.getTime();
  const cursorTime = cursor.createdAt.getTime();
  return postTime < cursorTime || (postTime === cursorTime && post.id < cursor.id);
}
