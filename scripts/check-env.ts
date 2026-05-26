import { validateProductionEnv } from "@/src/env";

try {
  validateProductionEnv();
  console.log("Production environment is valid.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
