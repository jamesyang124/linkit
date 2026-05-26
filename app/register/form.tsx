"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { registerAction } from "@/app/auth-actions";
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

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state?.error) {
      showToast(state.error, "error");
      if (state.field === "email") setEmail("");
      else if (state.field === "password") setPassword("");
    }
  }, [state]);

  return (
    <form
      className="grid gap-4 border-l border-ink pl-5"
      action={formAction}
    >
      <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
        Name
        <input
          className="border-b border-ink bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
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
          autoComplete="new-password"
        />
      </label>
      <SubmitButton label="Create" />
    </form>
  );
}
