import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { scheduleAutoDeactivate } from "./jobs/autoDeactivate";
import { responseTimeLogger } from "./middlewares/responseTime";
import { authRouter } from "./routes/auth.routes";
import { deviceRouter } from "./routes/device.routes";
import { logRouter } from "./routes/log.routes";
import { realtimeRouter } from "./routes/realtime.routes";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/auth", authRouter);
app.use("/devices", deviceRouter);
app.use("/", logRouter); // logs/usage
app.use(responseTimeLogger);
app.use("/realtime", realtimeRouter);

const origins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  credentials: true
}));


const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGODB_URI!)
  .then(() => {
    scheduleAutoDeactivate();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Mongo connect error", err);
    process.exit(1);
  });

export default app; // for tests
