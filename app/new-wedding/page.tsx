import { NewWeddingForm } from "@/components/wedding/auth-forms";
import { AuthLayout } from "@/components/wedding/auth-layout";

export default function NewWeddingPage() {
  return (
    <AuthLayout
      title="Create your wedding"
      description="Next, you'll pick the to-dos that fit your wedding from a list of what most couples plan."
    >
      <NewWeddingForm />
    </AuthLayout>
  );
}
