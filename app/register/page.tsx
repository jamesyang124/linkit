import { RegisterForm } from "./form";

export default function RegisterPage() {
  return (
    <main className="site-shell min-h-[calc(100vh-3.75rem)] px-5 py-8 md:px-8">
      <section className="grid min-h-[70vh] gap-8 border-b border-ink pb-10 md:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.45fr)]">
        <div className="auth-heading self-end">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-muted">
            New account
          </p>
          <h1 className="max-w-4xl font-display text-6xl leading-[0.92] md:text-8xl">
            Register
          </h1>
        </div>
        <div className="auth-form grid content-end gap-5">
          <RegisterForm />
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Already have an account?{" "}
            <a href="/signin">
              Sign in
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
