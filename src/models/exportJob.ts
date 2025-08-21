import { model, Schema } from "mongoose";

const schema = new Schema({
  type: { type: String, required: true }, // "logs" | "usage-report"
  params: { type: Object, default: {} },
  status: { type: String, enum: ["pending","processing","done","error"], default: "pending", index: true },
  filePath: { type: String },
  result: { type: Object },
  error: { type: String }
}, { timestamps: true });

export const ExportJob = model("ExportJob", schema);
