import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    throw new Error(`MongoDB connection error: ${error.message}`);
  }
}
