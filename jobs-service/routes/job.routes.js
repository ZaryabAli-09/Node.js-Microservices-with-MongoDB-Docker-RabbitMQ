import express from "express";
import { createJob, updateJob } from "../controllers/job.controllers.js";
const router = express.Router();

router.post("/create", createJob);

// update job progress
router.post("/update", updateJob);
export default router;
