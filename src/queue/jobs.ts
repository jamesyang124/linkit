import type { LinkitJob } from "@/src/domain/linkit";

export const linkitExchange = "linkit.events";
export const linkitDeadLetterExchange = "linkit.dead";

export function routingKeyFor(job: LinkitJob): string {
  return job.type;
}
