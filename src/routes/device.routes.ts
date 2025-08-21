import { Router } from "express";
import { createDevice, deleteDevice, heartbeat, listDevices, updateDevice } from "../controllers/device.controller";
import { auth } from "../middlewares/auth";
import { authRateLimit } from "../middlewares/rateLimit";

export const deviceRouter = Router();
deviceRouter.use(auth(true));
deviceRouter.post("/",authRateLimit, createDevice);
deviceRouter.get("/", listDevices);
deviceRouter.patch("/:id",authRateLimit, updateDevice);
deviceRouter.delete("/:id",authRateLimit, deleteDevice);
deviceRouter.post("/:id/heartbeat",authRateLimit, heartbeat);
