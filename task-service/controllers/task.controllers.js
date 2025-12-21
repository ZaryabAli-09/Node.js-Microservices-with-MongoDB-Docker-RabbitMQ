import { Task } from "../models/task.model.js";

export async function createTask(req, res) {
  try {
    console.log(req.user);
    const userId = req.user?.id;
    const { title, description } = req.body;
    const newTask = new Task({ title, description, userId });
    const savedTask = await newTask.save();
    res
      .status(201)
      .json({ message: "Task created successfully", data: savedTask });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

export async function getAllTask(req, res) {
  try {
    const tasks = await Task.find();
    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }
    res
      .status(200)
      .json({ message: "Tasks retrieved successfully", data: tasks });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
export async function getTaskById(req, res) {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res
      .status(200)
      .json({ message: "Task retrieved successfully", data: task });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
export async function getUserTasks(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const tasks = await Task.find({ userId });
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found for this user" });
    }
    res
      .status(200)
      .json({ message: "User tasks retrieved successfully", data: tasks });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res
      .status(200)
      .json({ message: "Task updated successfully", data: updatedTask });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
