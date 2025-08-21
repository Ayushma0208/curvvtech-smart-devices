import { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis";

function limiter(limit: number, windowSec: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { id?: string };
    const key = `rl:${user?.id || req.ip}`;
    const tx = redis.multi();
    tx.incr(key);
    tx.expire(key, windowSec);
    const [count] = (await tx.exec()) as any[];
    if (Number(count[1]) > limit) {
      return res.status(429).json({ success: false, message: "Too many requests" });
    }
    next();
  };
}

export const authRateLimit = limiter(Number(process.env.RATE_LIMIT_AUTH || 20), Number(process.env.RATE_LIMIT_WINDOW || 60));
export const deviceRateLimit = limiter(Number(process.env.RATE_LIMIT_DEVICES || 200), Number(process.env.RATE_LIMIT_WINDOW || 60));
