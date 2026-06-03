import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  RABBITMQ_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  REVALIDATE_SECRET: optionalString,
  AUTH_TRUST_HOST: optionalString,
  APP_URL: z.string().url(),
  AUTH_FACEBOOK_ID: optionalString,
  AUTH_FACEBOOK_SECRET: optionalString,
  LINK_METADATA_PROVIDER: z.string().default("embedly"),
  EMBEDLY_API_KEY: optionalString,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  MAILGUN_API_KEY: optionalString,
  MAILGUN_DOMAIN: optionalString,
  MAIL_FROM: optionalString,
  LEGACY_DATABASE_URL: optionalString
});

export type LinkitEnv = z.infer<typeof envSchema>;
export type EnvSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export function readEnv(source: EnvSource = process.env): LinkitEnv {
  return envSchema.parse(source);
}

export function validateProductionEnv(
  source: EnvSource = process.env
): LinkitEnv {
  const env = readEnv(source);
  const errors: string[] = [];

  if (
    env.AUTH_SECRET === "development-change-me" ||
    env.AUTH_SECRET.length < 32
  ) {
    errors.push(
      "AUTH_SECRET must be a non-placeholder value with at least 32 characters."
    );
  }

  if (!env.REVALIDATE_SECRET || env.REVALIDATE_SECRET.length < 32) {
    errors.push("REVALIDATE_SECRET must be configured with at least 32 characters.");
  }

  requireAllOrNone(errors, "AUTH_FACEBOOK", [
    env.AUTH_FACEBOOK_ID,
    env.AUTH_FACEBOOK_SECRET
  ]);
  requireAllOrNone(errors, "CLOUDINARY", [
    env.CLOUDINARY_CLOUD_NAME,
    env.CLOUDINARY_API_KEY,
    env.CLOUDINARY_API_SECRET
  ]);
  requireAllOrNone(errors, "MAILGUN", [
    env.MAILGUN_API_KEY,
    env.MAILGUN_DOMAIN,
    env.MAIL_FROM
  ]);

  if (errors.length > 0) {
    throw new Error(`Invalid production environment:\n- ${errors.join("\n- ")}`);
  }

  return env;
}

function requireAllOrNone(
  errors: string[],
  label: string,
  values: Array<string | undefined>
) {
  const configured = values.filter(Boolean).length;
  if (configured > 0 && configured < values.length) {
    errors.push(`${label} settings must be fully configured or fully omitted.`);
  }
}
