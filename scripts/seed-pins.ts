/**
 * Seed 20 Pinterest pins for manual testing.
 * Usage: DATABASE_URL=... RABBITMQ_URL=... tsx scripts/seed-pins.ts
 */
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import { createRabbitPublisher } from "@/src/queue/rabbitmq";

const PINS = [
  // Minimalist interior
  "https://www.pinterest.com/pin/550916966902602578/",
  // Brutalist design / oasis
  "https://www.pinterest.com/pin/621496817369087148/",
  // Concrete furniture
  "https://www.pinterest.com/pin/460352393132196841/",
  // Brutalist concrete pedestal
  "https://www.pinterest.com/pin/4600215985610298368/",
  // Typography editorial
  "https://www.pinterest.com/pin/16607092359726995/",
  // Wabi-sabi ceramics workshop
  "https://www.pinterest.com/pin/701154235733761120/",
  // Black and white film photography
  "https://www.pinterest.com/pin/572097958894177912/",
  // Scandinavian interior linen
  "https://www.pinterest.com/pin/715016878338099058/",
  // Scandinavian warm living room
  "https://www.pinterest.com/pin/221028294205735545/",
  // Swiss grid poster (Poster House)
  "https://www.pinterest.com/pin/14707136273108768/",
  // Swiss grid – second version
  "https://www.pinterest.com/pin/538672805440694420/",
  // Modern swiss-style poster grid
  "https://www.pinterest.com/pin/350506783512002152/",
  // Fashion editorial lookbook template
  "https://www.pinterest.com/pin/450852612704553339/",
  // Street lookbook
  "https://www.pinterest.com/pin/6262886965832608/",
  // Manhattan industrial loft exposed brick
  "https://www.pinterest.com/pin/505036545712962211/",
  // Industrial loft architecture ref
  "https://www.pinterest.com/pin/409123947369744346/",
  // Industrial loft unique exposed brick
  "https://www.pinterest.com/pin/794322453044360439/",
  // Architectural references
  "https://www.pinterest.com/pin/518054763408752021/",
  // Three dark loft apartments
  "https://www.pinterest.com/pin/457467274646060655/",
  // 25 Notable brutalist furniture designs
  "https://www.pinterest.com/pin/1051379475512815286/",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  const userId = process.env.SEED_USER_ID;

  if (!databaseUrl) throw new Error("DATABASE_URL required");
  if (!userId) throw new Error("SEED_USER_ID required");

  const store = createPostgresLinkitStore(createDb(databaseUrl));

  let enqueue: (job: { type: string; payload: unknown }) => Promise<void>;
  let close = async () => {};

  if (rabbitmqUrl) {
    const publisher = await createRabbitPublisher(rabbitmqUrl);
    enqueue = publisher.enqueue as typeof enqueue;
    close = publisher.close;
    console.log("Connected to RabbitMQ — will enqueue link.enrich jobs");
  } else {
    enqueue = async (job) => {
      console.log("  (no RabbitMQ) would enqueue:", job.type);
    };
  }

  const user = { id: userId, email: process.env.SEED_USER_EMAIL ?? "seed@linkit.app", name: "Seed", imageUrl: null };
  console.log(`Seeding as: ${user.email}`);

  let ok = 0;
  let skip = 0;

  for (const link of PINS) {
    try {
      const hostname = new URL(link).hostname;
      const post = await store.createPost({
        link,
        title: hostname,
        body: null,
        providerName: "pinterest.com",
        thumbnailUrl: null,
        user
      });
      await enqueue({ type: "link.enrich", payload: { postId: post.id, link } });
      console.log(`  ✓ ${link}`);
      ok++;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("unique")) {
        console.log(`  – skip (duplicate): ${link}`);
        skip++;
      } else {
        console.error(`  ✗ ${link}`, err instanceof Error ? err.message : err);
      }
    }
  }

  console.log(`\nDone: ${ok} inserted, ${skip} skipped`);
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
