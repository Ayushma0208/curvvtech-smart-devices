import { model, Schema, Types } from "mongoose";

interface IDeviceLog {
  device_id: Types.ObjectId;
  event: string;     // e.g. "units_consumed"
  value?: number;    // optional by spec; present for meters
  timestamp: Date;
}

const deviceLogSchema = new Schema<IDeviceLog>(
  {
    device_id: { type: Schema.Types.ObjectId, ref: "Device", required: true, index: true },
    event: { type: String, required: true, index: true },
    value: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

export const DeviceLog = model<IDeviceLog>("DeviceLog", deviceLogSchema);
