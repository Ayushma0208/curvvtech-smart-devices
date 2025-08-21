import cron from "node-cron";
import { Device } from "../models/Device";

export function scheduleAutoDeactivate() {
  // every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const res = await Device.updateMany(
      { $or: [{ last_active_at: { $lt: threshold } }, { last_active_at: null }], status: "active" },
      { $set: { status: "inactive" } }
    );
    if (res.modifiedCount) console.log(`🔧 Auto-deactivated ${res.modifiedCount} inactive devices`);
  });
}
