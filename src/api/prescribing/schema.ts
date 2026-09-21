import { z } from "zod";
export const prescriptionInput = z.object({
  externalId: z.string().min(1).max(100),
  medicationId: z.string().startsWith("cat_").max(100),
  expectedRevision: z.string().min(1).max(128),
  reason: z.string().max(2000).default(""),
  category: z.string().max(100).default(""),
  directions: z.string().trim().min(1).max(2000).optional(),
  quantity: z
    .object({ value: z.number().positive(), unit: z.string().trim().min(1).max(100) })
    .optional(),
  daysSupply: z.number().int().positive().optional(),
  refills: z.number().int().min(0).max(99).optional(),
  shippingOptionId: z.string().startsWith("shp_").max(100).optional(),
});
export type PrescriptionInput = z.infer<typeof prescriptionInput>;
