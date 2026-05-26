import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/src/db/schema";

export function createPostgresClient(databaseUrl: string) {
  return postgres(databaseUrl, {
    max: Number(process.env.POSTGRES_MAX_CONNECTIONS ?? 5),
    prepare: false
  });
}

type PostgresClient = ReturnType<typeof createPostgresClient>;

declare global {
  var __linkitPostgresClients: Map<string, PostgresClient> | undefined;
}

function getSharedPostgresClient(databaseUrl: string) {
  globalThis.__linkitPostgresClients ??= new Map<string, PostgresClient>();

  let client = globalThis.__linkitPostgresClients.get(databaseUrl);
  if (!client) {
    client = createPostgresClient(databaseUrl);
    globalThis.__linkitPostgresClients.set(databaseUrl, client);
  }

  return client;
}

export function createDb(databaseUrl: string) {
  return drizzle(getSharedPostgresClient(databaseUrl), { schema });
}

export type LinkitDb = ReturnType<typeof createDb>;
