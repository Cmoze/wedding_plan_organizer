import { connection } from "next/server";
import { Suspense } from "react";
import { AuthLayout } from "@/components/wedding/auth-layout";
import { formatDate, weddingTitle } from "@/components/wedding/format";
import { RsvpForm } from "@/components/wedding/rsvp-form";
import { getRsvpWedding } from "@/lib/db/rsvp";
import { createAdminClient } from "@/lib/db/supabase/admin";

type Params = Promise<{ weddingId: string }>;

export default function RsvpPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <AuthLayout title="RSVP" description="Opening your invitation...">
          {null}
        </AuthLayout>
      }
    >
      <Rsvp params={params} />
    </Suspense>
  );
}

async function Rsvp({ params }: { params: Params }) {
  const { weddingId } = await params;
  await connection();
  // Guests have no account: the admin client reads just the couple's names and date.
  const wedding = await getRsvpWedding(createAdminClient(), weddingId);

  if (!wedding) {
    return (
      <AuthLayout
        title="This RSVP link doesn't work"
        description="It may have been typed wrong. Try scanning the QR code on your invitation again, or reach out to the couple."
      >
        {null}
      </AuthLayout>
    );
  }

  const title = weddingTitle(wedding);
  return (
    <AuthLayout
      title={`RSVP to ${title}'s wedding`}
      description={
        wedding.wedding_date
          ? `${formatDate(wedding.wedding_date)}. Find your invitation by entering your name.`
          : "Find your invitation by entering your name."
      }
    >
      <RsvpForm weddingId={wedding.id} />
    </AuthLayout>
  );
}
