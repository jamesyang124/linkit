import amqp from "amqplib";

import {
  linkitDeadLetterExchange,
  linkitExchange,
  routingKeyFor
} from "@/src/queue/jobs";
import type { LinkitJob } from "@/src/domain/linkit";
import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import { createOpenGraphMetadataProvider } from "@/src/metadata/provider";
import path from "node:path";
import { createSharpImageUploader } from "@/src/images/uploader";
import { createMailgunMailer } from "@/src/notifications/comment";
import { handleJob } from "@/src/worker/handlers";

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
