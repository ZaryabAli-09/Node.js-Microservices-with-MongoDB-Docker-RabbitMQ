import express from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { connectDB } from "./utils/dbConnection.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

// Api health check route
app.get("/health", (req, res) => {
  res.send("User Service is up and running ");
});

// app.use("/api/v1/users", ));

// Wildcard route for handling 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Middleware
app.use(errorMiddleware);

app.listen(port, async () => {
  try {
    console.log(`User-service running on port ${port} 🚀`);
    await connectDB();
  } catch (error) {
    console.log(`Error starting server : ${error.message}`);
  }
});
