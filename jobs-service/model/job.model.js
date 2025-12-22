import mongoose from "mongoose";

// job model
const jobsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    jobType: { type: String, enum: ["IMPORT", "EXPORT "] },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    chunkSize: { type: Number, default: 10 },
    currentChunk: { type: Number, default: 0 },
    totalItemsNum: { type: Number, default: 0 },
    processedItems: { type: Number, default: 0 },
  },

  {
    timestamps: true,
  }
);
export const Job = mongoose.model("Job", jobsSchema);
