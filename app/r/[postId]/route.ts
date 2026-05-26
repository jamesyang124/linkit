import { notFound, redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

import { createRuntimeStore } from "@/src/server/runtime";
import { registerPostRedirect } from "@/src/server/posts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const redirectUrl = await registerPostRedirect(postId, createRuntimeStore());

  if (!redirectUrl) {
    notFound();
  }

  revalidateTag("public-feed", "max");
  revalidatePath("/");
  revalidatePath("/p/[postId]", "page");
  redirect(redirectUrl);
}
