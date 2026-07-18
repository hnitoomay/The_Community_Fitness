import test from "node:test";
import assert from "node:assert/strict";

import { calculateAgeFromDateOfBirth } from "@/lib/date-of-birth";

import { __testing__ } from "./client-onboarding-repository";

const {
  formatMeasurementForForm,
  latestMeasurementOrderBy,
  mapProfilePageRow,
  mapSnapshotRow,
  measurementsAreEqual,
  normalizeMedicalConditions,
  normalizeOtherHealthCondition,
  normalizeMeasurementInput,
  normalizeMeasurementRow,
} = __testing__;

test("first measurement creates one row because there is no previous snapshot", () => {
  const input = normalizeMeasurementInput({
    heightCm: "170",
    weightKg: "81",
    waistCm: "84",
    chestCm: "98",
    hipCm: "95",
    armCm: "33",
    thighCm: "56",
    bodyFatPercentage: "",
  });

  assert.equal(input.heightCm, "170");
  assert.equal(input.bodyFatPercentage, null);
});

test("a user with one saved measurement sees all fields prefilled", () => {
  const snapshot = mapSnapshotRow({
    full_name: "Aye Aye",
    age: 29,
    gender: "female",
    selected_body_goal_id: null,
    onboarding_completed: false,
    preferred_language: "my",
    goal_label: null,
    goal_description: null,
    height_cm: "165.00",
    weight_kg: "58.50",
    waist_cm: "72.00",
    chest_cm: "88.00",
    hip_cm: "96.00",
    arm_cm: "29.00",
    thigh_cm: "54.00",
    body_fat_percent: "24.50",
    medical_conditions: [],
    other_health_condition: null,
    disliked_exercises: [],
    food_allergies: [],
    food_restrictions: [],
    disliked_foods: [],
  });

  assert.equal(snapshot.profile.fullName, "Aye Aye");
  assert.equal(snapshot.profile.measurements.heightCm, "165");
  assert.equal(snapshot.profile.measurements.weightKg, "58.5");
  assert.equal(snapshot.profile.measurements.waistCm, "72");
  assert.equal(snapshot.profile.measurements.chestCm, "88");
  assert.equal(snapshot.profile.measurements.hipCm, "96");
  assert.equal(snapshot.profile.measurements.armCm, "29");
  assert.equal(snapshot.profile.measurements.thighCm, "54");
  assert.equal(snapshot.profile.measurements.bodyFatPercentage, "24.5");
});

test("profile page age is calculated from date_of_birth when it exists", () => {
  const dateOfBirth = "2003-07-18";
  const profilePageData = mapProfilePageRow({
    full_name: "Hnit Oo May",
    age: 22,
    date_of_birth: dateOfBirth,
    gender: "female",
    height_cm: "165.00",
    weight_kg: "58.50",
    waist_cm: "72.00",
    chest_cm: "88.00",
    hip_cm: "96.00",
    arm_cm: "29.00",
    thigh_cm: "54.00",
    body_fat_percent: "24.50",
  });

  assert.equal(profilePageData.basicProfile.fullName, "Hnit Oo May");
  assert.equal(profilePageData.basicProfile.gender, "female");
  assert.equal(profilePageData.basicProfile.dateOfBirth, dateOfBirth);
  assert.equal(
    profilePageData.basicProfile.currentAge,
    calculateAgeFromDateOfBirth(dateOfBirth),
  );
  assert.equal(profilePageData.basicProfile.usesLegacyAgeFallback, false);
});

test("profile page falls back to the legacy age when date_of_birth is missing", () => {
  const profilePageData = mapProfilePageRow({
    full_name: "Legacy User",
    age: 31,
    date_of_birth: null,
    gender: "male",
    height_cm: null,
    weight_kg: null,
    waist_cm: null,
    chest_cm: null,
    hip_cm: null,
    arm_cm: null,
    thigh_cm: null,
    body_fat_percent: null,
  });

  assert.equal(profilePageData.basicProfile.fullName, "Legacy User");
  assert.equal(profilePageData.basicProfile.dateOfBirth, "");
  assert.equal(profilePageData.basicProfile.currentAge, 31);
  assert.equal(profilePageData.basicProfile.usesLegacyAgeFallback, true);
});

test("decimal PostgreSQL values display correctly in the profile form", () => {
  assert.equal(formatMeasurementForForm("152.00"), "152");
  assert.equal(formatMeasurementForForm("81.50"), "81.5");
  assert.equal(formatMeasurementForForm(33.2), "33.2");
});

test("nullable body fat displays as an empty optional input", () => {
  const snapshot = mapSnapshotRow({
    full_name: "Ko Ko",
    age: 34,
    gender: "male",
    selected_body_goal_id: null,
    onboarding_completed: false,
    preferred_language: "my",
    goal_label: null,
    goal_description: null,
    height_cm: "170.00",
    weight_kg: "81.00",
    waist_cm: "84.00",
    chest_cm: "98.00",
    hip_cm: "95.00",
    arm_cm: "33.00",
    thigh_cm: "56.00",
    body_fat_percent: null,
    medical_conditions: [],
    other_health_condition: null,
    disliked_exercises: [],
    food_allergies: [],
    food_restrictions: [],
    disliked_foods: [],
  });

  assert.equal(snapshot.profile.measurements.bodyFatPercentage, "");
});

test("the newest of multiple measurements is selected by the latest-measurement order", () => {
  assert.equal(
    latestMeasurementOrderBy("bm"),
    "bm.measured_at DESC NULLS LAST, bm.created_at DESC, bm.id DESC",
  );
});

test("opening the page uses a read-only latest-measurement lookup", () => {
  const orderByClause = latestMeasurementOrderBy("bm");

  assert.match(orderByClause, /DESC NULLS LAST/);
  assert.doesNotMatch(orderByClause, /INSERT|UPDATE|DELETE/i);
});

test("unchanged submission creates no new row", () => {
  const input = normalizeMeasurementInput({
    heightCm: "170.00",
    weightKg: "81.0",
    waistCm: "84",
    chestCm: "98.00",
    hipCm: "95",
    armCm: "33",
    thighCm: "56.0",
    bodyFatPercentage: "21.00",
  });
  const latest = normalizeMeasurementRow({
    height_cm: "170",
    weight_kg: "81",
    waist_cm: "84.0",
    chest_cm: "98",
    hip_cm: "95.00",
    arm_cm: "33.0",
    thigh_cm: "56",
    body_fat_percent: "21",
  });

  assert.equal(measurementsAreEqual(input, latest), true);
});

test("changing one measurement creates exactly one new row decision", () => {
  const input = normalizeMeasurementInput({
    heightCm: "170",
    weightKg: "82",
    waistCm: "84",
    chestCm: "98",
    hipCm: "95",
    armCm: "33",
    thighCm: "56",
    bodyFatPercentage: "",
  });
  const latest = normalizeMeasurementRow({
    height_cm: "170",
    weight_kg: "81",
    waist_cm: "84",
    chest_cm: "98",
    hip_cm: "95",
    arm_cm: "33",
    thigh_cm: "56",
    body_fat_percent: null,
  });

  assert.equal(measurementsAreEqual(input, latest), false);
});

test("empty and NULL body-fat values are considered equal", () => {
  const input = normalizeMeasurementInput({
    heightCm: "170",
    weightKg: "81",
    waistCm: "84",
    chestCm: "98",
    hipCm: "95",
    armCm: "33",
    thighCm: "56",
    bodyFatPercentage: "",
  });
  const latest = normalizeMeasurementRow({
    height_cm: "170",
    weight_kg: "81",
    waist_cm: "84",
    chest_cm: "98",
    hip_cm: "95",
    arm_cm: "33",
    thigh_cm: "56",
    body_fat_percent: null,
  });

  assert.equal(measurementsAreEqual(input, latest), true);
});

test("repeated submission does not create duplicate rows after first normalization match", () => {
  const first = normalizeMeasurementInput({
    heightCm: "170",
    weightKg: "81.00",
    waistCm: "84",
    chestCm: "98",
    hipCm: "95",
    armCm: "33",
    thighCm: "56",
    bodyFatPercentage: "",
  });
  const second = normalizeMeasurementInput({
    heightCm: "170.0",
    weightKg: "81",
    waistCm: "84.00",
    chestCm: "98.0",
    hipCm: "95",
    armCm: "33.00",
    thighCm: "56",
    bodyFatPercentage: "",
  });

  assert.equal(measurementsAreEqual(first, second), true);
});

test("medical_conditions normalizes none to an empty array", () => {
  assert.deepEqual(normalizeMedicalConditions(["none"]), []);
  assert.deepEqual(normalizeMedicalConditions(["မရှိ"]), []);
});

test("medical_conditions removes no-condition when another condition is present", () => {
  assert.deepEqual(
    normalizeMedicalConditions(["none", "diabetes", "asthma"]),
    ["diabetes", "asthma"],
  );
});

test("existing ARRAY['none'] is treated as empty when loading and comparing", () => {
  assert.deepEqual(normalizeMedicalConditions(["none"]), []);
  assert.deepEqual(normalizeMedicalConditions([]), []);
});

test("other_health_condition is null unless other-condition is selected", () => {
  assert.equal(normalizeOtherHealthCondition([], "custom note"), null);
  assert.equal(
    normalizeOtherHealthCondition(["diabetes"], "custom note"),
    null,
  );
  assert.equal(
    normalizeOtherHealthCondition(["other-condition"], " custom note "),
    "custom note",
  );
});
