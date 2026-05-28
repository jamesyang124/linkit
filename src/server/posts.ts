import type { LinkitJob, LinkitStore, LinkitUser, PostMetadataProvider } from "@/src/domain/linkit";
import { createLinkitService } from "@/src/domain/linkit";

export type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type SubmitLinkResult =
  | {
      ok: true;
      postId: string;
    }
  | {
      ok: false;
      reason: "unauthenticated" | "invalid";
      message: string;
    };

export type SubmitCommentResult =
  | {
      ok: true;
      commentId: string;
    }
  | {
      ok: false;
      reason: "unauthenticated" | "invalid";
      message: string;
    };

export type SubmitLinkDeps = {
  store: LinkitStore;
  enqueue: (job: LinkitJob) => Promise<void>;
  revalidateFeed: () => void;
  metadataProvider?: PostMetadataProvider;
};

export type SubmitCommentDeps = SubmitLinkDeps;

export async function submitLinkFromForm(
  formData: FormData,
  sessionUser: SessionUser | null | undefined,
  deps: SubmitLinkDeps
): Promise<SubmitLinkResult> {
  const user = toLinkitUser(sessionUser);
  if (!user) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "Sign in before sharing a link."
    };
  }

  const link = String(formData.get("link") ?? "");
  const tagsRaw = formData.get("tags");
  const tags = tagsRaw ? String(tagsRaw).split(",").filter(Boolean) : [];
  const service = createLinkitService({
    store: deps.store,
    enqueue: deps.enqueue,
    metadataProvider: deps.metadataProvider
  });

  try {
    const post = await service.submitLink({ link, user, tags });
    deps.revalidateFeed();
    return {
      ok: true,
      postId: post.id
    };
  } catch (error) {
    return {
      ok: false,
      reason: "invalid",
      message: error instanceof Error ? error.message : "Unable to share link."
    };
  }
}

export async function registerPostRedirect(
  postId: string,
  store: LinkitStore
): Promise<string | null> {
  const service = createLinkitService({
    store,
    enqueue: async () => {}
  });

  try {
    return await service.registerRedirect(postId);
  } catch {
    return null;
  }
}

export async function submitCommentFromForm(
  formData: FormData,
  sessionUser: SessionUser | null | undefined,
  deps: SubmitCommentDeps
): Promise<SubmitCommentResult> {
  const user = toLinkitUser(sessionUser);
  if (!user) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "Sign in before commenting."
    };
  }

  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("comment") ?? "");
  const parentId = formData.get("parentId") as string | null;
  const replyToUserName = formData.get("replyToUserName") as string | null;
  const service = createLinkitService({
    store: deps.store,
    enqueue: deps.enqueue
  });

  try {
    const comment = await service.addComment({
      postId,
      body,
      user,
      parentId: parentId || null,
      replyToUserName: replyToUserName || null
    });
    deps.revalidateFeed();
    return {
      ok: true,
      commentId: comment.id
    };
  } catch (error) {
    return {
      ok: false,
      reason: "invalid",
      message:
        error instanceof Error ? error.message : "Unable to save comment."
    };
  }
}

function toLinkitUser(sessionUser: SessionUser | null | undefined): LinkitUser | null {
  if (!sessionUser?.id || !sessionUser.email) {
    return null;
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name ?? sessionUser.email,
    imageUrl: sessionUser.image ?? null
  };
}
