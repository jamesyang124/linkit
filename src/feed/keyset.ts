import type { PostPageCursor } from "@/domain/linkit";

type CursorPayload = {
  providerName: string;
  createdAt: string;
  id: string;
};

export function encodePostCursor(cursor: PostPageCursor): string {
  return Buffer.from(
    JSON.stringify({
      providerName: cursor.providerName,
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id
    } satisfies CursorPayload),
    "utf8"
  ).toString("base64url");
}

export function decodePostCursor(cursor: string): PostPageCursor {
  let payload: CursorPayload;

  try {
    payload = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as CursorPayload;
  } catch {
    throw new InvalidPostCursorError();
  }

  if (
    typeof payload.id !== "string" ||
    typeof payload.createdAt !== "string" ||
    typeof payload.providerName !== "string"
  ) {
    throw new InvalidPostCursorError();
  }

  const createdAt = new Date(payload.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw new InvalidPostCursorError();
  }

  return { providerName: payload.providerName, createdAt, id: payload.id };
}

export class InvalidPostCursorError extends Error {
  constructor() {
    super("Invalid gallery cursor.");
    this.name = "InvalidPostCursorError";
  }
}
