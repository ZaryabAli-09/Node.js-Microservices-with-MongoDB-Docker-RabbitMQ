import axios from "axios";
import { Job } from "../model/job.model.js";

export async function createJob(req, res) {
  try {
    const { userId, jobType, totalItemsNum, chunkSize } = req.body;

    const fetchUserInfo = await axios.get(
      `http://localhost:8000/user-service/users/${userId}`
    );

    const user = await fetchUserInfo.data.data;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newJob = new Job({
      userId,
      jobType,
      totalItemsNum,
      chunkSize,
      status: "PENDING",
    });

    await newJob.save();

    return res.status(201).json({
      message: `New job created by ${user?.name}`,
      job: newJob,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function updateJob(req, res) {
  try {
    const { jobId, processedItems, currentChunk } = req.body;

    const job = await Job.findById(jobId);

    if (!job) return res.status(404).json({ message: "Job not found" });

    job.processedItems = processedItems;
    job.currentChunk = currentChunk;
    job.status =
      processedItems >= job.totalItemsNum ? "COMPLETED" : "IN_PROGRESS";

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job updated",
      status: job.status,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
