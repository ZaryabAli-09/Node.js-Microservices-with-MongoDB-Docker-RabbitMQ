import express from "express";
import { createJob, updateJob } from "../controllers/job.controllers.js";
import { verifyUser } from "../middlewares/verifyUser.js";
const router = express.Router();

router.post("/create", createJob);
router.put("/:id", updateJob);

export default router;
