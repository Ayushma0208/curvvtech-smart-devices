import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis";

function keyFromReq(req: Request) {
  return "cache:" + crypto.createHash("sha1").update(req.originalUrl).digest("hex");
}

export function cache(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyFromReq(req);
    const hit = await redis.get(key);
    if (hit) {
      res.setHeader("X-Cache", "HIT");
      res.type("application/json").send(hit);
      return;
    }
    const json = res.json.bind(res);
    res.json = (body: any) => {
      try { redis.setex(key, ttlSeconds, JSON.stringify(body)); } catch {}
      res.setHeader("X-Cache", "MISS");
      return json(body);
    };
    next();
  };
}

export async function invalidate(pattern: string) {
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", "100");
    cursor = next;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== "0");
}
