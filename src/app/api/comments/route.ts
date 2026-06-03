import { NextRequest, NextResponse } from "next/server";

import { createDb } from "@/db/client";
import { createPostgresLinkitStore } from "@/db/linkit-store";
import {
  getCachedTopLevelComments,
  setCachedTopLevelComments
} from "@/server/redis";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const cached = await getCachedTopLevelComments(postId);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "x-cache": "HIT" }
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json([], { headers: { "x-cache": "MISS" } });
  }

  const store = createPostgresLinkitStore(createDb(databaseUrl));
  const commentsList = await store.listTopLevelComments(postId);

  await setCachedTopLevelComments(postId, commentsList);

  return NextResponse.json(commentsList, {
    headers: { "x-cache": "MISS" }
  });
}
