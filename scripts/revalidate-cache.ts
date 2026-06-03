const appUrl = process.env.APP_URL;
const secret = process.env.REVALIDATE_SECRET;

async function main() {
  if (!appUrl) {
    console.error("APP_URL is required.");
    process.exitCode = 1;
    return;
  }

  if (!secret) {
    console.error("REVALIDATE_SECRET is required.");
    process.exitCode = 1;
    return;
  }

  const response = await fetch(new URL("/api/revalidate", appUrl), {
    method: "POST",
    headers: {
      "x-linkit-revalidate-secret": secret
    }
  });
  const body = await response.text();

  if (!response.ok) {
    console.error(`Revalidation failed (${response.status}): ${body}`);
    process.exitCode = 1;
    return;
  }

  console.log(body);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
