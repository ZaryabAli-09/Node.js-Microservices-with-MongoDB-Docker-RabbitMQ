import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, lowercase: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
