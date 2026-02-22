import mongoose from "mongoose";

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },
    userId: {
      required: true,
      index: true, // improves user-based queries
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Optional: enable text search
taskSchema.index({ title: "text", description: "text" });

export const Task = mongoose.model("Task", taskSchema);
