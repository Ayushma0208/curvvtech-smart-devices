import { Router } from "express";
import { auth } from "../middlewares/auth";
import { deviceRateLimit } from "../middlewares/rateLimit";
import { ExportJob } from "../models/exportJob";

export const exportRouter = Router();
exportRouter.use(auth(true));

exportRouter.post("/logs", deviceRateLimit, async (req, res) => {
  const { deviceId, from, to, format = "csv" } = req.body || {};
  if (!deviceId || !from || !to) return res.status(400).json({ success: false, message: "deviceId, from, to required" });
  const job = await ExportJob.create({ type: "logs", params: { deviceId, from, to, format } });
  res.json({ success: true, data: { jobId: job.id } });
});

exportRouter.post("/usage-report", deviceRateLimit, async (req, res) => {
  const { deviceId, from, to, bucket = "hour" } = req.body || {};
  if (!deviceId || !from || !to) return res.status(400).json({ success: false, message: "deviceId, from, to required" });
  const job = await ExportJob.create({ type: "usage-report", params: { deviceId, from, to, bucket } });
  res.json({ success: true, data: { jobId: job.id } });
});

exportRouter.get("/status/:id", deviceRateLimit, async (req, res) => {
  const job = await ExportJob.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: { status: job.status, filePath: job.filePath, result: job.result, error: job.error } });
});
