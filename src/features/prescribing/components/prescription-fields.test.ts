import { expect, test } from "bun:test";
import type { Options } from "../../../api/types";
import { prescriptionInput } from "../../../api/prescribing/schema";
import { defaultFields, fieldOverrides } from "./prescription-fields";

const options = {
  defaultPresetId: "preset_demo",
  presets: [
    {
      id: "preset_demo",
      directions: "Synthetic test directions",
      quantity: { value: 30, unit: "capsule" },
      daysSupply: null,
      refills: 0,
    },
  ],
  catalog: { unit: "capsule" },
} as Options;
const identity = {
  externalId: "synthetic",
  medicationId: "cat_demo",
  expectedRevision: "revision",
};

test("missing days supply stays missing until entered, with other defaults unchanged", () => {
  const fields = defaultFields(options);
  expect(fields.daysSupply).toBe("");
  expect(fieldOverrides(options, fields)).toEqual({});
  expect(fieldOverrides(options, { ...fields, daysSupply: "14" })).toEqual({ daysSupply: 14 });
});

test("edited regimen carries the explicitly reviewed days supply even when it matches the preset", () => {
  const complete = {
    ...options,
    presets: options.presets.map((preset) => ({ ...preset, daysSupply: 30 })),
  };
  const fields = {
    ...defaultFields(complete),
    directions: "Explicitly edited directions",
    daysSupply: "30",
  };
  expect(fieldOverrides(complete, fields)).toEqual({
    directions: fields.directions,
    daysSupply: 30,
  });
});

test("cleared or invalid clinical numbers cannot become a draft input", () => {
  const fields = defaultFields(options);
  for (const daysSupply of ["-1", "1.5", "0"]) {
    expect(
      prescriptionInput.safeParse({
        ...identity,
        ...fieldOverrides(options, { ...fields, daysSupply }),
      }).success,
    ).toBe(false);
  }
  expect(
    prescriptionInput.safeParse({
      ...identity,
      ...fieldOverrides(options, { ...fields, refills: "" }),
    }).success,
  ).toBe(false);
  expect(
    prescriptionInput.safeParse({
      ...identity,
      ...fieldOverrides(options, { ...fields, quantity: "" }),
    }).success,
  ).toBe(false);
});
