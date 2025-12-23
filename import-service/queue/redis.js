import { Redis } from "ioredis";

export const redisConnection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // <--- THIS IS REQUIRED
});

redisConnection.ping().then(console.log).catch(console.error);
