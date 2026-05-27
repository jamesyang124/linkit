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
    authorName: c.user.name ?? "Anonymous",
    replyToUserName: c.replyToUserName,
    replyCount: c.replyCount,
    parentId: c.parentId,
    createdAt: new Date(c.createdAt)
  };
}

const BATCH = 10;

// Inline reply form reused by both top-level comments and nested replies.
function ReplyForm({
  postId,
  parentId,
  replyToUserName,
  onPosted
}: {
  postId: string;
  parentId: string;
  replyToUserName: string;
  onPosted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitComment(null, formData);
      if (result.ok) {
        showToast("Reply posted.", "success");
        form.reset();
        onPosted();
      } else {
        showToast(result.message, "error");
      }
    });
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="replyToUserName" value={replyToUserName} />
      <textarea
        name="comment"
        placeholder={`Reply to ${replyToUserName}…`}
        className="reply-input"
        rows={2}
        disabled={isPending}
        autoFocus
      />
      <div className="comment-actions">
        <button className="reply-button" disabled={isPending}>
          {isPending ? "…" : "↩ Reply"}
        </button>
      </div>
    </form>
  );
}

// Renders one nested reply with its own inline Reply button.
function ReplyItem({
  reply,
  postId,
  parentCommentId,
  onReplyPosted,
  onReplyToggle
}: {
  reply: CommentCard;
  postId: string;
  parentCommentId: string;
  onReplyPosted: () => void;
  onReplyToggle: (active: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  function toggleForm() {
    const next = !showForm;
    setShowForm(next);
    onReplyToggle(next);
  }

  return (
    <div className="comment-item comment-item-reply" data-testid="comment-item">
      <div className="comment-meta">
        <span className="comment-author">{reply.authorName}</span>
      </div>
      <p className="comment-body">
        {reply.replyToUserName && (
          <span className="comment-mention">@{reply.replyToUserName} </span>
        )}
        {reply.body}
      </p>
      <div className="comment-actions">
        <button
          className="comment-reply-btn"
          onClick={toggleForm}
        >
          {showForm ? "Cancel" : "Reply"}
        </button>
      </div>
      {showForm && (
        <ReplyForm
          postId={postId}
          parentId={parentCommentId}
          replyToUserName={reply.authorName}
          onPosted={() => {
            setShowForm(false);
            onReplyToggle(false);
            onReplyPosted();
          }}
        />
      )}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  onReplyToggle
}: {
  comment: CommentCard;
  postId: string;
  onReplyToggle: (active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<CommentCard[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchReplies = useCallback(() => {
    startTransition(async () => {
      const res = await fetch(`/api/comments/${comment.id}/replies`);
      const data = (await res.json()) as LinkitComment[];
      setReplies(data.map(mapComment));
      setExpanded(true);
    });
  }, [comment.id]);

  function toggleReplies() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    fetchReplies();
  }

  function toggleReplyForm() {
    const next = !showReplyForm;
    setShowReplyForm(next);
    onReplyToggle(next);
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
          onClick={toggleReplyForm}
        >
          {showReplyForm ? "Cancel" : "Reply"}
        </button>
      </div>

      {expanded && (
        <div className="comment-replies">
          {replies.map((r) => (
            <ReplyItem
              key={r.id}
              reply={r}
              postId={postId}
              parentCommentId={comment.id}
              onReplyPosted={fetchReplies}
              onReplyToggle={onReplyToggle}
            />
          ))}
        </div>
      )}

      {showReplyForm && (
        <ReplyForm
          postId={postId}
          parentId={comment.id}
          replyToUserName={comment.authorName}
          onPosted={() => {
            setShowReplyForm(false);
            onReplyToggle(false);
            fetchReplies();
          }}
        />
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
  const [replyActive, setReplyActive] = useState(false);
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
      {!replyActive && (
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
      )}

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
          <CommentItem
            key={c.id}
            comment={c}
            postId={postId}
            onReplyToggle={setReplyActive}
          />
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="comment-sentinel" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
