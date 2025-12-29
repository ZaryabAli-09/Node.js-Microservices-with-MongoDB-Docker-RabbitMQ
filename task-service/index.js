import express from "express";
import { connectDB } from "./utils/dbConnection.js";
import dotenv from "dotenv";
import taskRouter from "./routes/task.routes.js";
import cookieParser from "cookie-parser";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}
const app = express();

app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 4000;

// Api health check route

app.get("/health", (req, res) => {
  res.send("Task Service is up and running ");
});

app.use("/task-service", taskRouter);
// Wildcard route for handling 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, async () => {
  try {
    console.log(`Task-service running on port ${port} 🚀`);
    await connectDB();
  } catch (error) {
    console.log(`Error starting server : ${error.message}`);
  }
});
