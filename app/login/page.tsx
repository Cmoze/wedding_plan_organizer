import { LoginForm } from "@/components/wedding/auth-forms";
import { AuthLayout } from "@/components/wedding/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to see your wedding plans."
    >
      <LoginForm />
    </AuthLayout>
  );
}
