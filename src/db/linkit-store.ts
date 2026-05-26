import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";

import { comments, posts, users } from "@/src/db/schema";
import {
  PostNotFoundError,
  type CreateStoredCommentInput,
  type CreateStoredPostInput,
  type LinkitComment,
  type LinkitPostPage,
  type LinkitPost,
  type LinkitStore,
  type LinkitUser,
  type UpdateUsernameInput,
  type UpdatePasswordInput
} from "@/src/domain/linkit";
import type { LinkitDb } from "@/src/db/client";

type PostWithUserRow = {
  post: typeof posts.$inferSelect;
  user: typeof users.$inferSelect;
};

type CommentWithUserRow = {
  comment: typeof comments.$inferSelect;
  user: typeof users.$inferSelect;
};

export function createPostgresLinkitStore(db: LinkitDb): LinkitStore {
  return {
    async createPost(input) {
      await upsertUser(db, input.user);

      const [post] = await db
        .insert(posts)
        .values({
          userId: input.user.id,
          title: input.title,
          body: input.body,
          link: input.link,
          thumbnailUrl: input.thumbnailUrl,
          providerName: input.providerName
        })
        .returning();

      return mapPostWithUser({ post, user: mapDomainUserToDbUser(input.user) });
    },

    async findPostById(id) {
      const [row] = await db
        .select({ post: posts, user: users })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.id, id))
        .limit(1);

      return row ? mapPostWithUser(row) : null;
    },

    async findPostByLink(link) {
      const [row] = await db
        .select({ post: posts, user: users })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.link, link))
        .limit(1);

      return row ? mapPostWithUser(row) : null;
    },

    async incrementPostClickCount(id) {
      const [updatedPost] = await db
        .update(posts)
        .set({
          clickCount: sql`${posts.clickCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, id))
        .returning();

      if (!updatedPost) {
        throw new PostNotFoundError(id);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, updatedPost.userId))
        .limit(1);

      return mapPostWithUser({ post: updatedPost, user });
    },

    async updatePostMetadata(input) {
      const [updatedPost] = await db
        .update(posts)
        .set({
          title: input.title,
          body: input.body,
          providerName: input.providerName,
          thumbnailUrl: input.thumbnailUrl,
          ...(input.profileThumbnailUrl !== undefined && { profileThumbnailUrl: input.profileThumbnailUrl }),
          updatedAt: new Date()
        })
        .where(eq(posts.id, input.postId))
        .returning();

      if (!updatedPost) {
        throw new PostNotFoundError(input.postId);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, updatedPost.userId))
        .limit(1);

      return mapPostWithUser({ post: updatedPost, user });
    },

    async incrementPostCommentsCount(id) {
      const [updatedPost] = await db
        .update(posts)
        .set({
          commentsCount: sql`${posts.commentsCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, id))
        .returning();

      if (!updatedPost) {
        throw new PostNotFoundError(id);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, updatedPost.userId))
        .limit(1);

      return mapPostWithUser({ post: updatedPost, user });
    },

    async createComment(input) {
      await upsertUser(db, input.user);

      const [comment] = await db
        .insert(comments)
        .values({
          postId: input.postId,
          userId: input.user.id,
          body: input.body,
          parentId: input.parentId ?? null,
          replyToUserName: input.replyToUserName ?? null
        })
        .returning();

      if (input.parentId) {
        await db
          .update(comments)
          .set({ replyCount: sql`${comments.replyCount} + 1` })
          .where(eq(comments.id, input.parentId));
      }

      return mapCommentWithUser({ comment, user: mapDomainUserToDbUser(input.user) });
    },

    async listPosts() {
      const rows = await db
        .select({ post: posts, user: users })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt), desc(posts.id));

      return rows.map(mapPostWithUser);
    },

    async listPostsByProvider(providerName) {
      const rows = await db
        .select({ post: posts, user: users })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.providerName, providerName))
        .orderBy(desc(posts.createdAt), desc(posts.id));

      return rows.map(mapPostWithUser);
    },

    async listProviderGroups() {
      const rows = await db
        .select({
          providerName: posts.providerName,
          count: sql<number>`cast(count(*) as int)`
        })
        .from(posts)
        .groupBy(posts.providerName)
        .orderBy(asc(posts.providerName));

      return rows.map((r) => ({ providerName: r.providerName, count: r.count }));
    },

    async listPostsPage(input) {
      const pageLimit = Math.max(1, input.limit);
      const filters = [];

      if (input.thumbnailsOnly) {
        filters.push(isNotNull(posts.thumbnailUrl));
      }

      if (input.cursor) {
        const { providerName, createdAt, id } = input.cursor;
        filters.push(
          or(
            sql`${posts.providerName} > ${providerName}`,
            and(
              eq(posts.providerName, providerName),
              or(
                lt(posts.createdAt, createdAt),
                and(eq(posts.createdAt, createdAt), lt(posts.id, id))
              )
            )
          )
        );
      }

      const rows = await db
        .select({ post: posts, user: users })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(asc(posts.providerName), desc(posts.createdAt), desc(posts.id))
        .limit(pageLimit + 1);

      const pageRows = rows.slice(0, pageLimit);
      const hasNextPage = rows.length > pageLimit;
      const lastPageRow = pageRows[pageRows.length - 1] ?? null;

      return {
        posts: pageRows.map(mapPostWithUser),
        nextCursor: hasNextPage && lastPageRow
          ? {
              providerName: lastPageRow.post.providerName,
              createdAt: lastPageRow.post.createdAt,
              id: lastPageRow.post.id
            }
          : null
      } satisfies LinkitPostPage;
    },

    async listCommentsForPosts(postIds) {
      if (postIds.length === 0) {
        return [];
      }

      const rows = await db
        .select({ comment: comments, user: users })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(inArray(comments.postId, postIds))
        .orderBy(asc(comments.createdAt));

      return rows.map(mapCommentWithUser);
    },

    async listTopLevelComments(postId) {
      const rows = await db
        .select({ comment: comments, user: users })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
        .orderBy(desc(comments.createdAt));

      return rows.map(mapCommentWithUser);
    },

    async listRepliesForComment(commentId) {
      const rows = await db
        .select({ comment: comments, user: users })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.parentId, commentId))
        .orderBy(asc(comments.createdAt));

      return rows.map(mapCommentWithUser);
    },

    async updateUsername({ userId, username }: UpdateUsernameInput) {
      await db
        .update(users)
        .set({ username, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },

    async findUserPasswordHash(userId) {
      const [row] = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return row?.passwordHash ?? null;
    },

    async updatePasswordHash({ userId, newPasswordHash }: UpdatePasswordInput) {
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
  };
}

export function mapPostWithUser(row: PostWithUserRow): LinkitPost {
  return {
    id: row.post.id,
    legacyId: row.post.legacyId,
    title: row.post.title,
    body: row.post.body,
    link: row.post.link,
    thumbnailUrl: row.post.thumbnailUrl,
    profileThumbnailUrl: row.post.profileThumbnailUrl ?? null,
    providerName: row.post.providerName,
    clickCount: row.post.clickCount,
    commentsCount: row.post.commentsCount,
    user: mapDbUser(row.user),
    createdAt: row.post.createdAt,
    updatedAt: row.post.updatedAt
  };
}

export function mapCommentWithUser(row: CommentWithUserRow): LinkitComment {
  return {
    id: row.comment.id,
    legacyId: row.comment.legacyId,
    postId: row.comment.postId,
    body: row.comment.body,
    parentId: row.comment.parentId,
    replyToUserName: row.comment.replyToUserName,
    replyCount: row.comment.replyCount,
    user: mapDbUser(row.user),
    createdAt: row.comment.createdAt,
    updatedAt: row.comment.updatedAt
  };
}

function mapDbUser(user: typeof users.$inferSelect): LinkitUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    username: user.username ?? null,
    imageUrl: user.image
  };
}

function mapDomainUserToDbUser(user: LinkitUser): typeof users.$inferSelect {
  const now = new Date();

  return {
    id: user.id,
    legacyId: null,
    name: user.name,
    email: user.email,
    emailVerified: null,
    image: user.imageUrl,
    passwordHash: null,
    username: user.username ?? null,
    createdAt: now,
    updatedAt: now
  };
}

async function upsertUser(db: LinkitDb, user: LinkitUser) {
  await db
    .insert(users)
    .values({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.imageUrl,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: user.name,
        email: user.email,
        image: user.imageUrl,
        updatedAt: new Date()
      }
    });
}
