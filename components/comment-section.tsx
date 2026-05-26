"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from "react";

import { submitComment } from "@/app/actions";
import { showToast } from "@/components/toast";
import type { LinkitComment } from "@/src/domain/linkit";

type CommentCard = {
  id: string;
  postId: string;
  body: string;
  authorName: string;
  replyToUserName: string | null;
  replyCount: number;
  parentId: string | null;
  createdAt: Date;
};

function mapComment(c: LinkitComment): CommentCard {
  return {
    id: c.id,
    postId: c.postId,
    body: c.body,
    authorName:
      (c.user as { username?: string | null }).username ?? "Anonymous",
    replyToUserName: c.replyToUserName,
    replyCount: c.replyCount,
    parentId: c.parentId,
    createdAt: new Date(c.createdAt)
  };
}

const BATCH = 10;

function CommentItem({
  comment,
  postId
}: {
  comment: CommentCard;
  postId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<CommentCard[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleReplies() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/comments/${comment.id}/replies`);
      const data = (await res.json()) as LinkitComment[];
      setReplies(data.map(mapComment));
      setExpanded(true);
    });
  }

  function handleReplySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitComment(null, formData);
      if (result.ok) {
        showToast("Reply posted.", "success");
        form.reset();
        setShowReplyForm(false);
        const res = await fetch(`/api/comments/${comment.id}/replies`);
        const data = (await res.json()) as LinkitComment[];
        setReplies(data.map(mapComment));
        setExpanded(true);
      } else {
        showToast(result.message, "error");
      }
    });
  }

  return (
    <div className="comment-item" data-testid="comment-item">
      <div className="comment-meta">
        <span className="comment-author">{comment.authorName}</span>
      </div>
      <p className="comment-body">
        {comment.replyToUserName && (
          <span className="comment-mention">@{comment.replyToUserName} </span>
        )}
        {comment.body}
      </p>
      <div className="comment-actions">
        {comment.replyCount > 0 && (
          <button
            className="comment-replies-toggle"
            onClick={toggleReplies}
            disabled={isPending}
          >
            {isPending
              ? "…"
              : expanded
                ? "Hide replies"
                : `${comment.replyCount} ${comment.replyCount === 1 ? "reply" : "replies"}`}
          </button>
        )}
        <button
          className="comment-reply-btn"
          onClick={() => setShowReplyForm((v) => !v)}
        >
          {showReplyForm ? "Cancel" : "Reply"}
        </button>
      </div>

      {expanded && (
        <div className="comment-replies">
          {replies.map((r) => (
            <div key={r.id} className="comment-item comment-item-reply" data-testid="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{r.authorName}</span>
              </div>
              <p className="comment-body">
                {r.replyToUserName && (
                  <span className="comment-mention">@{r.replyToUserName} </span>
                )}
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {showReplyForm && (
        <form className="reply-form" onSubmit={handleReplySubmit}>
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="parentId" value={comment.id} />
          <input type="hidden" name="replyToUserName" value={comment.authorName} />
          <textarea
            name="comment"
            placeholder={`Reply to ${comment.authorName}…`}
            className="reply-input"
            rows={2}
            disabled={isPending}
          />
          <button className="reply-button" disabled={isPending}>
            {isPending ? "…" : "↩ Reply"}
          </button>
        </form>
      )}
    </div>
  );
}

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [canScroll, setCanScroll] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const loadComments = useCallback(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then((r) => r.json())
      .then((data: LinkitComment[]) => {
        setComments(data.map(mapComment));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((n) => n + BATCH);
        }
      },
      { root: list, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loaded, visibleCount]);

  function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitComment(null, formData);
      if (result.ok) {
        showToast("Comment posted.", "success");
        if (textareaRef.current) textareaRef.current.value = "";
        loadComments();
      } else {
        showToast(result.message, "error");
      }
    });
  }

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;
  const showScrollHint = loaded && comments.length > 0 && canScroll && !isAtEnd;

  const updateScrollState = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const scrollable = list.scrollHeight > list.clientHeight + 2;
    setCanScroll(scrollable);
    setIsAtEnd(
      !scrollable ||
      list.scrollTop + list.clientHeight >= list.scrollHeight - 8
    );
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [comments, loaded, updateScrollState, visibleCount]);

  function scrollComments() {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({
      top: Math.max(160, list.clientHeight * 0.72),
      behavior: "smooth"
    });
  }

  return (
    <div className="comment-section">
      <form onSubmit={handleCommentSubmit} className="comment-form">
        <input type="hidden" name="postId" value={postId} />
        <textarea
          ref={textareaRef}
          data-testid="comment-input"
          name="comment"
          placeholder="Add a comment…"
          rows={2}
          disabled={isPending}
        />
        <div className="comment-form-row">
          {showScrollHint && (
            <button
              type="button"
              className="comment-scroll-hint"
              onClick={scrollComments}
              aria-label="Scroll for more"
            >
              <span aria-hidden="true">↓</span>
              <span>Scroll for more</span>
            </button>
          )}
          <button
            type="submit"
            data-testid="comment-button"
            disabled={isPending}
          >
            {isPending ? "Posting…" : "Comment"}
          </button>
        </div>
      </form>

      <div
        ref={listRef}
        className="comment-list"
        onScroll={updateScrollState}
      >
        {!loaded && <p className="comment-loading">Loading…</p>}
        {loaded && comments.length === 0 && (
          <p className="comment-empty">No comments yet.</p>
        )}
        {visibleComments.map((c) => (
          <CommentItem key={c.id} comment={c} postId={postId} />
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="comment-sentinel" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
