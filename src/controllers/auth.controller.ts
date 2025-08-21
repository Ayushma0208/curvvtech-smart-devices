// src/controllers/auth.controller.ts
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User";
import {
    revokeAllRefreshTokens,
    rotateRefresh,
    signAccessToken,
    signRefreshToken,
} from "../services/token.service";
import { loginSchema, signupSchema } from "../validations/auth.validation";

// SIGNUP (unchanged except minor tidy)
export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { name, email, password, role } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ success: false, message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed, role });
  return res.json({ success: true, message: "User registered successfully" });
}

// LOGIN → returns { accessToken, refreshToken }
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

  // Extra claims you might want in tokens
  const extra = { role: user.role };

  // Short-lived access token + long-lived refresh token
  const { token: accessToken } = signAccessToken(user.id, extra);
  const { token: refreshToken } = await signRefreshToken(user.id, extra);

  return res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
}

// REFRESH → rotates refresh token (old becomes invalid) and issues new AT+RT
export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ success: false, message: "Missing refreshToken" });

  try {
    const rotated = await rotateRefresh(refreshToken);
    return res.json({ success: true, data: rotated });
  } catch (e: any) {
    const status = e?.status || 401;
    const code = e?.code || "REFRESH_FAILED";
    return res.status(status).json({ success: false, error: { code, message: e?.message || "Invalid refresh token" } });
  }
}

// LOGOUT → revoke all refresh tokens for the user (access token simply expires)
export async function logout(req: Request, res: Response) {
  // Prefer reading the user id from the verified access token middleware
  const userId = (req as any).user?.id || req.body?.userId;
  if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

  await revokeAllRefreshTokens(userId);
  return res.json({ success: true, message: "Logged out" });
}
