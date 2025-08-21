import { z } from "zod";
export const createDeviceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active")
});
export const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional()
});
export const heartbeatSchema = z.object({
  status: z.enum(["active", "inactive"]).optional()
});
