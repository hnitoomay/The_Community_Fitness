import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("date-of-birth utility calculates age using calendar-date comparisons", () => {
  const source = readProjectFile("src/lib/date-of-birth.ts");

  assert.match(source, /let age = reference\.year - birth\.year/);
  assert.match(source, /reference\.monthIndex < birth\.monthIndex/);
  assert.match(source, /reference\.day < birth\.day/);
  assert.match(source, /return age >= 0 \? age : null/);
});

test("date-of-birth utility rejects future dates and supports legacy age fallback", () => {
  const source = readProjectFile("src/lib/date-of-birth.ts");

  assert.match(source, /isFutureDateOfBirth/);
  assert.match(source, /return compareDateOnly\(dateOfBirth, referenceDateOnly\) > 0/);
  assert.match(source, /return input\.legacyAge \?\? null/);
});
