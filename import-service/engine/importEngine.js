import axios from "axios";
import { importQueue } from "../queue/import.queue.js";

export async function ImportEngine(req, res) {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Fetch tasks
    let tasks;
    try {
      const fetchTasksResp = await axios.get(
        "https://dummyjson.com/todos?limit=2000"
      );
      tasks = fetchTasksResp.data.todos.map((t) => ({
        title: t.todo,
        description: "description ::" + t.todo,
      }));
    } catch (err) {
      console.error("***Error fetching tasks***", err.message);
      return res.status(502).json({ message: "Failed to fetch tasks" });
    }

    // Init job
    let jobId;
    try {
      const createJobResp = await axios.post(
        `http://${process.env.JOB_SERVICE_URL}/job-service/create`,
        {
          userId,
          jobType: "IMPORT",
          status: "PENDING",
          totalChunks: Math.ceil(tasks.length / 10),
          chunkSize: 10,
          totalItemsNum: tasks.length,
          currentChunk: 0,
          processedItems: 0,
        }
      );

      // Check if job-service returned an error
      if (!createJobResp.status == true) {
        return res.status(400).json({
          message: createJobResp.data?.message || "Job creation failed",
        });
      }

      jobId = createJobResp.data.data._id;
    } catch (err) {
      console.error(
        "***Error creating job***",
        err.response?.data || err.message
      );
      return res.status(502).json({ message: "Failed to create job" });
    }

    // Add job to queue
    try {
      await importQueue.add(
        "import-job",
        { jobId, userId, tasks, chunkSize: 10 },
        { attempts: 5 }
      );
    } catch (err) {
      console.error("***Error adding job to queue***", err.message);
      return res.status(500).json({ message: "Failed to queue job" });
    }

    // Success response
    return res.status(200).json({
      success: true,
      jobId,
      message: "Import Task Job initialized and queued",
    });
  } catch (err) {
    console.error("***Unhandled error in IMPORT ENGINE***", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
