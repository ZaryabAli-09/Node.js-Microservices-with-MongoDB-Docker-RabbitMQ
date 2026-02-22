import { Task } from "../models/task.model.js";

/**
 * Helper: Standard API Response
 */
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({ message, data });
};

/**
 * Create Single Task
 */
export async function createTask(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, 401, "Unauthorized");
    }

    const { title, description } = req.body;
    if (!title) {
      return sendResponse(res, 400, "Title is required");
    }

    const task = await Task.create({ title, description, userId });

    return sendResponse(res, 201, "Task created successfully", task);
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}

/**
 * Get All Tasks (Admin use case)
 */
export async function getAllTasks(req, res) {
  try {
    const tasks = await Task.find().lean();
    return sendResponse(res, 200, "Tasks retrieved successfully", tasks);
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}

/**
 * Get Task By ID (User Scoped)
 */
export async function getTaskById(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, userId }).lean();

    if (!task) {
      return sendResponse(res, 404, "Task not found");
    }

    return sendResponse(res, 200, "Task retrieved successfully", task);
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}

/**
 * Get Logged-in User Tasks
 */
export async function getUserTasks(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, 401, "Unauthorized");
    }

    const tasks = await Task.find({ userId }).lean();

    return sendResponse(res, 200, "User tasks retrieved successfully", tasks);
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}

/**
 * Update Task (User Scoped)
 */
export async function updateTask(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, description } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId },
      { title, description },
      { new: true },
    );

    if (!updatedTask) {
      return sendResponse(res, 404, "Task not found");
    }

    return sendResponse(res, 200, "Task updated successfully", updatedTask);
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}

/**
 * Delete Task (User Scoped)
 */
export async function deleteTask(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const deletedTask = await Task.findOneAndDelete({ _id: id, userId });

    if (!deletedTask) {
      return sendResponse(res, 404, "Task not found");
    }

    return sendResponse(res, 200, "Task deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}

/**
 * Bulk Create Tasks (User Scoped)
 */
export async function createTasks(req, res) {
  try {
    const userId = req.user?.id;
    const { tasks } = req.body;

    if (!userId) {
      return sendResponse(res, 401, "Unauthorized");
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return sendResponse(res, 400, "Tasks must be a non-empty array");
    }

    const tasksData = tasks.map((task) => ({
      title: task.title,
      description: task.description,
      userId,
    }));

    const savedTasks = await Task.insertMany(tasksData);

    return sendResponse(res, 201, "Tasks created successfully", {
      insertedCount: savedTasks.length,
      tasks: savedTasks,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message || "Internal Server Error");
  }
}
