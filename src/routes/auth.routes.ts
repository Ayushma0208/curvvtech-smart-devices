// src/routes/auth.routes.ts
import { Router } from "express";
import { login, logout, refresh, signup } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth";
import { authRateLimit } from "../middlewares/rateLimit";

export const authRouter = Router();
authRouter.post("/signup", authRateLimit, signup);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/refresh", authRateLimit, refresh);
authRouter.post("/logout", auth(true), authRateLimit, logout);
