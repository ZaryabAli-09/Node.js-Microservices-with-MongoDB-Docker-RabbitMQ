import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const importQueue = new Queue("import-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true, // Remove completed jobs to save Redis memory
    removeOnFail: false,
  },
  settings: {
    maxStalledCount: 2,
    stalledInterval: 5000,
    maxRetriesPerRequest: null,
    lockDuration: 30000,
    lockRenewTime: 15000,
  },
});
