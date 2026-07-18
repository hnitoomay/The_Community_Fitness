import { LoginScreen } from "@/components/client/screens/login-screen";
import { redirectAuthenticatedUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await redirectAuthenticatedUser("/auth/continue");

  return <LoginScreen />;
}
