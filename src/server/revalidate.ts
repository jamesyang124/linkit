export type RevalidationAuthorization =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 503; message: string };

export function authorizeRevalidation({
  configuredSecret,
  providedSecret
}: {
  configuredSecret: string | undefined;
  providedSecret: string | null;
}): RevalidationAuthorization {
  if (!configuredSecret) {
    return {
      ok: false,
      status: 503,
      message: "Revalidation is not configured."
    };
  }

  if (!providedSecret) {
    return {
      ok: false,
      status: 401,
      message: "Missing revalidation secret."
    };
  }

  if (providedSecret !== configuredSecret) {
    return {
      ok: false,
      status: 403,
      message: "Invalid revalidation secret."
    };
  }

  return { ok: true };
}
