import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type ImageUploadResult = {
  secureUrl: string;
};

export type ImageProcessingOptions = {
  maxWidth: number;
  maxHeight?: number;
  quality: number;
};

export type ImageUploader = {
  uploadFromUrl(
    url: string,
    options?: ImageProcessingOptions
  ): Promise<ImageUploadResult>;
};

export function createPassthroughImageUploader(): ImageUploader {
  return {
    async uploadFromUrl(url) {
      return {
        secureUrl: url
      };
    }
  };
}

export function createSharpImageUploader(input: {
  outputDir: string;
  fetchImpl?: typeof fetch;
}): ImageUploader {
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    async uploadFromUrl(url, options) {
      const sharp = (await import("sharp")).default;

      const buffer = await readImageBuffer(url, {
        outputDir: input.outputDir,
        fetchImpl
      });
      const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
      const filename = `${hash}.webp`;
      const outputPath = path.join(input.outputDir, filename);

      await fs.mkdir(input.outputDir, { recursive: true });

      const pipeline = sharp(buffer).webp({ quality: options?.quality ?? 80 });
      if (options) {
        pipeline.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: options.maxHeight ? "cover" : "inside",
          position: "top",
          withoutEnlargement: false
        });
      }
      await pipeline.toFile(outputPath);

      return { secureUrl: `/uploads/${filename}` };
    }
  };
}

export function createCloudinaryImageUploader(input: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  fetchImpl?: typeof fetch;
}): ImageUploader {
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    async uploadFromUrl(url, options) {
      const body = new URLSearchParams();
      body.set("file", url);
      body.set("upload_preset", "linkit_unsigned");
      if (options) {
        const transform = options.maxHeight
          ? `c_fill,w_${options.maxWidth},h_${options.maxHeight},g_auto,q_${options.quality},f_auto`
          : `c_scale,w_${options.maxWidth},q_${options.quality},f_auto`;
        body.set("transformation", transform);
      }

      const response = await fetchImpl(
        `https://api.cloudinary.com/v1_1/${input.cloudName}/image/upload`,
        {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(`${input.apiKey}:${input.apiSecret}`).toString("base64")}`
          },
          body
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed with status ${response.status}`);
      }

      const payload = (await response.json()) as { secure_url?: string };
      if (!payload.secure_url) {
        throw new Error("Cloudinary response did not include secure_url.");
      }

      return {
        secureUrl: payload.secure_url
      };
    }
  };
}

async function readImageBuffer(
  url: string,
  input: {
    outputDir: string;
    fetchImpl: typeof fetch;
  }
) {
  if (url.startsWith("data:")) {
    return readDataUriBuffer(url);
  }

  if (url.startsWith("/uploads/")) {
    return fs.readFile(path.join(input.outputDir, path.basename(url)));
  }

  const response = await input.fetchImpl(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Linkit/1.0)" }
  });
  if (!response.ok) {
    throw new Error(`Image fetch failed with status ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function readDataUriBuffer(uri: string) {
  const commaIndex = uri.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Invalid data image URI.");
  }

  const metadata = uri.slice(0, commaIndex);
  const data = uri.slice(commaIndex + 1);
  return metadata.endsWith(";base64")
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data));
}
