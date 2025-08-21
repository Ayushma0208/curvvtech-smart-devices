import { model, Schema, Types } from "mongoose";

export type DeviceStatus = "active" | "inactive";

interface IDevice {
  name: string;
  type: string;              // e.g. "light", "meter", etc
  status: DeviceStatus;      // "active" | "inactive"
  last_active_at: Date | null;
  owner_id: Types.ObjectId;  // User ref
}

const deviceSchema = new Schema<IDevice>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    last_active_at: { type: Date, default: null, index: true },
    owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

export const Device = model<IDevice>("Device", deviceSchema);
