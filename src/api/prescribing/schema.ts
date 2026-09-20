import { z } from "zod";
export const prescriptionInput = z.object({
  externalId: z.string().min(1).max(100),
  medicationId: z.string().startsWith("cat_").max(100),
  expectedRevision: z.string().min(1).max(128),
  reason: z.string().max(2000).default(""),
  category: z.string().max(100).default(""),
});
export type PrescriptionInput = z.infer<typeof prescriptionInput>;
