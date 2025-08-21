import { Router } from "express";
import { cache } from "../config/cache";
import { createLog, getLogs, getUsage } from "../controllers/log.controller";
import { auth } from "../middlewares/auth";
import { deviceRateLimit } from "../middlewares/rateLimit";

export const logRouter = Router();
logRouter.use(auth(true));
logRouter.post("/devices/:id/logs", createLog);
logRouter.get("/devices/:id/logs",deviceRateLimit, cache(60 * 5), getLogs);
logRouter.get("/devices/:id/usage",deviceRateLimit, cache(60 * 5), getUsage);
