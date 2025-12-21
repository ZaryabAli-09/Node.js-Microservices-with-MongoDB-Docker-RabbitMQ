import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controllers/user.controllers.js";
import { verifyUser } from "../middlewares/verifyUser.js";

const router = express.Router();

router.get("/all", getAllUsers);
router.get("/:id", getUserById);

router.put("/:id", verifyUser, updateUser);
router.delete("/:id", verifyUser, deleteUser);

export default router;
