import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import axios from "axios";
import { connectDB } from "./utils/dbConnection";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cookieParser());

app.post("/job-service/create", async (req, res) => {
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
});
// update job progress
app.post("/job-service/update", async (req, res) => {
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
});

// App listening
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Jobs Service is running on port ${PORT} 🚀`);
});
