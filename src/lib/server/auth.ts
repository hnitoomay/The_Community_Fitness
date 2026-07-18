import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { query } from "@/lib/server/db";

type BetterAuthSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;

interface DatabaseRoleRow {
  role: string | null;
}

export interface ServerAuthUser {
  userId: string;
  role: string | null;
  isAdmin: boolean;
}

export interface AuthenticatedServerUser extends ServerAuthUser {
  session: BetterAuthSession;
}

function normalizeRoleValue(role: string) {
  return role.trim().toLowerCase();
}

function shortenUserId(userId: string | null | undefined) {
  if (!userId) {
    return "anonymous";
  }

  if (userId.length <= 8) {
    return userId;
  }

  return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
}

function logDevelopmentRedirect(
  destination: string,
  userId: string | null | undefined,
  role: string | null | undefined,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(
    `[auth] user=${shortenUserId(userId)} role=${role ?? "null"} redirect=${destination}`,
  );
}

export function logDevelopmentAuthRedirect(
  destination: string,
  userId: string | null | undefined,
  role: string | null | undefined,
) {
  logDevelopmentRedirect(destination, userId, role);
}

async function readCurrentDatabaseRole(userId: string) {
  const result = await query<DatabaseRoleRow>(
    `
      SELECT role
      FROM auth_users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0]?.role ?? null;
}

async function buildAuthenticatedServerUser(
  session: BetterAuthSession,
): Promise<AuthenticatedServerUser> {
  const role = await readCurrentDatabaseRole(session.user.id);

  return {
    session,
    userId: session.user.id,
    role,
    isAdmin: userHasRole(role, "admin"),
  };
}

export function getUserRoles(role: string | null | undefined) {
  if (!role) {
    return [];
  }

  return role
    .split(",")
    .map(normalizeRoleValue)
    .filter(Boolean);
}

export function userHasRole(
  role: string | null | undefined,
  expectedRole: string,
) {
  const normalizedExpectedRole = normalizeRoleValue(expectedRole);

  return getUserRoles(role).includes(normalizedExpectedRole);
}

export function resolveAdminRedirectDestination(
  authUser: ServerAuthUser | null,
) {
  if (!authUser) {
    return "/login";
  }

  return authUser.isAdmin ? null : "/home";
}

export function resolvePostLoginDestination(
  authUser: ServerAuthUser | null,
) {
  if (!authUser) {
    return "/login";
  }

  return authUser.isAdmin ? "/admin" : "/home";
}

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentServerAuthUser(): Promise<ServerAuthUser | null> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return null;
  }

  const authUser = await buildAuthenticatedServerUser(session);

  return {
    userId: authUser.userId,
    role: authUser.role,
    isAdmin: authUser.isAdmin,
  };
}

export async function requireAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    logDevelopmentRedirect("/login", null, null);
    redirect("/login");
  }

  return buildAuthenticatedServerUser(session);
}

export async function requireAdminUser() {
  const authUser = await requireAuthenticatedUser();
  const destination = resolveAdminRedirectDestination(authUser);

  if (destination) {
    logDevelopmentRedirect(destination, authUser.userId, authUser.role);
    redirect(destination);
  }

  return authUser;
}

export async function redirectAuthenticatedUser(destination = "/auth/continue") {
  const authUser = await getCurrentServerAuthUser();

  if (!authUser) {
    return;
  }

  logDevelopmentRedirect(destination, authUser.userId, authUser.role);
  redirect(destination);
}

export async function requireAuthenticatedUserOrRedirect(_nextPath: string) {
  void _nextPath;
  return requireAuthenticatedUser();
}

export async function requireAdminUserOrRedirect(_nextPath = "/admin") {
  void _nextPath;
  return requireAdminUser();
}

export const __testing__ = {
  getUserRoles,
  resolveAdminRedirectDestination,
  resolvePostLoginDestination,
  shortenUserId,
  userHasRole,
};
