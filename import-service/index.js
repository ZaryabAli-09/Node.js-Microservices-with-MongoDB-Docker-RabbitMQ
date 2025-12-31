import express from "express";
import dotenv from "dotenv";
import { importQueue } from "./queue/import.queue.js";
import { ImportEngine } from "./engine/importEngine.js";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Conditionally load worker only if RUN_WORKER=true (default false to reduce Upstash commands)
if (process.env.RUN_WORKER === "true") {
  import("./worker/import.worker.js").catch((err) =>
    console.error("Failed to start worker:", err?.message || err)
  );
}

const app = express();
const PORT = process.env.PORT || 8003;

// Bull-board constantly polls Redis and generates commands.
// Only enable if explicitly set (e.g., BULL_BOARD=true for debugging/staging).
if (process.env.BULL_BOARD === "true") {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(importQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
  console.log(
    "[⚠️  WARNING] Bull-board is enabled. It polls Redis frequently."
  );
}

app.use(express.json());

// import engine task route
app.post("/import-service/import-tasks", ImportEngine);

// App listening
app.listen(PORT, () => {
  console.log(`Import Service is running on port ${PORT} 🚀`);
});
