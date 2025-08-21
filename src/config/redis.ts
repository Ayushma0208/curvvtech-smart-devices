// src/config/redis.ts
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Create client
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // prevents warnings in cluster setups
});

// Handle errors more gracefully
redis.on("connect", () => {
  console.log(`✅ Connected to Redis at ${redisUrl}`);
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});
