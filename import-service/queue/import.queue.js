import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const importQueue = new Queue("import-queue", {
  connection: redisConnection,
});
