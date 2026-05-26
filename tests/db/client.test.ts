import { beforeEach, describe, expect, it, vi } from "vitest";

const postgresCalls = vi.hoisted(() => [] as Array<{ url: string; options: unknown }>);

vi.mock("postgres", () => ({
  default: vi.fn((url: string, options: unknown) => {
    const client = { url, options };
    postgresCalls.push({ url, options });
    return client;
  })
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn((client: unknown, config: unknown) => ({ client, config }))
}));

describe("database client factory", () => {
  beforeEach(() => {
    postgresCalls.length = 0;
    delete (globalThis as typeof globalThis & { __linkitPostgresClients?: unknown })
      .__linkitPostgresClients;
    vi.resetModules();
  });

  it("reuses one Postgres client per database URL for app DB instances", async () => {
    const { createDb } = await import("@/src/db/client");

    const first = createDb("postgres://linkit:linkit@localhost/linkit");
    const second = createDb("postgres://linkit:linkit@localhost/linkit");

    expect(postgresCalls).toHaveLength(1);
    expect((first as unknown as { client: unknown }).client).toBe(
      (second as unknown as { client: unknown }).client
    );
  });

  it("keeps separate Postgres clients for different database URLs", async () => {
    const { createDb } = await import("@/src/db/client");

    createDb("postgres://linkit:linkit@localhost/linkit");
    createDb("postgres://linkit:linkit@localhost/other");

    expect(postgresCalls).toHaveLength(2);
  });
});
