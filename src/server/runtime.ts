import { createDb } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import { createRabbitPublisher } from "@/src/queue/rabbitmq";
import type { LinkitJob, LinkitStore, PostMetadataProvider } from "@/src/domain/linkit";
import { createOpenGraphMetadataProvider } from "@/src/metadata/provider";

export type RuntimeServices = {
  store: LinkitStore;
  enqueue: (job: LinkitJob) => Promise<void>;
  metadataProvider: PostMetadataProvider | undefined;
  close: () => Promise<void>;
};

export async function createRuntimeServices(): Promise<RuntimeServices> {
  const databaseUrl = requiredEnv("DATABASE_URL");
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  const store = createPostgresLinkitStore(createDb(databaseUrl));

  if (rabbitmqUrl) {
    const publisher = await createRabbitPublisher(rabbitmqUrl);
    return {
      store,
      enqueue: publisher.enqueue,
      metadataProvider: undefined,
      close: publisher.close
    };
  }

  return {
    store,
    enqueue: async () => {},
    metadataProvider: createOpenGraphMetadataProvider(),
    close: async () => {}
  };
}

export function createRuntimeStore(): LinkitStore {
  return createPostgresLinkitStore(createDb(requiredEnv("DATABASE_URL")));
}

function requiredEnv(name: "DATABASE_URL"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

