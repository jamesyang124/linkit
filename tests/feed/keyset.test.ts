import { describe, expect, it } from "vitest";

import {
  decodePostCursor,
  encodePostCursor,
  InvalidPostCursorError
} from "@/src/feed/keyset";

describe("feed keyset cursors", () => {
  it("round-trips a post cursor", () => {
    const cursor = {
      providerName: "Pinterest",
      createdAt: new Date("2026-05-24T08:00:00.000Z"),
      id: "00000000-0000-0000-0000-000000000002"
    };

    expect(decodePostCursor(encodePostCursor(cursor))).toEqual(cursor);
  });

  it("rejects invalid cursor strings", () => {
    expect(() => decodePostCursor("not-json")).toThrow(InvalidPostCursorError);
  });
});
