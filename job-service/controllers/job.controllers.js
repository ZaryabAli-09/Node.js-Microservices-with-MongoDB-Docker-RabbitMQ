import axios from "axios";
import { Job } from "../model/job.model.js";

export async function createJob(req, res) {
  try {
    const { userId, jobType, totalItemsNum, chunkSize } = req.body;
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch user info
    let user;
    try {
      const fetchUserInfo = await axios.get(
        `${process.env.USER_SERVICE_URL}/user-service/users/${userId}`
      );

      user = fetchUserInfo.data.data;
    } catch (err) {
      return res.status(err?.response?.status || 500).json({
        message: err?.response?.data?.message || "Failed to fetch user info",
      });
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
      data: newJob,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function updateJob(req, res) {
  try {
    const { jobId, processedItems, currentChunk, status } = req.body;

    const job = await Job.findById(jobId);

    if (!job) return res.status(404).json({ message: "Job not found" });

    job.processedItems = processedItems;
    job.currentChunk = currentChunk;
    if (status) {
      job.status = status;
    } else {
      job.status = processedItems >= job.totalItemsNum ? "COMPLETED" : status;
    }

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job updated",
      status: job.status,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
}

export async function getJobBy(req, res) {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    return res
      .status(200)
      .json({ message: "Get job details successfully", data: job });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
