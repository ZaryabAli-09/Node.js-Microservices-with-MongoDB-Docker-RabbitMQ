import axios from "axios";
import { importQueue } from "../queue/import.queue.js";

export async function ImportEngine(req, res) {
  try {
    const { userId } = req.body;

    // Fetch tasks
    const fetchTasksResp = await axios.get(
      "https://dummyjson.com/todos?limit=2000"
    );

    //  map the tasks to align with our schema
    const tasks = fetchTasksResp.data.todos.map((t) => ({
      title: t.todo,
      description: "description ::" + t.todo,
    }));

    // initilize total chunks
    const chunkSize = 10;
    // calculate total chunks to be processed
    const totalChunks = Math.ceil(tasks.length / chunkSize);

    // create job in job-service
    const createJobResp = await axios.post(
      "http://localhost:8002/job-service/create",
      {
        userId,
        jobType: "IMPORT",
        status: "PENDING",
        totalChunks,
        chunkSize,
        totalItemsNum: tasks.length,
        currentChunk: 0,
        processedItems: 0,
      }
    );

    if (!createJobResp) {
      throw new Error("Error occur while initilizing job");
    }
    // extract jobId
    const jobId = createJobResp?.data?.data?._id;

    // add job to bullMQ queue
    await importQueue.add(
      "import-job",
      { jobId, userId, tasks, chunkSize },
      { attempts: 5 }
    );

    // return response
    return res.status(200).json({
      success: true,
      jobId,
      message: "Import Task Job initilized and queued",
    });
  } catch (error) {
    console.error("***Error in IMPORT ENGINE CONTROLLER***", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}
