import { expect, test } from "bun:test";
import { prescriptionInput } from "../../../api/prescribing/schema";
import { defaultFields, fieldInput } from "./prescription-fields";
const identity = { externalId: "synthetic", medicationId: "med_01j2y8m6jcc9tt24af5pw9x1bc" };
const fields = {
  directions: "Synthetic directions",
  quantity: "1",
  refills: "0",
  shippingOptionId: "shp_01j2y8m6jcc9tt24af5pw9x1bc",
};
test("review requires complete fields and current typed IDs", () => {
  expect(prescriptionInput.safeParse({ ...identity, ...fieldInput(fields) }).success).toBe(true);
  for (const quantity of ["", "0", "-1", "1.5", "10001"]) {
    expect(
      prescriptionInput.safeParse({ ...identity, ...fieldInput({ ...fields, quantity }) }).success,
    ).toBe(false);
  }
  for (const change of [{ refills: "" }, { directions: " " }, { shippingOptionId: "" }]) {
    expect(
      prescriptionInput.safeParse({ ...identity, ...fieldInput({ ...fields, ...change }) }).success,
    ).toBe(false);
  }
  expect(
    prescriptionInput.safeParse({ ...identity, ...fieldInput(fields), medicationId: "cat_old" })
      .success,
  ).toBe(false);
});
test("defaults never infer the prescription quantity or shipping choice", () => {
  expect(defaultFields({ defaultDirections: null })).toEqual({
    directions: "",
    quantity: "",
    refills: "0",
    shippingOptionId: "",
  });
});
