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

    removeOnFail: false,
  },
  settings: {
    // Reduce stalled checks to lower Upstash commands (check every 60s instead of 5s)
    maxStalledCount: 2,
    stalledInterval: 60000,
    maxRetriesPerRequest: null,
    // Longer lock durations reduce frequent renewals
    lockDuration: 120000,
    lockRenewTime: 60000,
  },
});
