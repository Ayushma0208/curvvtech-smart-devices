import { NextFunction, Request, Response } from "express";

export function responseTimeLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    res.setHeader("X-Response-Time", `${ms.toFixed(1)}ms`);
    console.log(JSON.stringify({ t: Date.now(), path: req.originalUrl, method: req.method,
      status: res.statusCode, ms: Number(ms.toFixed(1)), ip: req.ip }));
  });
  next();
}
