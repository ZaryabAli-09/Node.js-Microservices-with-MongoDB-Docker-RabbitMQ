import { Worker } from "bullmq";
import { redisConnection } from "../queue/redis.js";
import axios from "axios";
import { wait } from "../utils/helpers.js";

console.log(`[Worker] 🚀 Worker process booted at ${new Date().toISOString()}`);

// Constants
const JOB_SERVICE = process.env.JOB_SERVICE_URL;
const TASK_SERVICE = process.env.TASK_SERVICE_URL;
const CHUNK_DELAY_MS = 1000;

// Service clients
const jobService = {
  get: (jobId) => axios.get(`${JOB_SERVICE}/job-service/${jobId}`),
  update: (data) => axios.post(`${JOB_SERVICE}/job-service/update`, data),
};

const taskService = {
  createMany: (tasks, userId) =>
    axios.post(`${TASK_SERVICE}/task-service/create-many`, { tasks, userId }),
};

// Worker instance
const importWorker = new Worker(
  "import-queue",
  async (job) => {
    const { jobId, userId, tasks, chunkSize } = job.data;
    const startTime = Date.now();

    console.log(
      `\n[Worker] 📦 Starting job: ${jobId} | User: ${userId} | Tasks: ${tasks.length} | Chunk size: ${chunkSize}`,
    );

    try {
      // Get initial job state
      const { data: jobData } = await jobService.get(jobId);
      const jobState = jobData?.data;

      if (!jobState) {
        throw new Error(`Job ${jobId} not found`);
      }

      const { currentChunk = 0, status } = jobState;
      console.log(
        `[Worker] 📊 Initial state | Status: ${status} | Current chunk: ${currentChunk}`,
      );

      // Exit if job is already canceled
      if (status === "CANCELED") {
        console.log(`[Worker] ⏹️ Job ${jobId} canceled before start. Exiting.`);
        return;
      }

      // Mark job as RUNNING
      await jobService.update({ jobId, status: "RUNNING" });
      console.log(`[Worker] ▶️ Job ${jobId} marked as RUNNING`);

      const totalChunks = Math.ceil(tasks.length / chunkSize);

      // Process chunks
      for (
        let chunkIndex = currentChunk;
        chunkIndex < totalChunks;
        chunkIndex++
      ) {
        // Check job status before processing chunk
        const { data: statusCheck } = await jobService.get(jobId);
        const latestStatus = statusCheck?.data?.status;

        if (latestStatus === "PAUSED") {
          console.log(
            `[Worker] ⏸️ Job ${jobId} paused at chunk ${chunkIndex + 1}. Exiting.`,
          );
          return;
        }

        if (latestStatus === "CANCELED") {
          console.log(
            `[Worker] ⏹️ Job ${jobId} canceled at chunk ${chunkIndex + 1}. Exiting.`,
          );
          return;
        }

        // Process current chunk
        await processChunk(
          jobId,
          userId,
          tasks,
          chunkSize,
          chunkIndex,
          totalChunks,
        );

        // Small delay between chunks
        await wait(CHUNK_DELAY_MS);
      }

      // Mark job as COMPLETED
      await jobService.update({ jobId, status: "COMPLETED" });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[Worker] ✅ Job ${jobId} completed in ${duration}s`);
    } catch (error) {
      console.error(`[Worker] ❌ Job ${job.id} failed:`, error.message);
      // Could optionally mark job as FAILED here
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

/**
 * Process a single chunk of tasks
 */
async function processChunk(
  jobId,
  userId,
  tasks,
  chunkSize,
  chunkIndex,
  totalChunks,
) {
  try {
    const start = chunkIndex * chunkSize;
    const chunk = tasks.slice(start, start + chunkSize);

    console.log(
      `[Worker] 🔄 Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} tasks)`,
    );

    // Create tasks in batch
    await taskService.createMany(chunk, userId);

    // Update job progress
    await jobService.update({
      jobId,
      currentChunk: chunkIndex + 1,
      processedItems: Math.min((chunkIndex + 1) * chunkSize, tasks.length),
      lastProcessedIndex: start + chunk.length,
    });

    console.log(`[Worker] ✅ Chunk ${chunkIndex + 1}/${totalChunks} processed`);
  } catch (error) {
    if (error.message === "PAUSED") {
      console.log(
        `[Worker] ⏸️ Job ${jobId} paused during chunk ${chunkIndex + 1}`,
      );
      throw error; // Re-throw to be caught by parent
    }

    console.error(
      `[Worker] ❌ Error processing chunk ${chunkIndex + 1}:`,
      error.message,
    );
    throw error; // Re-throw to fail the job
  }
}

/* ================================
   WORKER LIFECYCLE EVENTS
================================ */

importWorker.on("active", (job) => {
  console.log(
    `[Worker] 🔔 Picked job ${job.id} from queue at ${new Date().toISOString()}`,
  );
});

importWorker.on("drained", () => {
  console.log(
    `[Worker] 💤 Queue empty — worker sleeping at ${new Date().toISOString()}`,
  );
});

importWorker.on("stalled", (jobId) => {
  console.warn(
    `[Worker] ⚠️ Stalled job ${jobId} recovered at ${new Date().toISOString()}`,
  );
});

importWorker.on("completed", (job) => {
  console.log(
    `[Worker] 🎉 Job ${job.id} completed at ${new Date().toISOString()}`,
  );
});

importWorker.on("failed", (job, err) => {
  console.error(
    `[Worker] 💥 Job ${job?.id} failed at ${new Date().toISOString()}:`,
    err.message,
  );
});
