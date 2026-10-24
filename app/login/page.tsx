import { Suspense } from "react";
import { LoginForm } from "@/components/wedding/auth-forms";
import { inviteFromSearch } from "@/components/wedding/auth-invite";
import { AuthLayout } from "@/components/wedding/auth-layout";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to see your wedding plans."
    >
      <Suspense fallback={<LoginForm />}>
        <InviteLogin searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function InviteLogin({ searchParams }: { searchParams: SearchParams }) {
  const { invite, joining } = await inviteFromSearch(searchParams);
  return <LoginForm invite={invite} joining={joining} />;
}
