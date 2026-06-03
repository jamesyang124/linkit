import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { authorizeRevalidation } from "@/server/revalidate";

export async function POST(request: Request) {
  const authorization = authorizeRevalidation({
    configuredSecret: process.env.REVALIDATE_SECRET,
    providedSecret: request.headers.get("x-linkit-revalidate-secret")
  });

  if (!authorization.ok) {
    return NextResponse.json(
      { ok: false, message: authorization.message },
      { status: authorization.status }
    );
  }

  revalidateTag("public-feed", "max");
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    revalidated: ["public-feed", "/"]
  });
}
