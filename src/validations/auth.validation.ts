import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]).default("user")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
