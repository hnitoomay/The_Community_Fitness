import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("dashboard counts are loaded from PostgreSQL tables and exclude admin accounts", () => {
  const source = readProjectFile("src/lib/server/repositories/admin-dashboard-repository.ts");

  assert.match(source, /FROM auth_users AS au/);
  assert.match(source, /COALESCE\(au\.role, ''\) !~\*/);
  assert.match(source, /FROM generated_plans/);
  assert.match(source, /FROM workout_sessions/);
  assert.match(source, /FROM gym_equipment/);
  assert.match(source, /FROM exercises/);
  assert.match(source, /FROM body_measurements/);
});

test("dashboard no longer shows mock preview wording and recent clients come from real users", () => {
  const dashboardSource = readProjectFile("src/components/admin/screens/admin-dashboard-screen.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/admin-dashboard-repository.ts");

  assert.doesNotMatch(dashboardSource, /Preview State Only|future AI system|mock/i);
  assert.match(dashboardSource, /Recent Clients/);
  assert.match(repositorySource, /getAdminClientList/);
});

test("client list uses server-side search, filters, pagination, and calculated statuses", () => {
  const source = readProjectFile("src/lib/server/repositories/admin-client-repository.ts");

  assert.match(source, /ILIKE/);
  assert.match(source, /onboarding_completed/);
  assert.match(source, /selected_body_goal_id/);
  assert.match(source, /pageSize: 12/);
  assert.match(source, /matchesAssessmentFilter/);
  assert.match(source, /matchesPlanFilter/);
  assert.match(source, /createAssessmentInputHash/);
});

test("client age uses date_of_birth with legacy age fallback", () => {
  const source = readProjectFile("src/lib/server/repositories/admin-client-repository.ts");

  assert.match(source, /resolveCurrentAge/);
  assert.match(source, /date_of_birth::text/);
});

test("assessment and plan statuses are compared against the current normalized input hash", () => {
  const source = readProjectFile("src/lib/server/repositories/admin-client-repository.ts");

  assert.match(source, /currentInputHash = createAssessmentInputHash/);
  assert.match(source, /row\.latest_assessment_input_hash === currentInputHash/);
  assert.match(source, /row\.active_plan_source_input_hash === currentInputHash/);
});

test("client detail and admin plan view are scoped to the selected non-admin client", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/admin-client-repository.ts");
  const detailPageSource = readProjectFile("src/app/admin/clients/[id]/page.tsx");
  const planPageSource = readProjectFile("src/app/admin/clients/[id]/plans/[planId]/page.tsx");

  assert.match(repositorySource, /WHERE au\.id = \$1/);
  assert.match(repositorySource, /AND \$\{nonAdminRoleSql\}/);
  assert.match(repositorySource, /WHERE gp\.user_id = \$1\s+AND gp\.id = \$2/);
  assert.match(detailPageSource, /await requireAdminUser\(\)/);
  assert.match(planPageSource, /await requireAdminUser\(\)/);
});

test("admin client repositories do not return private authentication-account secrets and remain read-only", () => {
  const source = readProjectFile("src/lib/server/repositories/admin-client-repository.ts");

  assert.doesNotMatch(source, /auth_accounts|access_token|refresh_token|id_token|password|token/i);
  assert.doesNotMatch(source, /\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
});

test("client list and detail routes require admin authorization and keep read-only navigation", () => {
  const listPageSource = readProjectFile("src/app/admin/clients/page.tsx");
  const detailScreenSource = readProjectFile("src/components/admin/screens/admin-client-detail-screen.tsx");

  assert.match(listPageSource, /await requireAdminUser\(\)/);
  assert.match(detailScreenSource, /View Plan/);
  assert.doesNotMatch(detailScreenSource, /<form|type="submit"|Save|Update/);
});
