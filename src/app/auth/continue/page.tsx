import { redirect } from "next/navigation";

import {
  getCurrentServerAuthUser,
  logDevelopmentAuthRedirect,
  resolvePostLoginDestination,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function AuthContinuePage() {
  const authUser = await getCurrentServerAuthUser();
  const destination = resolvePostLoginDestination(authUser);

  logDevelopmentAuthRedirect(
    destination,
    authUser?.userId ?? null,
    authUser?.role ?? null,
  );
  redirect(destination);
}
