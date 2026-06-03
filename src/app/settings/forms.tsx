"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { changePasswordAction, updateNameAction } from "@/app/settings-actions";
import { PasswordInput } from "@/components/password-input";
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

export function ProfileForms({ currentName }: { currentName: string | null }) {
  const [nameState, nameAction] = useActionState(updateNameAction, null);
  const [passwordState, passwordAction] = useActionState(changePasswordAction, null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (nameState?.error) showToast(nameState.error, "error");
    else if (nameState?.success) showToast(nameState.success, "success");
  }, [nameState]);

  useEffect(() => {
    if (passwordState?.error) {
      showToast(passwordState.error, "error");
      if (passwordState.field === "currentPassword") setCurrentPassword("");
      else if (passwordState.field === "newPassword") setNewPassword("");
    } else if (passwordState?.success) {
      showToast(passwordState.success, "success");
      setCurrentPassword("");
      setNewPassword("");
    }
  }, [passwordState]);

  return (
    <div className="grid gap-12 max-w-md">
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.24em] text-muted">
          Name
        </h2>
        {currentName && (
          <p className="mb-3 text-sm text-ink">
            Current: <span className="font-medium">{currentName}</span>
          </p>
        )}
        <p className="mb-4 text-sm text-muted">
          Your public display name in comments. Leave unset to appear as Anonymous.
        </p>
        <form action={nameAction} className="grid gap-4 border-l border-ink pl-5">
          <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
            New name
            <input
              className="border-b border-ink bg-transparent py-3 text-base normal-case tracking-normal text-ink outline-none"
              name="name"
              autoComplete="name"
              placeholder="e.g. Ada Lovelace"
            />
          </label>
          <SubmitButton label="Save name" />
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.24em] text-muted">
          Change password
        </h2>
        <form action={passwordAction} className="grid gap-4 border-l border-ink pl-5">
          <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
            Current password
            <PasswordInput
              name="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-[0.24em] text-muted">
            New password
            <PasswordInput
              name="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
          </label>
          <SubmitButton label="Change password" />
        </form>
      </section>
    </div>
  );
}
