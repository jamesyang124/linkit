export type FeedbackMessage = {
  tone: "notice" | "success";
  text: string;
};

export function feedbackFromSearchParams(input: {
  message?: string | string[];
  posted?: string | string[];
  commented?: string | string[];
}): FeedbackMessage | null {
  const message = firstValue(input.message);
  if (message) {
    return {
      tone: "notice",
      text: message
    };
  }

  if (firstValue(input.posted) === "1") {
    return {
      tone: "success",
      text: "Link shared. Metadata will update shortly."
    };
  }

  if (firstValue(input.commented) === "1") {
    return {
      tone: "success",
      text: "Comment added."
    };
  }

  return null;
}

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
