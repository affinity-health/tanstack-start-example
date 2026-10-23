import { z } from "zod";
const typedId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[0-7][0-9a-hjkmnp-tv-z]{25}$`));
export const prescriptionInput = z.object({
  externalId: z.string().min(1).max(100),
  medicationId: typedId("med"),
  directions: z.string().trim().min(1).max(2000),
  quantity: z.number().int().positive().max(10000),
  refills: z.number().int().min(0).max(99),
  shippingOptionId: typedId("shp"),
  compoundingReason: z.string().trim().max(200).optional(),
});
export type PrescriptionInput = z.infer<typeof prescriptionInput>;
