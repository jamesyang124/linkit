"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { feedbackFromSearchParams } from "@/src/feedback/messages";
import { showToast } from "@/components/toast";

export function FeedbackBanner() {
  const searchParams = useSearchParams();
  const feedbackKey = searchParams.toString();

  useEffect(() => {
    const feedback = feedbackFromSearchParams({
      message: searchParams.get("message") ?? undefined,
      posted: searchParams.get("posted") ?? undefined,
      commented: searchParams.get("commented") ?? undefined
    });
    if (feedback) {
      showToast(feedback.text, feedback.tone === "success" ? "success" : "info");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackKey]);

  return null;
}
