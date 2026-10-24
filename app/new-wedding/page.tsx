import { NewWeddingForm } from "@/components/wedding/auth-forms";
import { AuthLayout } from "@/components/wedding/auth-layout";

export default function NewWeddingPage() {
  return (
    <AuthLayout
      title="Create your wedding"
      description="We'll set up a starter checklist with about 40 tasks, with the big decisions first."
    >
      <NewWeddingForm />
    </AuthLayout>
  );
}
