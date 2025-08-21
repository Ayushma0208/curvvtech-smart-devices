import fs from "fs";
import path from "path";
import { DeviceLog } from "../models/DeviceLog";
import { ExportJob } from "../models/exportJob";

export async function startExportWorker() {
  const dir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  setInterval(async () => {
    const job = await ExportJob.findOneAndUpdate({ status: "pending" }, { status: "processing" }, { sort: { createdAt: 1 } });
    if (!job) return;
    try {
      if (job.type === "logs") {
        const { deviceId, from, to, format = "csv" } = job.params as any;
        const logs = await DeviceLog.find({
          device_id: deviceId, timestamp: { $gte: new Date(from), $lte: new Date(to) }
        }).lean();

        let filePath: string | undefined;
        if (format === "json") {
          filePath = path.join(dir, `logs_${job._id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(logs));
        } else {
          filePath = path.join(dir, `logs_${job._id}.csv`);
          const lines = ["deviceId,timestamp,event,value"];
          for (const l of logs) lines.push(`${l.device_id},${new Date(l.timestamp).toISOString()},${l.event},${l.value ?? ""}`);
          fs.writeFileSync(filePath, lines.join("\n"));
        }
        job.filePath = filePath;
        job.status = "done";
        await job.save();
        console.log(`[email] Export ready for job ${job.id}: ${filePath}`); // simulate email
      } else if (job.type === "usage-report") {
        const { deviceId, from, to, bucket = "hour" } = job.params as any;
        const buckets: Record<string, number> = {};
        const cursor = await DeviceLog.find({
          device_id: deviceId, event: "units_consumed", timestamp: { $gte: new Date(from), $lte: new Date(to) }
        }).cursor();
        for await (const l of cursor) {
          const d = new Date(l.timestamp);
          const key = bucket === "day" ? d.toISOString().slice(0,10) : d.toISOString().slice(0,13)+":00";
          buckets[key] = (buckets[key] || 0) + (l.value || 0);
        }
        job.result = { series: Object.entries(buckets).sort(([a],[b]) => a.localeCompare(b)).map(([t,v]) => ({ t, v })) };
        job.status = "done";
        await job.save();
        console.log(`[email] Usage report ready for job ${job.id}`);
      } else {
        job.status = "error"; job.error = "Unknown job type"; await job.save();
      }
    } catch (e: any) {
      job.status = "error"; job.error = e.message; await job.save();
    }
  }, 1000);
}
