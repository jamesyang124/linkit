"use server";

import { revalidateTag } from "next/cache";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { createRuntimeServices } from "@/src/server/runtime";
import { submitCommentFromForm, submitLinkFromForm } from "@/src/server/posts";
import { invalidateTopLevelComments } from "@/src/server/redis";

type ActionResult = { ok: boolean; message: string };

export async function submitLink(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  const services = await createRuntimeServices();

  try {
    const result = await submitLinkFromForm(formData, session?.user, {
      store: services.store,
      enqueue: services.enqueue,
      metadataProvider: services.metadataProvider,
      revalidateFeed: () => {
        revalidateTag("public-feed", "max");
        revalidatePath("/");
      }
    });

    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    return { ok: true, message: "Link posted." };
  } finally {
    await services.close();
  }
}

export async function submitComment(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  const postId = String(formData.get("postId") ?? "");
  const services = await createRuntimeServices();

  try {
    const result = await submitCommentFromForm(formData, session?.user, {
      store: services.store,
      enqueue: services.enqueue,
      revalidateFeed: () => {
        revalidateTag("public-feed", "max");
        revalidatePath("/");
        revalidatePath(`/p/${postId}`);
      }
    });

    if (!result.ok) {
      return { ok: false, message: result.message };
    }
  } finally {
    await services.close();
  }

  await invalidateTopLevelComments(postId);
  return { ok: true, message: "Comment posted." };
}
