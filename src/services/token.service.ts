import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { redis } from "../config/redis";

const ACCESS_MIN = Number(process.env.ACCESS_TTL_MIN || 15);
const REFRESH_DAYS = Number(process.env.REFRESH_TTL_DAYS || 7);

export function signAccessToken(sub: string, extra: Record<string, any> = {}) {
  const jti = randomUUID();
  const token = jwt.sign({ sub, jti, ...extra }, process.env.JWT_ACCESS_SECRET!, { expiresIn: `${ACCESS_MIN}m` });
  // optional: track for audit/blacklist
  redis.setex(`acc:${jti}`, ACCESS_MIN * 60, "1");
  return { token, jti };
}

export async function signRefreshToken(sub: string, extra: Record<string, any> = {}) {
  const jti = randomUUID();
  const token = jwt.sign({ sub, jti, ...extra }, process.env.JWT_REFRESH_SECRET!, { expiresIn: `${REFRESH_DAYS}d` });
  await redis.setex(`rt:${sub}:${jti}`, REFRESH_DAYS * 86400, "1"); // whitelist
  return { token, jti };
}

export async function rotateRefresh(oldToken: string) {
  const decoded = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET!) as any;
  const { sub, jti, ...rest } = decoded;
  const key = `rt:${sub}:${jti}`;
  const ok = await redis.get(key);
  if (!ok) throw Object.assign(new Error("Refresh token invalid or already used"), { status: 401, code: "REFRESH_REUSED" });
  await redis.del(key); // rotation: burn old
  const { token: refreshToken } = await signRefreshToken(sub, rest);
  const { token: accessToken } = signAccessToken(sub, rest);
  return { accessToken, refreshToken, sub };
}

export async function revokeAllRefreshTokens(userId: string) {
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", `rt:${userId}:*`, "COUNT", "100");
    cursor = next; if (keys.length) await redis.del(...keys);
  } while (cursor !== "0");
}
