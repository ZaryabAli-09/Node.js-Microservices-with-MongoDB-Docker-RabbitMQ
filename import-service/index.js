import express from "express";
import dotenv from "dotenv";
import { importQueue } from "./queue/import.queue.js";
import { ImportEngine } from "./engine/importEngine.js";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

dotenv.config();

import "./worker/import.worker.js";

const app = express();
const PORT = process.env.PORT || 8003;

// bull board just for logging
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(importQueue)],
  serverAdapter,
});

app.use(express.json());

// import engine task route
app.post("/import-service/import-tasks", ImportEngine);
app.use("/admin/queues", serverAdapter.getRouter());

// App listening
app.listen(PORT, () => {
  console.log(`Import Service is running on port ${PORT} 🚀`);
});
