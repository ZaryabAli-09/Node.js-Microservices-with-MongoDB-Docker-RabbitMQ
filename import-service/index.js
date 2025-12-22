import express from "express";
import dotenv from "dotenv";
import { ImportEngine } from "./engine/importEngine.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

// import engine task route
app.post("/import-service/import-tasks", ImportEngine);

// App listening
app.listen(PORT, () => {
  console.log(`Import Service is running on port ${PORT} 🚀`);
});
