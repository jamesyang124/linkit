"use client";

import { useActionState, useEffect, useState } from "react";
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

export function ProfileForms({ currentUsername }: { currentUsername: string | null }) {
  const [usernameState, usernameAction] = useActionState(updateUsernameAction, null);
  const [passwordState, passwordAction] = useActionState(changePasswordAction, null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (usernameState?.error) showToast(usernameState.error, "error");
    else if (usernameState?.success) showToast(usernameState.success, "success");
  }, [usernameState]);

  useEffect(() => {
    if (passwordState?.error) showToast(passwordState.error, "error");
    else if (passwordState?.success) showToast(passwordState.success, "success");
  }, [passwordState]);

  return (
    <div className="grid gap-12 max-w-md">
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.24em] text-muted">
          Username
        </h2>
        {currentUsername && (
          <p className="mb-3 text-sm text-ink">
            Current: <span className="font-medium">{currentUsername}</span>
          </p>
        )}
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
            <div className="relative flex items-center border-b border-ink">
              <input
                className="flex-1 bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="shrink-0 px-2 text-muted transition hover:text-ink"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </label>
          <SubmitButton label="Change password" />
        </form>
      </section>
    </div>
  );
}
