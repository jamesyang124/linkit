"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitLink } from "@/app/actions";
import { showToast } from "@/components/toast";

export function SubmitForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitLink(null, formData);
      showToast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        form.reset();
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
      <button data-testid="submit-link-button" disabled={isPending}>
        {isPending ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
