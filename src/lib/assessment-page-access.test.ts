import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("home page no longer contains direct AI Assessment navigation", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.doesNotMatch(source, /AI Assessment/);
});

test("drawer or account settings contains direct AI Assessment navigation", () => {
  const drawerSource = readProjectFile("src/data/client.ts");
  const settingsSource = readProjectFile("src/components/client/screens/settings-screen.tsx");

  assert.match(drawerSource, /href: "\/assessment"/);
  assert.match(settingsSource, /router\.push\("\/assessment"\)/);
});

test("page refresh does not call OpenRouter automatically", () => {
  const pageSource = readProjectFile("src/app/(client)/assessment/page.tsx");
  const screenSource = readProjectFile("src/components/client/screens/assessment-screen.tsx");

  assert.doesNotMatch(pageSource, /generateAiAssessment\(/);
  assert.doesNotMatch(pageSource, /generateAssessmentAction\(/);
  assert.doesNotMatch(screenSource, /useEffect\(/);
});
