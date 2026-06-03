import { RegisterForm } from "./form";

export default function RegisterPage() {
  return (
    <main className="site-shell flex min-h-[calc(100vh-3.75rem)] flex-col items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-sm">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-muted">New account</p>
        <h1 className="mb-10 font-display text-5xl font-light leading-[0.92] tracking-wide">
          Register
        </h1>
        <RegisterForm />
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-muted">
          Already have an account?{" "}
          <a href="/signin">Sign in</a>
        </p>
      </div>
    </main>
  );
}
