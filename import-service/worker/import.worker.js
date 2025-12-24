import { Worker } from "bullmq";
import { redisConnection } from "../queue/redis.js";
import axios from "axios";
import { wait } from "../utils/helpers.js";

const importWorker = new Worker(
  "import-queue",
  async (job) => {
    try {
      const { jobId, userId, tasks, chunkSize } = job.data;

      console.log(
        `\n[Worker] Starting job: ${jobId} by ${userId} :: Tasks Length: ${tasks.length}, Chunks: ${chunkSize} `
      );

      // Get current job state from Job Service
      let jobResp = await axios.get(
        `http://localhost:8002/job-service/${jobId}`
      );

      //   just for logging we will remove it as we will put retroes in the logic even if something fails like server is down db is down etc
      if (!jobResp) {
        throw new Error("No job found with this id");
      }

      // current chunk is initialized but it is for only when value in res is null undefined or not exist otherwise value from response will be used
      let { currentChunk = 0, status } = jobResp.data.data;

      console.log(
        `[Worker] Job status: ${status}, currentChunk: ${currentChunk}`
      );

      if (status === "CANCELED") {
        console.log(`[Worker] Job ${jobId} is canceled before start. Exiting.`);
        return;
      }
      // Update job status to RUNNING
      const updatedJobResp = await axios.post(
        `http://localhost:8002/job-service/update`,
        {
          jobId,
          status: "RUNNING",
        }
      );

      console.log(
        `[Worker] Job status is updated to ${updatedJobResp.data.status}`
      );
      const totalChunks = Math.ceil(tasks.length / chunkSize);

      // Process tasks chunk by chunk
      for (
        let chunkIndex = currentChunk;
        chunkIndex < totalChunks;
        chunkIndex++
      ) {
        try {
          // Fetch latest status for pause/cancel
          jobResp = await axios.get(
            `http://localhost:8002/job-service/${jobId}`
          );

          const latestStatus = jobResp?.data?.data?.status;

          if (latestStatus === "PAUSED") {
            console.log(
              `[Worker] Job ${jobId} paused at chunk ${
                chunkIndex + 1
              }. Exiting.`
            );
            return;
          }

          if (latestStatus === "CANCELED") {
            console.log(
              `[Worker] Job ${jobId} canceled at chunk ${
                chunkIndex + 1
              }. Exiting.`
            );
            return;
          }

          const start = chunkIndex * chunkSize;
          const chunk = tasks.slice(start, start + chunkSize);

          console.log(
            `[Worker] Processing chunk ${
              chunkIndex + 1
            }/${totalChunks} (tasks ${chunk.length})`
          );

          // Call task service
          await axios.post(`http://localhost:8001/task-service/create-many`, {
            tasks: chunk,
            userId,
          });

          // Update job progress
          await axios.post(`http://localhost:8002/job-service/update`, {
            jobId,
            currentChunk: chunkIndex + 1,
            processedItems: Math.min(
              (chunkIndex + 1) * chunkSize,
              tasks.length
            ),
            lastProcessedIndex: start + chunk.length,
          });

          console.log(
            `[Worker] Chunk ${chunkIndex + 1} processed successfully.`
          );

          await wait(1000); // optional delay
        } catch (chunkError) {
          if (chunkError.message === "PAUSED") {
            console.log(`[Worker] Job ${jobId} paused. Worker exiting.`);
            return; // stop processing until resumed
          }
          console.error(
            `[Worker] Error processing chunk ${chunkIndex + 1}:`,
            chunkError.message
          );
        }
      }

      // Mark job as completed
      await axios.post(`http://localhost:8002/job-service/update`, {
        jobId,
        status: "COMPLETED",
      });
      console.log(`[Worker] Job ${jobId} completed successfully!`);
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error);
    }
  },
  { connection: redisConnection, concurrency: 2 }
);
