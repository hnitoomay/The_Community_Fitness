import { AuthRouteViewport } from "@/components/client/auth/auth-route-viewport";

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthRouteViewport>{children}</AuthRouteViewport>;
}
