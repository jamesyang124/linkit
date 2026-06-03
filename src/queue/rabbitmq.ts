import amqp from "amqplib";

import {
  linkitDeadLetterExchange,
  linkitExchange,
  routingKeyFor
} from "@/queue/jobs";
import type { LinkitJob } from "@/domain/linkit";

export async function createRabbitPublisher(url: string) {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(linkitExchange, "topic", { durable: true });
  await channel.assertExchange(linkitDeadLetterExchange, "topic", {
    durable: true
  });

  return {
    async enqueue(job: LinkitJob) {
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
    async close() {
      await channel.close();
      await connection.close();
    }
  };
}
