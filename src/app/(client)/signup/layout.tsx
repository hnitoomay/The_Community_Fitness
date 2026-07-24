import { AuthRouteViewport } from "@/components/client/auth/auth-route-viewport";

export default function SignupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthRouteViewport>{children}</AuthRouteViewport>;
}
