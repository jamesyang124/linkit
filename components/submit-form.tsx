"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitLink } from "@/app/actions";
import { showToast } from "@/components/toast";

export const PRESET_TAGS = [
  "Design", "Typography", "Photography", "Illustration", "Architecture",
  "Motion", "Identity", "Packaging", "Editorial", "Web",
  "UI", "Art Direction", "Color", "Grid", "Pattern",
  "Culture", "Film", "Music", "Fashion", "Space"
] as const;

export function SubmitForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (selectedTags.length > 0) {
      formData.set("tags", selectedTags.join(","));
    }
    startTransition(async () => {
      const result = await submitLink(null, formData);
      showToast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        form.reset();
        setSelectedTags([]);
        document.getElementById("page-main")?.scrollTo({ top: 0 });
        router.refresh();
      }
    });
  }

  return (
    <form className="submit-panel" onSubmit={handleSubmit}>
      <label>New link</label>
      <input
        data-testid="submit-link-input"
        name="link"
        placeholder="https://example.com/story"
        disabled={isPending}
      />
      <div className="submit-tags">
        <span className="submit-tags-label">Tags</span>
        <div className="submit-tags-list">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`submit-tag-btn${selectedTags.includes(tag) ? " is-active" : ""}`}
              onClick={() => toggleTag(tag)}
              disabled={isPending}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <button data-testid="submit-link-button" disabled={isPending}>
        {isPending ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
