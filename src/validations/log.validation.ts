import { z } from "zod";
export const createLogSchema = z.object({
  event: z.string().min(1),
  value: z.number().optional()
});
