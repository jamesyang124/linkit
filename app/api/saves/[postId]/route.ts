import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  const store = createPostgresLinkitStore(createDb(databaseUrl));
  await store.savePost(session.user.id, postId);
  return NextResponse.json({ saved: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  const store = createPostgresLinkitStore(createDb(databaseUrl));
  await store.unsavePost(session.user.id, postId);
  return NextResponse.json({ saved: false });
}
