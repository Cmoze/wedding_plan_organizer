import { SignUpForm } from "@/components/wedding/auth-forms";
import { AuthLayout } from "@/components/wedding/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Plan the wedding together with your family and friends."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
