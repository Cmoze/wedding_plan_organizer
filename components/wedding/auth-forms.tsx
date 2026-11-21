"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  createWeddingAction,
  signInAction,
  signUpAction,
  type FormState,
} from "@/app/actions";
import {
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
} from "@/components/wedding/ui";

/** Keeps an invite token across login and sign-up so the user lands back on the invite. */
const withInvite = (path: string, invite?: string) =>
  invite ? `${path}?invite=${invite}` : path;

function InviteNote({ joining }: { joining?: string }) {
  if (!joining) return null;
  return (
    <p className="rounded-xl bg-[#f4e7eb] px-4 py-3 text-base text-[#6f1d37]">
      You&apos;re joining <strong>{joining}</strong>&apos;s wedding. Use the
      email address the invite was sent to.
    </p>
  );
}

export function LoginForm({
  invite,
  joining,
}: { invite?: string; joining?: string } = {}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signInAction,
    {},
  );
  return (
    <form action={action} className="space-y-5">
      <InviteNote joining={joining} />
      {invite && <input type="hidden" name="invite" value={invite} />}
      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <FormMessage error={state.error} message={state.message} />
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} w-full`}
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
      <p className="text-center text-base text-[#695b60]">
        New here?{" "}
        <Link
          href={withInvite("/signup", invite)}
          className="font-bold text-[#6f1d37] underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({
  invite,
  joining,
  email,
}: { invite?: string; joining?: string; email?: string } = {}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUpAction,
    {},
  );
  return (
    <form action={action} className="space-y-5">
      <InviteNote joining={joining} />
      {invite && <input type="hidden" name="invite" value={invite} />}
      <Field label="Your name" hint="How others in the wedding will see you.">
        <input name="displayName" autoComplete="name" className={inputClass} />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={email}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Password" hint="At least 6 characters.">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={inputClass}
        />
      </Field>
      <FormMessage error={state.error} message={state.message} />
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} w-full`}
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-base text-[#695b60]">
        Already have an account?{" "}
        <Link
          href={withInvite("/login", invite)}
          className="font-bold text-[#6f1d37] underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

export function NewWeddingForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createWeddingAction,
    {},
  );
  const [who, setWho] = useState<"partner1" | "partner2" | "other">("partner1");
  // React clears the form after a failed submit; put the choice back in step with it.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.error) setWho("partner1");
  }
  useEffect(() => {
    // A full page load: the router may still hold "/" as a redirect back here.
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Partner 1">
          <input
            name="partner1Name"
            required
            className={inputClass}
            placeholder="Maya"
          />
        </Field>
        <Field label="Partner 2">
          <input
            name="partner2Name"
            required={who === "partner2"}
            className={inputClass}
            placeholder="Jordan"
          />
        </Field>
      </div>
      <Field
        label="Wedding date"
        hint="A guess is fine. You can leave it blank for now."
      >
        <input name="weddingDate" type="date" className={inputClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Rough budget ($)">
          <input
            name="budgetTotal"
            inputMode="decimal"
            className={inputClass}
            placeholder="25000"
          />
        </Field>
        <Field label="Guest count">
          <input
            name="guestCount"
            inputMode="numeric"
            className={inputClass}
            placeholder="120"
          />
        </Field>
      </div>
      <fieldset>
        <legend className="text-base font-semibold text-[#35151f]">
          Which one are you?
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["partner1", "Partner 1"],
              ["partner2", "Partner 2"],
              ["other", "Someone else"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#d9c4cb] bg-white px-4 text-base has-checked:border-[#6f1d37] has-checked:bg-[#f9eef1]"
            >
              <input
                type="radio"
                name="who"
                value={value}
                checked={who === value}
                onChange={() => setWho(value)}
                className="accent-[#6f1d37]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {who === "other" && (
        <p className="-mt-2 text-sm text-[#695b60]">
          You&apos;ll join as a planner and can invite the couple next.
        </p>
      )}
      {who === "other" && (
        <Field label="Your name" hint="How others in the wedding will see you.">
          <input
            name="displayName"
            required
            autoComplete="name"
            className={inputClass}
          />
        </Field>
      )}
      <FormMessage error={state.error} message={state.message} />
      <button
        type="submit"
        disabled={pending || !!state.redirectTo}
        className={`${primaryButtonClass} w-full`}
      >
        {pending || state.redirectTo
          ? "Setting up your wedding..."
          : who === "other"
            ? "Create the wedding"
            : "Create our wedding"}
      </button>
    </form>
  );
}
