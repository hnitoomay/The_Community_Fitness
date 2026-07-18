import { ClientSessionProvider } from "@/components/client/client-session-provider";

export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ClientSessionProvider>{children}</ClientSessionProvider>;
}
