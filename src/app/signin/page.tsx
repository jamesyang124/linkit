import { SignInForm } from "./form";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="site-shell flex min-h-[calc(100vh-3.75rem)] flex-col items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-sm">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-muted">Account</p>
        <h1 className="mb-10 font-display text-5xl font-light leading-[0.92] tracking-wide">
          Sign in
        </h1>
        <SignInForm registered={params.registered === "1"} />
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-muted">
          No account?{" "}
          <a href="/register">Register</a>
        </p>
      </div>
    </main>
  );
}
