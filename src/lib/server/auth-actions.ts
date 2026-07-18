"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCurrentServerAuthUser, logDevelopmentAuthRedirect } from "@/lib/server/auth";

export async function logoutAction() {
  const authUser = await getCurrentServerAuthUser();

  await auth.api.signOut({
    headers: await headers(),
  });

  logDevelopmentAuthRedirect(
    "/login",
    authUser?.userId ?? null,
    authUser?.role ?? null,
  );
  redirect("/login");
}
