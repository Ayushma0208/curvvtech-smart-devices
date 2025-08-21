// src/controllers/device.controller.ts
import crypto from "crypto";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { invalidate } from "../config/cache";
import { Device } from "../models/Device";
import { broadcast } from "../routes/realtime.routes";
import { createDeviceSchema, heartbeatSchema, updateDeviceSchema } from "../validations/device.validation";

export async function createDevice(req: Request, res: Response) {
  const parsed = createDeviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  const owner_id = new Types.ObjectId((req as any).user.id);
  const device = await Device.create({ ...parsed.data, last_active_at: null, owner_id });

  // Invalidate any cached device lists
  await invalidate("cache:*devices*");

  // (Optional) notify realtime clients a device was created
  try { broadcast("device:status", { deviceId: device.id, action: "created" }); } catch {}

  return res.json({ success: true, device: { id: device.id, ...device.toObject(), id_: undefined } });
}

export async function listDevices(req: Request, res: Response) {
  const { type, status, page = "1", limit = "20" } = req.query as any;
  const user = (req as any).user as { id: string; role: string };

  const filter: any = {};
  if (user.role !== "admin") filter.owner_id = new Types.ObjectId(user.id);
  if (type) filter.type = type;
  if (status) filter.status = status;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));

  const [items, total] = await Promise.all([
    Device.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
    Device.countDocuments(filter),
  ]);

  const body = { success: true, data: { devices: items, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } } };

  // ETag / Last-Modified for cheap client polling + proxy revalidation
  const payload = JSON.stringify(body);
  const etag = crypto.createHash("sha1").update(payload).digest("hex");
  res.setHeader("ETag", etag);
  // @ts-ignore
  const lastUpdated = items[0]?.updatedAt || new Date(0);
  res.setHeader("Last-Modified", new Date(lastUpdated).toUTCString());
  if (req.headers["if-none-match"] === etag) return res.status(304).end();

  return res.json(body);
}

export async function updateDevice(req: Request, res: Response) {
  const parsed = updateDeviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  const device = await Device.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!device) return res.status(404).json({ success: false, message: "Not found" });

  // Invalidate caches: listings + this device + encoded variants
  await invalidate("cache:*devices*");
  await invalidate(`cache:*devices/${req.params.id}*`);
  await invalidate(`cache:*devices:%3Aid%3A${req.params.id}*`);

  // (Optional) realtime notify
  try { broadcast("device:status", { deviceId: device.id, action: "updated", status: device.status }); } catch {}

  return res.json({ success: true, device });
}

export async function deleteDevice(req: Request, res: Response) {
  const deleted = await Device.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

  // Invalidate caches
  await invalidate("cache:*devices*");
  await invalidate(`cache:*devices/${req.params.id}*`);
  await invalidate(`cache:*devices:%3Aid%3A${req.params.id}*`);

  // (Optional) realtime notify
  try { broadcast("device:status", { deviceId: req.params.id, action: "deleted" }); } catch {}

  return res.json({ success: true, message: "Device removed" });
}

export async function heartbeat(req: Request, res: Response) {
  const parsed = heartbeatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  const update: any = { last_active_at: new Date() };
  if (parsed.data.status) update.status = parsed.data.status;

  const device = await Device.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!device) return res.status(404).json({ success: false, message: "Not found" });

  // Invalidate any caches that might include this device (lists + per-device views/usage)
  await invalidate("cache:*devices*");
  await invalidate(`cache:*devices/${req.params.id}*`);
  await invalidate(`cache:*devices:%3Aid%3A${req.params.id}*`);

  // Realtime broadcast to connected clients (SSE/WebSocket)
  try { broadcast("device:status", { deviceId: device.id, action: "heartbeat", last_active_at: device.last_active_at, status: device.status }); } catch {}
broadcast("device:status", { deviceId: req.params.id, last_active_at: device.last_active_at, status: device.status });

  return res.json({ success: true, message: "Device heartbeat recorded", last_active_at: device.last_active_at });
}
