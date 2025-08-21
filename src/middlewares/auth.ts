import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface JWTPayload {
  sub: string;
  role: "user" | "admin";
}

export function auth(required = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      if (!required) return next();
      return res.status(401).json({ success: false, message: "Missing Authorization header" });
    }
    const token = header.replace(/^Bearer\s+/i, "");
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
      (req as any).user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  };
}

export function requireOwnerOrAdmin(getOwnerId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { id: string; role: string };
    if (user.role === "admin" || user.id === getOwnerId(req)) return next();
    return res.status(403).json({ success: false, message: "Forbidden" });
  };
}
