import { Suspense } from "react";
import { SignUpForm } from "@/components/wedding/auth-forms";
import { inviteFromSearch } from "@/components/wedding/auth-invite";
import { AuthLayout } from "@/components/wedding/auth-layout";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthLayout
      title="Create your account"
      description="Plan the wedding together with your family and friends."
    >
      <Suspense fallback={<SignUpForm />}>
        <InviteSignUp searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function InviteSignUp({ searchParams }: { searchParams: SearchParams }) {
  const props = await inviteFromSearch(searchParams);
  return <SignUpForm {...props} />;
}
