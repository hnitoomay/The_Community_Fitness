import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { __testing__ } from "./auth";

const {
  getUserRoles,
  resolveAdminRedirectDestination,
  resolvePostLoginDestination,
  userHasRole,
} = __testing__;

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("unauthenticated /admin access redirects to /login", () => {
  assert.equal(resolveAdminRedirectDestination(null), "/login");
});

test("normal user /admin access redirects to /home", () => {
  assert.equal(
    resolveAdminRedirectDestination({
      userId: "user_1234",
      role: "user",
      isAdmin: false,
    }),
    "/home",
  );
});

test("admin /admin access succeeds", () => {
  assert.equal(
    resolveAdminRedirectDestination({
      userId: "admin_1234",
      role: "user,admin",
      isAdmin: true,
    }),
    null,
  );
});

test("normal user /auth/continue redirects to /home", () => {
  assert.equal(
    resolvePostLoginDestination({
      userId: "user_1234",
      role: "user",
      isAdmin: false,
    }),
    "/home",
  );
});

test("admin /auth/continue redirects to /admin", () => {
  assert.equal(
    resolvePostLoginDestination({
      userId: "admin_1234",
      role: "admin",
      isAdmin: true,
    }),
    "/admin",
  );
});

test("comma-separated roles are parsed safely", () => {
  assert.deepEqual(getUserRoles(" user , admin "), ["user", "admin"]);
  assert.equal(userHasRole("user,admin", "admin"), true);
  assert.equal(userHasRole("user, coach", "admin"), false);
});

test("Google login uses /auth/continue", () => {
  const loginScreenSource = readProjectFile(
    "src/components/client/screens/login-screen.tsx",
  );

  assert.match(loginScreenSource, /callbackURL:\s*"\/auth\/continue"/);
  assert.match(loginScreenSource, /newUserCallbackURL:\s*"\/auth\/continue"/);
});

test("email login uses /auth/continue", () => {
  const loginScreenSource = readProjectFile(
    "src/components/client/screens/login-screen.tsx",
  );

  assert.match(loginScreenSource, /router\.replace\("\/auth\/continue"\)/);
});

test("no successful login redirects to /settings or stale next routes", () => {
  const loginScreenSource = readProjectFile(
    "src/components/client/screens/login-screen.tsx",
  );
  const loginPageSource = readProjectFile("src/app/(client)/login/page.tsx");

  assert.doesNotMatch(loginScreenSource, /router\.(push|replace)\("\/settings"\)/);
  assert.doesNotMatch(loginScreenSource, /callbackURL:\s*nextRoute/);
  assert.doesNotMatch(loginScreenSource, /nextRoute/);
  assert.doesNotMatch(loginPageSource, /searchParams/);
  assert.doesNotMatch(loginPageSource, /next/);
});

test("unauthenticated /assessment access redirects to /login", () => {
  const assessmentPageSource = readProjectFile("src/app/(client)/assessment/page.tsx");

  assert.match(assessmentPageSource, /await requireAuthenticatedUser\(\)/);
});

test("direct authenticated access to /assessment does not require query parameters", () => {
  const assessmentPageSource = readProjectFile("src/app/(client)/assessment/page.tsx");

  assert.doesNotMatch(assessmentPageSource, /searchParams/);
  assert.doesNotMatch(assessmentPageSource, /saved=preferences|updated=true/);
});

test("admin Server Actions reject normal users by calling requireAdminUser", () => {
  const adminActionFiles = [
    "src/app/admin/body-goals/actions.ts",
    "src/app/admin/equipment/actions.ts",
    "src/app/admin/exercises/actions.ts",
    "src/app/admin/foods/actions.ts",
    "src/app/admin/nutrition-templates/actions.ts",
    "src/app/admin/workout-templates/actions.ts",
  ];

  for (const relativePath of adminActionFiles) {
    const source = readProjectFile(relativePath);

    assert.match(
      source,
      /await requireAdminUser\(\);/,
      `${relativePath} must call requireAdminUser()`,
    );
  }
});

test("admin dashboard and client routes require admin authorization before rendering", () => {
  const protectedAdminPages = [
    "src/app/admin/page.tsx",
    "src/app/admin/clients/page.tsx",
    "src/app/admin/clients/[id]/page.tsx",
    "src/app/admin/clients/[id]/plans/[planId]/page.tsx",
  ];

  for (const relativePath of protectedAdminPages) {
    const source = readProjectFile(relativePath);

    assert.match(
      source,
      /await requireAdminUser\(\);/,
      `${relativePath} must call requireAdminUser()`,
    );
  }
});
