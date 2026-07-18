import { SignupScreen } from "@/components/client/screens/signup-screen";
import { redirectAuthenticatedUser } from "@/lib/server/auth";

export default async function SignupPage() {
  await redirectAuthenticatedUser("/auth/continue");

  return <SignupScreen />;
}
