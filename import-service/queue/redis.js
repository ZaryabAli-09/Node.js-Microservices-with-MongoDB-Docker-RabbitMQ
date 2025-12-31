import { Redis } from "ioredis";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

export const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false, // Reduce unnecessary checks
  enableOfflineQueue: true,

  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Connection pooling settings
  lazyConnect: false,
  reconnectOnError: (err) => {
    // Reconnect on network errors or READONLY
    const reconnectErrors = ["READONLY", "ECONNRESET", "ECONNREFUSED"];
    if (reconnectErrors.some((e) => err.message.includes(e))) {
      return true;
    }
    return false;
  },
});

redisConnection
  .ping()
  .then((log) => console.log("Connected to Upstash Redis!", log))
  .catch(console.error);
