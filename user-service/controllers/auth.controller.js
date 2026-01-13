import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "30d";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

// Validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

// Token generation
function generateToken(userId) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user and verify password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie and send response
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function logoutUser(req, res) {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({ message: "Logout successful" });
}
