"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction } from "@/app/auth-actions";
import { PasswordInput } from "@/components/password-input";
import { showToast } from "@/components/toast";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-fit border border-ink px-5 py-3 text-xs uppercase tracking-[0.24em] transition hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-40"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function SignInForm({ registered }: { registered: boolean }) {
  const [state, formAction] = useActionState(signInAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (registered) showToast("Account created. Sign in to continue.", "success");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.error) {
      showToast(state.error, "error");
      if (state.field === "password") setPassword("");
      else if (state.field === "email") setEmail("");
    }
  }, [state]);

  return (
    <form
      className="grid gap-4 border-l border-ink pl-5"
      action={formAction}
    >
      <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
        Email
        <input
          className="border-b border-ink bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
        Password
        <PasswordInput
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </label>
      <SubmitButton label="Continue" />
    </form>
  );
}
