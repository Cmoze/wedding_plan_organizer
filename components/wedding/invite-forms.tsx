"use client";

import { Check, Copy, Mail } from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  acceptInviteAction,
  createInviteAction,
  type FormState,
  type InviteFormState,
} from "@/app/actions";
import { formatDate } from "@/components/wedding/format";
import { ROLE_INFO } from "@/components/wedding/roles";
import {
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import { inviteUrl } from "@/lib/db/invites";
import type { MemberRole } from "@/lib/db/weddings";

/** The site's origin in the browser, "" while rendering on the server. */
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

type InviteDetails = {
  token: string;
  email: string | null;
  role: MemberRole;
  expiresAt: string;
};

/** A mailto: link that opens the inviter's own email app with the invite written out. */
function inviteMailto(
  origin: string,
  invite: InviteDetails,
  inviterName: string,
  weddingTitle: string,
) {
  const link = inviteUrl(origin, invite.token);
  const role = ROLE_INFO[invite.role];
  const subject = `Help us plan ${weddingTitle}'s wedding`;
  const body = [
    "Hi!",
    "",
    `${inviterName} invited you to help plan ${weddingTitle}'s wedding on Together, our wedding planning app.`,
    `As a ${role.label.toLowerCase()} you can ${role.youCan}.`,
    "",
    `Join here: ${link}`,
    "",
    ...(invite.email
      ? [
          `Create your account (or log in) with this email address, ${invite.email}, so the invite works.`,
        ]
      : []),
    `The link expires on ${formatDate(invite.expiresAt)}.`,
  ].join("\n");
  const to = invite.email ? encodeURIComponent(invite.email) : "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function InviteForm({
  weddingId,
  roles,
  inviterName,
  weddingTitle,
}: {
  weddingId: string;
  roles: MemberRole[];
  inviterName: string;
  weddingTitle: string;
}) {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    createInviteAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const origin = useOrigin();
  const invite = state.invite && {
    token: state.invite.token,
    email: state.invite.email,
    role: state.invite.role,
    expiresAt: state.invite.expires_at,
  };
  const mailto =
    invite && origin
      ? inviteMailto(origin, invite, inviterName, weddingTitle)
      : null;

  useEffect(() => {
    if (!mailto) return;
    formRef.current?.reset();
    window.location.href = mailto;
  }, [mailto]);

  return (
    <div className="mt-4 space-y-5">
      <form
        ref={formRef}
        action={action}
        className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto]"
      >
        <input type="hidden" name="weddingId" value={weddingId} />
        <Field label="Their email">
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className={inputClass}
            placeholder="aunt.linda@gmail.com"
          />
        </Field>
        <Field label="What they can do">
          <select name="role" defaultValue="helper" className={inputClass}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_INFO[r].label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className={`${primaryButtonClass} w-full`}
          >
            {pending ? "Creating..." : "Invite"}
          </button>
        </div>
      </form>
      <ul className="space-y-1 text-base text-[#52635a]">
        {roles.map((r) => (
          <li key={r}>
            <span className="font-semibold text-[#2d4a3f]">
              {ROLE_INFO[r].label}:
            </span>{" "}
            {ROLE_INFO[r].description}
          </li>
        ))}
      </ul>
      <FormMessage error={state.error} />
      {invite && (
        <div
          role="status"
          className="space-y-3 rounded-2xl bg-[#e3efe6] px-5 py-4 text-[#24553f]"
        >
          <p className="text-base font-semibold">
            Invite ready for {invite.email}. Your email app should open with the
            message written for you. Just press send.
          </p>
          <InviteLinkActions
            invite={invite}
            inviterName={inviterName}
            weddingTitle={weddingTitle}
          />
        </div>
      )}
    </div>
  );
}

/** "Email" (opens the user's email app) and "Copy link" for one invite. */
export function InviteLinkActions({
  invite,
  inviterName,
  weddingTitle,
}: {
  invite: InviteDetails;
  inviterName: string;
  weddingTitle: string;
}) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  if (!origin) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={inviteMailto(origin, invite, inviterName, weddingTitle)}
        className={secondaryButtonClass}
      >
        <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
        {invite.email ? "Email the invite" : "Write an email"}
      </a>
      <button
        type="button"
        className={secondaryButtonClass}
        onClick={async () => {
          await navigator.clipboard.writeText(inviteUrl(origin, invite.token));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? (
          <Check className="mr-2 h-5 w-5" aria-hidden="true" />
        ) : (
          <Copy className="mr-2 h-5 w-5" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

export function AcceptInviteForm({
  token,
  suggestedName,
}: {
  token: string;
  suggestedName: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const next = await acceptInviteAction(prev, form);
      // Navigate here, not in an effect: joining re-renders this page into its
      // "already joined" view, which unmounts the form.
      if (next.redirectTo) window.location.assign(next.redirectTo);
      return next;
    },
    {},
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="invite" value={token} />
      <Field label="Your name" hint="How the rest of the team will see you.">
        <input
          name="displayName"
          defaultValue={suggestedName}
          autoComplete="name"
          className={inputClass}
        />
      </Field>
      <FormMessage error={state.error} />
      <button
        type="submit"
        disabled={pending || !!state.redirectTo}
        className={`${primaryButtonClass} w-full`}
      >
        {pending || state.redirectTo ? "Joining..." : "Join the wedding"}
      </button>
    </form>
  );
}
