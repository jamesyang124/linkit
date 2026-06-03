import { describe, expect, it } from "vitest";

import { feedbackFromSearchParams } from "@/feedback/messages";

describe("feedback messages", () => {
  it("maps explicit action errors from the query string", () => {
    expect(
      feedbackFromSearchParams({
        message: "Sign in before sharing a link."
      })
    ).toEqual({
      tone: "notice",
      text: "Sign in before sharing a link."
    });
  });

  it("maps successful link and comment redirects", () => {
    expect(feedbackFromSearchParams({ posted: "1" })).toEqual({
      tone: "success",
      text: "Link shared. Metadata will update shortly."
    });
    expect(feedbackFromSearchParams({ commented: "1" })).toEqual({
      tone: "success",
      text: "Comment added."
    });
  });

  it("returns null when there is no feedback state", () => {
    expect(feedbackFromSearchParams({})).toBeNull();
  });
});
