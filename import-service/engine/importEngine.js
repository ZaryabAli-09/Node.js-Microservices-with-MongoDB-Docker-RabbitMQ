import axios from "axios";
import { wait } from "../utils/helpers.js";

export async function ImportEngine(req, res) {
  try {
    const { userId } = req.body;

    // logs
    console.log("\n=== IMPORT ENGINE STARTED ===");
    console.log(`➡️  Requested by userId: ${userId}`);
    console.log("⬇️  Fetching tasks from dummyjson...");

    // fetch tasks from dummyjson api
    const fetchTaskResp = await axios.get(
      "https://dummyjson.com/todos?limit=2000"
    );
    const fetchedTasks = fetchTaskResp.data.todos;

    // logs
    console.log("📥  Tasks fetched successfully.");

    const tasks = fetchedTasks.map((task) => {
      return {
        title: task.todo,
        description: "description ::" + task.todo,
      };
    });

    // logs
    console.log(`📌 Mapped ${tasks.length} tasks for import.`);

    const chunkSize = 10;
    console.log(`⚙️  Using chunk size: ${chunkSize}`);

    // create a job in job service
    const job = await axios.post(`http://localhost:8002/job-service/create`, {
      userId,
      totalItemsNum: tasks.length,
      jobType: "IMPORT",
      chunkSize: chunkSize,
    });

    const jobId = await job.data.job._id;
    console.log(`📁 ${job.data.message}. Job ID: ${jobId}`);
    console.log("\n======= PROCESSING IMPORT CHUNKS =======");

    // process tasks in chunks
    for (let i = 0; i < tasks.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const chunk = tasks.slice(i, i + chunkSize);

      console.log(`\n🚧 Chunk ${chunkIndex} started. Tasks: ${chunk.length}`);

      console.log(`📤 Sending tasks to task-service...`);

      // hit task service to create these chunk tasks
      await axios.post(
        "http://localhost:8001/task-service/create-many",
        { tasks: chunk, userId },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✔️ Tasks saved successfully in task-service.");

      // update job service progress
      await axios.post("http://localhost:8002/job-service/update", {
        jobId,
        processedItems: Math.min(i + chunkSize, tasks.length),
        currentChunk: i / chunkSize + 1,
      });

      console.log(
        `📍 Job progress updated. Processed: ${Math.min(
          i + chunkSize,
          tasks.length
        )}/${tasks.length} tasks.`
      );
      console.log(`✅ Chunk ${chunkIndex} completed.\n`);
      await wait(1500); // <-- 2.5 second delay
    }

    console.log("🎉 All chunks processed!");
    console.log("📦 Import operation finished.");
    console.log("=================================================\n");

    return res.status(200).json({
      success: true,
      message: "Tasks imported successfully",
      jobId,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}
