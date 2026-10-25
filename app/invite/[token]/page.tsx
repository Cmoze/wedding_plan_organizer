import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOutAction, switchWeddingAction } from "@/app/actions";
import { AuthLayout } from "@/components/wedding/auth-layout";
import { formatDate, weddingTitle } from "@/components/wedding/format";
import { AcceptInviteForm } from "@/components/wedding/invite-forms";
import { ROLE_INFO } from "@/components/wedding/roles";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { getInvitePreview } from "@/lib/db/invites";
import { createClient } from "@/lib/db/supabase/server";
import { getMyMembership } from "@/lib/db/weddings";

type Params = Promise<{ token: string }>;

export default function InvitePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <AuthLayout title="You're invited" description="Opening your invite...">
          {null}
        </AuthLayout>
      }
    >
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: { params: Params }) {
  const { token } = await params;
  await connection();
  const db = await createClient();
  const [preview, user] = await Promise.all([
    getInvitePreview(db, token),
    getCurrentUser(db),
  ]);

  if (!preview) {
    return (
      <AuthLayout
        title="This invite link doesn't work"
        description="It may have been cancelled or copied wrong. Ask the couple to send you a new one."
      >
        <HomeLink signedIn={!!user} />
      </AuthLayout>
    );
  }

  const title = weddingTitle({
    partner1_name: preview.partner1Name,
    partner2_name: preview.partner2Name,
  });
  const membership = user ? await getMyMembership(db, preview.weddingId) : null;

  if (membership) {
    return (
      <AuthLayout
        title={`You're on ${title}'s team`}
        description="You already joined this wedding."
      >
        <form action={switchWeddingAction}>
          <input type="hidden" name="weddingId" value={preview.weddingId} />
          <button type="submit" className={`${primaryButtonClass} w-full`}>
            Open the wedding
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (preview.accepted || preview.expired) {
    return (
      <AuthLayout
        title={
          preview.accepted
            ? "This invite was already used"
            : "This invite has expired"
        }
        description={`Ask ${title} to send you a new invite.`}
      >
        <HomeLink signedIn={!!user} />
      </AuthLayout>
    );
  }

  const role = ROLE_INFO[preview.role];
  const description = `${preview.weddingDate ? `The big day is ${formatDate(preview.weddingDate)}. ` : ""}As a ${role.label.toLowerCase()} you can ${role.youCan}.`;

  if (!user) {
    return (
      <AuthLayout
        title={`Help plan ${title}'s wedding`}
        description={description}
      >
        <div className="space-y-3">
          {preview.email && (
            <p className="text-base text-[#695b60]">
              This invite is for <strong>{preview.email}</strong>. Use that
              email to sign up or log in.
            </p>
          )}
          <Link
            href={`/signup?invite=${token}`}
            className={`${primaryButtonClass} w-full`}
          >
            Create an account
          </Link>
          <Link
            href={`/login?invite=${token}`}
            className={`${secondaryButtonClass} w-full`}
          >
            I already have an account
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (preview.email && preview.email !== user.email?.toLowerCase()) {
    return (
      <AuthLayout
        title="This invite is for a different email"
        description={`${title} invited ${preview.email}, but you're logged in as ${user.email}.`}
      >
        <form action={signOutAction}>
          <input type="hidden" name="invite" value={token} />
          <button type="submit" className={`${primaryButtonClass} w-full`}>
            Log out and use {preview.email}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Help plan ${title}'s wedding`}
      description={description}
    >
      <AcceptInviteForm token={token} suggestedName={user.displayName ?? ""} />
    </AuthLayout>
  );
}

function HomeLink({ signedIn }: { signedIn: boolean }) {
  return (
    <Link
      href={signedIn ? "/" : "/login"}
      className={`${secondaryButtonClass} w-full`}
    >
      {signedIn ? "Go to my weddings" : "Log in"}
    </Link>
  );
}
