import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("edit profile does not contain body measurement inputs", () => {
  const source = readProjectFile("src/components/client/screens/edit-profile-screen.tsx");

  assert.doesNotMatch(source, /Height \(cm\)/);
  assert.doesNotMatch(source, /Weight \(kg\)/);
  assert.doesNotMatch(source, /Body Fat \(%\)/);
});

test("measurement page does not edit stable identity fields", () => {
  const source = readProjectFile("src/components/client/screens/measurement-update-screen.tsx");

  assert.doesNotMatch(source, /Full Name/);
  assert.doesNotMatch(source, /Email Address/);
  assert.doesNotMatch(source, /Date of Birth/);
});

test("profile page shows full name and gender as read-only summary values", () => {
  const source = readProjectFile("src/components/client/screens/profile-screen.tsx");

  assert.match(source, /Basic Profile/);
  assert.match(source, /Full Name/);
  assert.match(source, /Gender/);
  assert.match(source, /formatSummaryValue\(initialData\.basicProfile\.fullName\)/);
  assert.match(source, /formatGenderValue\(initialData\.basicProfile\.gender\)/);
  assert.doesNotMatch(source, /placeholder="Enter your full name"/);
  assert.doesNotMatch(source, /Select gender/);
});

test("profile page links stable profile edits to account settings", () => {
  const source = readProjectFile("src/components/client/screens/profile-screen.tsx");

  assert.match(source, /Edit in Account Settings/);
  assert.match(source, /href="\/settings\/profile"/);
});

test("profile page uses the date-of-birth age utility and shows the legacy fallback notice", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/client-onboarding-repository.ts");
  const screenSource = readProjectFile("src/components/client/screens/profile-screen.tsx");

  assert.match(repositorySource, /resolveCurrentAge/);
  assert.match(repositorySource, /date_of_birth::text/);
  assert.match(screenSource, /Add your date of birth in Account Settings\./);
});

test("profile page keeps body measurements editable", () => {
  const source = readProjectFile("src/components/client/screens/profile-screen.tsx");

  assert.match(source, /Body Measurements/);
  assert.match(source, /Height \(cm\)/);
  assert.match(source, /Body Fat \(%\)/);
  assert.match(source, /setMeasurements/);
  assert.match(source, /<Input/);
});

test("settings profile email is read-only", () => {
  const source = readProjectFile("src/components/client/screens/edit-profile-screen.tsx");

  assert.match(source, /readOnly disabled aria-readonly="true"/);
  assert.match(source, /label="Email Address"/);
});

test("profile actions reject future birth dates", () => {
  const source = readProjectFile("src/app/(client)/settings/profile/actions.ts");

  assert.match(source, /isFutureDateOfBirth/);
  assert.match(source, /Date of birth cannot be in the future\./);
});

test("latest measurements prefill from the newest saved snapshot", () => {
  const pageSource = readProjectFile("src/app/(client)/measurements/new/page.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/profile-settings-repository.ts");

  assert.match(pageSource, /getLatestMeasurementSnapshotForUser\(authUser\.userId\)/);
  assert.match(repositorySource, /ORDER BY \$\{latestMeasurementOrderBy\(\)\}/);
  assert.match(repositorySource, /LIMIT 1/);
});

test("unchanged measurements create no new row and changed measurements insert exactly one row", () => {
  const source = readProjectFile("src/lib/server/repositories/profile-settings-repository.ts");

  assert.match(source, /if \(!shouldInsert\) \{/);
  assert.match(source, /didInsertMeasurement: false/);
  assert.match(source, /INSERT INTO body_measurements/);
});

test("profile measurement submission only accepts measurement values and does not update stable profile fields", () => {
  const actionSource = readProjectFile("src/app/(client)/profile/actions.ts");
  const repositorySource = readProjectFile("src/lib/server/repositories/profile-settings-repository.ts");

  assert.match(actionSource, /input: BodyMeasurementsDraft/);
  assert.match(actionSource, /saveMeasurementSnapshotForUser/);
  assert.doesNotMatch(actionSource, /fullName|dateOfBirth|gender|email|profile image/i);
  assert.match(repositorySource, /export async function saveMeasurementSnapshotForUser/);
  assert.match(repositorySource, /INSERT INTO body_measurements/);
});

test("google-only accounts do not show a working password form", () => {
  const source = readProjectFile("src/components/client/screens/settings-screen.tsx");

  assert.match(source, /This account signs in with Google\. Password change is not available\./);
  assert.match(source, /hasCredentialAccount \?/);
});

test("credential accounts use the Better Auth change-password flow", () => {
  const source = readProjectFile("src/components/client/screens/settings-screen.tsx");

  assert.match(source, /authClient\.changePassword\(/);
  assert.match(source, /currentPassword/);
  assert.match(source, /newPassword/);
});

test("profile and measurement updates are always scoped to the authenticated user", () => {
  const profileActionSource = readProjectFile("src/app/(client)/settings/profile/actions.ts");
  const onboardingProfileActionSource = readProjectFile("src/app/(client)/profile/actions.ts");
  const onboardingProfilePageSource = readProjectFile("src/app/(client)/profile/page.tsx");
  const measurementActionSource = readProjectFile("src/app/(client)/measurements/new/actions.ts");
  const onboardingRepositorySource = readProjectFile("src/lib/server/repositories/client-onboarding-repository.ts");
  const repositorySource = readProjectFile("src/lib/server/repositories/profile-settings-repository.ts");

  assert.match(profileActionSource, /requireAuthenticatedUser\(/);
  assert.match(onboardingProfileActionSource, /requireAuthenticatedUser\(/);
  assert.match(onboardingProfilePageSource, /getClientProfilePageData\(authUser\.userId\)/);
  assert.match(measurementActionSource, /requireAuthenticatedUser\(/);
  assert.match(onboardingRepositorySource, /WHERE au\.id = \$1/);
  assert.match(repositorySource, /WHERE id = \$1/);
  assert.match(repositorySource, /WHERE user_id = \$1/);
});

test("assessment and plan input construction prefer date_of_birth with legacy age fallback", () => {
  const assessmentRepositorySource = readProjectFile("src/lib/server/repositories/ai-assessment-repository.ts");
  const planRepositorySource = readProjectFile("src/lib/server/repositories/generated-plan-repository.ts");

  assert.match(assessmentRepositorySource, /cp\.date_of_birth::text/);
  assert.match(assessmentRepositorySource, /resolveCurrentAge/);
  assert.match(planRepositorySource, /cp\.date_of_birth::text/);
  assert.match(planRepositorySource, /resolveCurrentAge/);
});
