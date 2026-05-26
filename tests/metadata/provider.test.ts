import { describe, expect, it, vi } from "vitest";

import { createOpenGraphMetadataProvider } from "@/src/metadata/provider";

describe("OpenGraph metadata provider", () => {
  it("extracts OpenGraph metadata from HTML", async () => {
    const fetchImpl = vi.fn(async () => ({
      text: async () => `
        <html>
          <head>
            <meta property="og:title" content="Example &amp; Story" />
            <meta property="og:description" content="Readable description" />
            <meta property="og:site_name" content="Example Site" />
            <meta property="og:image" content="https://example.com/thumb.jpg" />
          </head>
        </html>
      `
    })) as unknown as typeof fetch;

    await expect(
      createOpenGraphMetadataProvider(fetchImpl).fetch("https://example.com/story")
    ).resolves.toEqual({
      title: "Example & Story",
      description: "Readable description",
      providerName: "Example Site",
      thumbnailUrl: "https://example.com/thumb.jpg"
    });
  });

  it("falls back to title tag and hostname", async () => {
    const fetchImpl = vi.fn(async () => ({
      text: async () => "<title>Plain page</title>"
    })) as unknown as typeof fetch;

    await expect(
      createOpenGraphMetadataProvider(fetchImpl).fetch("https://fallback.test/path")
    ).resolves.toEqual({
      title: "Plain page",
      description: null,
      providerName: "fallback.test",
      thumbnailUrl: null
    });
  });

  it("parses OG tags when content attribute appears before property (Pinterest-style)", async () => {
    const fetchImpl = vi.fn(async () => ({
      text: async () => `
        <html>
          <head>
            <meta content="Pinterest" property="og:site_name"/>
            <meta content="https://i.pinimg.com/736x/photo.jpg" data-app="true" name="og:image" property="og:image"/>
            <meta content="Greece outfit | Mens casual outfits" data-app="true" name="og:title" property="og:title"/>
            <meta content="A great outfit." data-app="true" name="og:description" property="og:description"/>
          </head>
        </html>
      `
    })) as unknown as typeof fetch;

    await expect(
      createOpenGraphMetadataProvider(fetchImpl).fetch("https://www.pinterest.com/pin/123/")
    ).resolves.toEqual({
      title: "Greece outfit | Mens casual outfits",
      description: "A great outfit.",
      providerName: "Pinterest",
      thumbnailUrl: "https://i.pinimg.com/736x/photo.jpg"
    });
  });
});
