import { Request, Response } from "express";
import { Types } from "mongoose";
import { Device } from "../models/Device";
import { DeviceLog } from "../models/DeviceLog";
import { createLogSchema } from "../validations/log.validation";

export async function createLog(req: Request, res: Response) {
  const parsed = createLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  const deviceId = req.params.id;
  const device = await Device.findById(deviceId);
  if (!device) return res.status(404).json({ success: false, message: "Device not found" });
  // Ensure ownership
  const user = (req as any).user as { id: string; role: string };
  if (user.role !== "admin" && device.owner_id.toString() !== user.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const log = await DeviceLog.create({ device_id: new Types.ObjectId(deviceId), ...parsed.data });
  return res.json({ success: true, log });
}

export async function getLogs(req: Request, res: Response) {
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "10")));
  const deviceId = req.params.id;
  const logs = await DeviceLog.find({ device_id: deviceId }).sort({ timestamp: -1 }).limit(limit);
  return res.json({ success: true, logs });
}

export async function getUsage(req: Request, res: Response) {
  const deviceId = new Types.ObjectId(req.params.id);
  // Only need range=24h per spec; default to 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const agg = await DeviceLog.aggregate([
    { $match: { device_id: deviceId, event: "units_consumed", timestamp: { $gte: since } } },
    { $group: { _id: null, total: { $sum: "$value" } } }
  ]);

  const total_units_last_24h = agg.length ? agg[0].total : 0;
  return res.json({ success: true, device_id: req.params.id, total_units_last_24h });
}
