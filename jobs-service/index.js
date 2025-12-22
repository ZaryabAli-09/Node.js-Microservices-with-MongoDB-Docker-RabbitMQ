import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./utils/dbConnection.js";
import jobRouter from "./routes/job.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cookieParser());

app.use("/job-service", jobRouter);

// App listening
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Jobs Service is running on port ${PORT} 🚀`);
});
