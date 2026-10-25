import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart, Search } from "lucide-react";
import { AuthLayout } from "@/components/wedding/auth-layout";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const inviteToken =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readInviteToken(value: string) {
  const input = value.trim();
  if (inviteToken.test(input)) return input;
  try {
    const url = new URL(input);
    const match = url.pathname.match(/\/invite\/([^/]+)/i);
    return match && inviteToken.test(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
}

export default async function FindEventPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = typeof params.invite === "string" ? params.invite : "";
  const token = raw ? readInviteToken(raw) : null;
  if (token) redirect(`/invite/${token}`);

  return (
    <AuthLayout
      title="Find your wedding"
      description="Paste the invitation link or code your couple shared with you."
    >
      <form action="/find-event" className="space-y-5">
        <label
          className="block text-sm font-bold text-[#492734]"
          htmlFor="invite"
        >
          Invitation link or code
        </label>
        <input
          autoComplete="url"
          className="min-h-14 w-full rounded-xl border border-[#d9c4cb] bg-white px-4 text-base text-[#35151f] transition outline-none placeholder:text-[#99868d] focus:border-[#8c3c58] focus:ring-4 focus:ring-[#8c3c58]/10"
          id="invite"
          name="invite"
          placeholder="Paste your wedding invite here"
          required
          type="text"
        />
        {raw && !token && (
          <p className="-mt-2 text-sm font-medium text-[#9a3346]" role="alert">
            That link or code doesn’t look right. Ask the couple to resend their
            invitation.
          </p>
        )}
        <button
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#6f1d37] px-5 font-bold text-white transition hover:bg-[#58172c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1d37]"
          type="submit"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          Open invitation
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3 border-t border-[#eee5e7] pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#6f1d37] hover:text-[#4c172c]"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Together
        </Link>
        <span className="inline-flex items-center gap-2 text-[#77676d]">
          <Heart className="h-4 w-4 text-[#8c3c58]" aria-hidden="true" />
          Made to plan together
        </span>
      </div>
    </AuthLayout>
  );
}
