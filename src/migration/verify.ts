export type LegacySnapshot = {
  users: Array<{
    id: number;
    email: string;
  }>;
  posts: Array<{
    id: number;
    link: string | null;
    comments_count: number | null;
    click_count: number | null;
  }>;
  comments: Array<{
    id: number;
    commentable_id: number | null;
    user_id: number | null;
  }>;
};

export type TargetSnapshot = {
  users: Array<{
    legacyId: number | null;
    email: string;
  }>;
  posts: Array<{
    legacyId: number | null;
    link: string;
    commentsCount: number;
    clickCount: number;
  }>;
  comments: Array<{
    legacyId: number | null;
    postLegacyId: number | null;
    userLegacyId: number | null;
  }>;
};

export type VerificationResult = {
  ok: boolean;
  checks: Array<{
    name: string;
    ok: boolean;
    message: string;
  }>;
};

export function verifyMigration(
  legacy: LegacySnapshot,
  target: TargetSnapshot
): VerificationResult {
  const checks = [
    compareCount("users row count", legacy.users.length, target.users.length),
    compareCount("posts row count", legacy.posts.length, target.posts.length),
    compareCount(
      "comments row count",
      legacy.comments.length,
      target.comments.length
    ),
    compareSet(
      "user legacy ids",
      legacy.users.map((user) => user.id),
      target.users.map((user) => user.legacyId)
    ),
    compareSet(
      "post legacy ids",
      legacy.posts.map((post) => post.id),
      target.posts.map((post) => post.legacyId)
    ),
    compareSet(
      "comment legacy ids",
      legacy.comments.map((comment) => comment.id),
      target.comments.map((comment) => comment.legacyId)
    ),
    compareSet(
      "user emails",
      legacy.users.map((user) => user.email),
      target.users.map((user) => user.email)
    ),
    compareSet(
      "post links",
      legacy.posts.map((post) => post.link).filter(isPresent),
      target.posts.map((post) => post.link)
    ),
    comparePostCounters(legacy, target),
    compareCommentRelationships(legacy, target)
  ];

  return {
    ok: checks.every((check) => check.ok),
    checks
  };
}

function compareCount(
  name: string,
  legacyCount: number,
  targetCount: number
): VerificationResult["checks"][number] {
  const ok = legacyCount === targetCount;
  return {
    name,
    ok,
    message: ok
      ? `${legacyCount} rows`
      : `legacy has ${legacyCount}, target has ${targetCount}`
  };
}

function compareSet<T extends string | number>(
  name: string,
  legacyValues: T[],
  targetValues: Array<T | null>
): VerificationResult["checks"][number] {
  const legacySet = new Set(legacyValues);
  const targetSet = new Set(targetValues.filter(isPresent));
  const missing = [...legacySet].filter((value) => !targetSet.has(value));
  const extra = [...targetSet].filter((value) => !legacySet.has(value));
  const ok = missing.length === 0 && extra.length === 0;

  return {
    name,
    ok,
    message: ok
      ? `${legacySet.size} values match`
      : `missing target values: ${missing.join(", ") || "none"}; extra target values: ${extra.join(", ") || "none"}`
  };
}

function comparePostCounters(
  legacy: LegacySnapshot,
  target: TargetSnapshot
): VerificationResult["checks"][number] {
  const targetByLegacyId = new Map(
    target.posts.map((post) => [post.legacyId, post])
  );
  const mismatches = legacy.posts.filter((post) => {
    const targetPost = targetByLegacyId.get(post.id);
    return (
      !targetPost ||
      targetPost.commentsCount !== (post.comments_count ?? 0) ||
      targetPost.clickCount !== (post.click_count ?? 0)
    );
  });

  return {
    name: "post counters",
    ok: mismatches.length === 0,
    message:
      mismatches.length === 0
        ? `${legacy.posts.length} post counters match`
        : `counter mismatch for legacy posts: ${mismatches.map((post) => post.id).join(", ")}`
  };
}

function compareCommentRelationships(
  legacy: LegacySnapshot,
  target: TargetSnapshot
): VerificationResult["checks"][number] {
  const targetByLegacyId = new Map(
    target.comments.map((comment) => [comment.legacyId, comment])
  );
  const mismatches = legacy.comments.filter((comment) => {
    const targetComment = targetByLegacyId.get(comment.id);
    return (
      !targetComment ||
      targetComment.postLegacyId !== comment.commentable_id ||
      targetComment.userLegacyId !== comment.user_id
    );
  });

  return {
    name: "comment relationships",
    ok: mismatches.length === 0,
    message:
      mismatches.length === 0
        ? `${legacy.comments.length} comment relationships match`
        : `relationship mismatch for legacy comments: ${mismatches.map((comment) => comment.id).join(", ")}`
  };
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
