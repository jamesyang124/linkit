import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { createPostgresClient } from "@/db/client";
import * as schema from "@/db/schema";

const { posts, users } = schema;

const seedUser = {
  email: "designspiration-seed@linkit.app",
  name: "Designspiration Seed"
};

const PINS = [
  {
    saveId: "1054182069",
    title: "Designspiration Save 1054182069",
    source: "Designspiration.com",
    colors: ["#111111", "#393939", "#777777", "#c9c9c9", "#f4f4f4"],
    width: 736,
    height: 920
  },
  {
    saveId: "2444998407674",
    title: "Slanted Magazine #40 - Experimental Type",
    source: "Designspiration.com",
    colors: ["#333037", "#b2ae3f", "#c85133", "#e1e1e7", "#f861fb"],
    width: 736,
    height: 980
  },
  {
    saveId: "62960839589125",
    title: "Things to Save",
    source: "Thingstosave.com",
    colors: ["#211e16", "#5c5333", "#748171", "#b2b79b", "#f6f1dc"],
    width: 736,
    height: 980
  },
  {
    saveId: "62002873437326",
    title: "00whitewash texture black and white",
    source: "Christopherschreck.com",
    colors: ["#141414", "#363638", "#6d6d6f", "#aaaaac", "#e9e9ea"],
    width: 736,
    height: 736
  },
  {
    saveId: "27717020118786",
    title: "Tumblr home interior reference",
    source: "S3.amazonaws.com",
    colors: ["#1e1716", "#5b5350", "#9c9592", "#e2e1e1", "#fafafa"],
    width: 736,
    height: 1014
  },
  {
    saveId: "54795482390069",
    title: "Things to Save - cool",
    source: "Thingstosave.com",
    colors: ["#211e16", "#5c5333", "#748171", "#b2b79b", "#f6f1dc"],
    width: 736,
    height: 920
  },
  {
    saveId: "80893463495465",
    title: "Paint drips minimalism",
    source: "Thingstosave.com",
    colors: ["#b10c66", "#d592ba", "#e5dfcd", "#e8e9e4", "#e9d443"],
    width: 736,
    height: 920
  },
  {
    saveId: "54514456958590",
    title: "Standing Elements",
    source: "Designspiration.com",
    colors: ["#433b3c", "#865c3f", "#cda58a", "#e3d7cd", "#f3f0ed"],
    width: 736,
    height: 920
  },
  {
    saveId: "616484809870",
    title: "Leather clutch reference",
    source: "Wetpaint.tumblr.com",
    colors: ["#511711", "#821e0b", "#b5592f", "#cdcac9", "#eeeeef"],
    width: 736,
    height: 980
  },
  {
    saveId: "348317627983",
    title: "Zoom folders",
    source: "Bouroullec.com",
    colors: ["#344028", "#4d801a", "#8a897f", "#e2e3db", "#f37933"],
    width: 736,
    height: 736
  },
  {
    saveId: "82248852903886",
    title: "Marshawn Seattle",
    source: "Dannyschlitz.com",
    colors: ["#03123f", "#3f4244", "#56c512", "#78b55c", "#9daca5"],
    width: 736,
    height: 920
  },
  {
    saveId: "395914737784",
    title: "Day 7 | 10x17",
    source: "10x17.co",
    colors: ["#463ecb", "#9986cb", "#e55a2d", "#eee6e1", "#f3c433"],
    width: 736,
    height: 1251
  },
  {
    saveId: "6496990236234",
    title: "Stripes menu book notebook reference",
    source: "S3.amazonaws.com",
    colors: ["#283870", "#37312d", "#cacece", "#e5e7e8", "#f0bcba"],
    width: 736,
    height: 552
  },
  {
    saveId: "4995198951473",
    title: "Otto adjustable wood industrial fan",
    source: "S3.amazonaws.com",
    colors: ["#221e1d", "#4c4642", "#9c6d47", "#b99f86", "#fcfcfb"],
    width: 736,
    height: 736
  },
  {
    saveId: "4037434826049",
    title: "BDG STAG map layout",
    source: "Wpengine.netdna-cdn.com",
    colors: ["#382b35", "#504249", "#746464", "#c3ae94", "#d0bca5"],
    width: 736,
    height: 553
  },
  {
    saveId: "9417844292411",
    title: "Paint image",
    source: "P-exclamation.org",
    colors: ["#b1918e", "#d23658", "#e1f2dd", "#f00549", "#f2e9dd"],
    width: 736,
    height: 920
  },
  {
    saveId: "29738855431609",
    title: "Random Inspiration #23",
    source: "Theultralinx.com",
    colors: ["#111117", "#554042", "#817a7b", "#ccc5b7", "#eeeeea"],
    width: 736,
    height: 920
  },
  {
    saveId: "1523433331808",
    title: "Davies MN 7",
    source: "Allanpeters.com",
    colors: ["#2d2218", "#86724d", "#bbc2b9", "#d04237", "#f4f2eb"],
    width: 736,
    height: 920
  },
  {
    saveId: "9533813305053",
    title: "Google Reader 1000+ log",
    source: "Google.com",
    colors: ["#181617", "#272425", "#c8c9cc", "#e6e7e9", "#fbfbfc"],
    width: 736,
    height: 920
  },
  {
    saveId: "41141677119200",
    title: "Drop files here",
    source: "Inspirationde.com",
    colors: ["#1dabf0", "#46bae0", "#df7d7a", "#e1f6fb", "#fbfbfb"],
    width: 736,
    height: 736
  }
] as const;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = createPostgresClient(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    const [user] = await db
      .insert(users)
      .values(seedUser)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: seedUser.name,
          updatedAt: new Date()
        }
      })
      .returning({ id: users.id });

    const userId = user?.id ?? (await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, seedUser.email))
      .limit(1))[0]?.id;

    if (!userId) {
      throw new Error("Could not resolve Designspiration seed user.");
    }

    let upserted = 0;
    for (const [index, pin] of PINS.entries()) {
      const link = `https://www.designspiration.com/save/${pin.saveId}/`;
      const now = new Date(Date.now() - index * 60_000);
      const thumbnailUrl = makePaletteSvgDataUri(pin);

      await db
        .insert(posts)
        .values({
          userId,
          title: pin.title,
          body: `Designspiration save from ${pin.source}`,
          link,
          thumbnailUrl,
          profileThumbnailUrl: thumbnailUrl,
          providerName: "designspiration.com",
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: posts.link,
          set: {
            title: pin.title,
            body: `Designspiration save from ${pin.source}`,
            thumbnailUrl,
            profileThumbnailUrl: thumbnailUrl,
            providerName: "designspiration.com",
            createdAt: now,
            updatedAt: now
          }
        });
      upserted += 1;
    }

    console.log(`Seeded ${upserted} Designspiration pins.`);
  } finally {
    await client.end();
  }
}

function makePaletteSvgDataUri(pin: (typeof PINS)[number]) {
  const stripeWidth = pin.width / pin.colors.length;
  const rects = pin.colors
    .map(
      (color, index) =>
        `<rect x="${Math.round(index * stripeWidth)}" y="0" width="${Math.ceil(stripeWidth)}" height="${pin.height}" fill="${color}"/>`
    )
    .join("");
  const title = escapeXml(pin.title);
  const source = escapeXml(pin.source);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pin.width}" height="${pin.height}" viewBox="0 0 ${pin.width} ${pin.height}">${rects}<rect x="32" y="${pin.height - 160}" width="${pin.width - 64}" height="96" fill="rgba(255,255,255,0.84)"/><text x="52" y="${pin.height - 112}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#111">${title}</text><text x="52" y="${pin.height - 76}" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#333">${source}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
