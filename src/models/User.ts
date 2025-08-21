import { Schema, model } from "mongoose";

export type UserRole = "user" | "admin";

interface IUser {
  name: string;
  email: string;
  password: string; // hashed
  role: UserRole;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
