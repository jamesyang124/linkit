import { NextRequest, NextResponse } from "next/server";

import { createDb } from "@/db/client";
import { createPostgresLinkitStore } from "@/db/linkit-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json([]);
  }

  const store = createPostgresLinkitStore(createDb(databaseUrl));
  const replies = await store.listRepliesForComment(commentId);

  return NextResponse.json(replies);
}
