import express from "express";
import {
  createJob,
  getJobBy,
  updateJob,
} from "../controllers/job.controllers.js";
const router = express.Router();

router.post("/create", createJob);

// update job progress
router.post("/update", updateJob);

router.get("/:id", getJobBy);

export default router;
