import amqp from "amqplib";

import {
  linkitDeadLetterExchange,
  linkitExchange,
  routingKeyFor
} from "@/queue/jobs";
import type { LinkitJob, LinkitStore } from "@/domain/linkit";
import { createDb } from "@/db/client";
import { createPostgresLinkitStore } from "@/db/linkit-store";
import { createOpenGraphMetadataProvider } from "@/metadata/provider";
import path from "node:path";
import { createSharpImageUploader } from "@/images/uploader";
import { createMailgunMailer } from "@/notifications/comment";
import { handleJob } from "@/worker/handlers";
import {
  getGalleryFeedPageFromStore,
  getProviderFeedPageFromStore,
  defaultGalleryPageSize
} from "@/feed/load-feed";
import { setCachedGalleryFirstPage } from "@/server/redis";

const queueName = "linkit.worker";
const rabbitUrl = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
const databaseUrl = process.env.DATABASE_URL;
const appUrl = process.env.APP_URL ?? "http://localhost:3000";

async function main() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();
  const deps = {
    store: createPostgresLinkitStore(createDb(databaseUrl)),
    metadataProvider: createOpenGraphMetadataProvider(),
    imageUploader: createWorkerImageUploader(),
    mailer: createMailgunMailer({
      apiKey: requiredEnv("MAILGUN_API_KEY"),
      domain: requiredEnv("MAILGUN_DOMAIN"),
      from: process.env.MAIL_FROM ?? "Linkit <notifications@linkit.local>"
    }),
    enqueue: async (job: LinkitJob) => {
      channel.publish(
        linkitExchange,
        routingKeyFor(job),
        Buffer.from(JSON.stringify(job)),
        {
          contentType: "application/json",
          persistent: true
        }
      );
    },
    appUrl
  };

  await channel.assertExchange(linkitExchange, "topic", { durable: true });
  await channel.assertExchange(linkitDeadLetterExchange, "topic", {
    durable: true
  });
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": linkitDeadLetterExchange
    }
  });
  await channel.bindQueue(queueName, linkitExchange, "link.*");
  await channel.bindQueue(queueName, linkitExchange, "image.*");
  await channel.bindQueue(queueName, linkitExchange, "comment.*");

  await channel.consume(queueName, async (message) => {
    if (!message) {
      return;
    }

    try {
      const job = JSON.parse(message.content.toString("utf8")) as LinkitJob;
      await handleJob(job, deps);
      channel.ack(message);
    } catch (error) {
      console.error("Worker job failed", error);
      channel.nack(message, false, false);
    }
  });

  // Warm gallery first-page cache on startup, then every 60s.
  const warmStore = createPostgresLinkitStore(createDb(databaseUrl));
  await warmGalleryCache(warmStore);
  setInterval(() => {
    warmGalleryCache(warmStore).catch((err) =>
      console.error("Gallery cache warm failed", err)
    );
  }, 60_000);
}

async function warmGalleryCache(store: LinkitStore): Promise<void> {
  const providers = await store.listProviders();

  await Promise.all([
    getGalleryFeedPageFromStore(store, { limit: defaultGalleryPageSize }).then((page) =>
      setCachedGalleryFirstPage(null, page)
    ),
    ...providers.map((p) =>
      getProviderFeedPageFromStore(store, p.providerName, {
        limit: defaultGalleryPageSize
      }).then((page) => setCachedGalleryFirstPage(p.providerName, page))
    )
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function requiredEnv(name: "MAILGUN_API_KEY" | "MAILGUN_DOMAIN"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function createWorkerImageUploader() {
  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public/uploads");
  return createSharpImageUploader({ outputDir: uploadsDir });
}
