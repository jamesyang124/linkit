import { describe, expect, it, vi } from "vitest";

import {
  createPassthroughImageUploader,
  createSharpImageUploader
} from "@/images/uploader";

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from("fake-local-image-data"))
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from("fake-local-image-data"))
}));

vi.mock("sharp", () => {
  const pipeline = {
    webp: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined)
  };
  return { default: vi.fn().mockReturnValue(pipeline) };
});

describe("image uploaders", () => {
  it("passthrough uploader returns source URL unchanged", async () => {
    await expect(
      createPassthroughImageUploader().uploadFromUrl("https://example.com/a.jpg")
    ).resolves.toEqual({
      secureUrl: "https://example.com/a.jpg"
    });
  });

  describe("Sharp uploader", () => {
    function makeUploader(fetchImpl: typeof fetch) {
      return createSharpImageUploader({ outputDir: "/tmp/linkit-test", fetchImpl });
    }

    function fakeFetch(ok = true, status = 200) {
      return vi.fn().mockResolvedValue({
        ok,
        status,
        arrayBuffer: async () => Buffer.from("fake-image-data").buffer
      }) as unknown as typeof fetch;
    }

    it("downloads the image with a browser User-Agent header", async () => {
      const fetchImpl = fakeFetch();
      await makeUploader(fetchImpl).uploadFromUrl("https://example.com/img.jpg");

      expect(fetchImpl).toHaveBeenCalledWith(
        "https://example.com/img.jpg",
        expect.objectContaining({
          headers: expect.objectContaining({ "User-Agent": expect.stringContaining("Linkit") })
        })
      );
    });

    it("returns a local /uploads path with a .webp extension", async () => {
      const result = await makeUploader(fakeFetch()).uploadFromUrl("https://example.com/img.jpg");
      expect(result.secureUrl).toMatch(/^\/uploads\/[a-f0-9]{16}\.webp$/);
    });

    it("produces the same filename for the same URL (deterministic hash)", async () => {
      const uploader = makeUploader(fakeFetch());
      const r1 = await uploader.uploadFromUrl("https://example.com/same.jpg");
      const r2 = await uploader.uploadFromUrl("https://example.com/same.jpg");
      expect(r1.secureUrl).toBe(r2.secureUrl);
    });

    it("produces different filenames for different URLs", async () => {
      const uploader = makeUploader(fakeFetch());
      const r1 = await uploader.uploadFromUrl("https://example.com/a.jpg");
      const r2 = await uploader.uploadFromUrl("https://example.com/b.jpg");
      expect(r1.secureUrl).not.toBe(r2.secureUrl);
    });

    it("resizes processed images to a fixed width with proportional height", async () => {
      const sharp = (await import("sharp")).default as unknown as ReturnType<typeof vi.fn>;
      sharp.mockClear();

      await makeUploader(fakeFetch()).uploadFromUrl("https://example.com/img.jpg", {
        maxWidth: 736,
        quality: 72
      });

      const pipeline = sharp.mock.results[0]?.value;
      expect(pipeline?.resize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 736,
          withoutEnlargement: false
        })
      );
      expect(pipeline?.webp).toHaveBeenCalledWith({ quality: 72 });
    });

    it("can process an existing local upload path", async () => {
      const fs = await import("node:fs/promises");

      await makeUploader(fakeFetch()).uploadFromUrl("/uploads/existing.webp", {
        maxWidth: 736,
        quality: 72
      });

      expect(fs.default.readFile).toHaveBeenCalledWith("/tmp/linkit-test/existing.webp");
    });

    it("throws when the image fetch fails", async () => {
      await expect(
        makeUploader(fakeFetch(false, 403)).uploadFromUrl("https://example.com/blocked.jpg")
      ).rejects.toThrow("403");
    });
  });
});
