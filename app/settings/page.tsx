"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { changePasswordAction, updateUsernameAction } from "@/app/settings-actions";
import { showToast } from "@/components/toast";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-fit border border-ink px-5 py-3 text-xs uppercase tracking-[0.24em] transition hover:bg-ink hover:text-paper disabled:opacity-40"
    >
      {pending ? "…" : label}
    </button>
  );
}

export default function SettingsPage() {
  const [usernameState, usernameAction] = useActionState(updateUsernameAction, null);
  const [passwordState, passwordAction] = useActionState(changePasswordAction, null);

  useEffect(() => {
    if (usernameState?.error) showToast(usernameState.error, "error");
    else if (usernameState?.success) showToast(usernameState.success, "success");
  }, [usernameState]);

  useEffect(() => {
    if (passwordState?.error) showToast(passwordState.error, "error");
    else if (passwordState?.success) showToast(passwordState.success, "success");
  }, [passwordState]);

  return (
    <main className="site-shell min-h-screen px-5 py-10 md:px-8">
      <h1 className="mb-10 font-display text-2xl font-light tracking-wide">Settings</h1>

      <div className="grid gap-12 max-w-md">
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-[0.24em] text-muted">
            Username
          </h2>
          <p className="mb-4 text-sm text-muted">
            Your public display name in comments. Leave unset to appear as Anonymous.
          </p>
          <form action={usernameAction} className="grid gap-4 border-l border-ink pl-5">
            <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
              New username
              <input
                className="border-b border-ink bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
                name="username"
                autoComplete="username"
                placeholder="e.g. ada_lovelace"
              />
            </label>
            <SubmitButton label="Save username" />
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-xs uppercase tracking-[0.24em] text-muted">
            Change password
          </h2>
          <form action={passwordAction} className="grid gap-4 border-l border-ink pl-5">
            <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
              Current password
              <input
                className="border-b border-ink bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
              />
            </label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
              New password
              <input
                className="border-b border-ink bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
                name="newPassword"
                type="password"
                autoComplete="new-password"
              />
            </label>
            <SubmitButton label="Change password" />
          </form>
        </section>
      </div>
    </main>
  );
}
