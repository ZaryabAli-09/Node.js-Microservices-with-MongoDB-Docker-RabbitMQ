import express from "express";
import {
  createTask,
  getAllTask,
  getTaskById,
  updateTask,
  deleteTask,
  getUserTasks,
  createTasks,
} from "../controllers/task.controllers.js";
import { verifyUser } from "../middlewares/verifyUser.js";
const router = express.Router();

router.post("/create", verifyUser, createTask);
router.get("/user-tasks", verifyUser, getUserTasks);
router.post("/create-many", createTasks);

router.put("/:id", verifyUser, updateTask);
router.delete("/:id", verifyUser, deleteTask);

router.get("/all", getAllTask);
router.get("/:id", getTaskById);

export default router;
