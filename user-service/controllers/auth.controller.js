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

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function validateName(name) {
  const trimmedName = name?.trim();
  return trimmedName && trimmedName.length >= 2 && trimmedName.length <= 50;
}

// Token generation
function generateToken(userId) {
  if (!JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  try {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  } catch (error) {
    throw new AppError("Failed to generate authentication token", 500);
  }
}

// Error logging with context
function logError(context, error, additionalInfo = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    stack: error.stack,
    ...additionalInfo,
  };
  console.error(JSON.stringify(errorLog, null, 2));
}

// Send error response
function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : "An unexpected error occurred";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
}

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      throw new AppError("Name, email, and password are required", 400);
    }

    // Validate name format
    if (!validateName(name)) {
      throw new AppError("Name must be between 2 and 50 characters", 400);
    }

    // Validate email format
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      throw new AppError("Invalid email format", 400);
    }

    // Validate password strength
    if (!validatePassword(password)) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await User.findOne({ email: trimmedEmail.toLowerCase() });
    } catch (dbError) {
      throw new AppError("Database error while checking user existence", 500);
    }

    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    // Create new user
    let newUser;
    try {
      newUser = new User({
        name: name.trim(),
        email: trimmedEmail.toLowerCase(),
        password,
      });
      await newUser.save();
    } catch (dbError) {
      if (dbError.code === 11000) {
        throw new AppError("Email is already registered", 409);
      }
      if (dbError.name === "ValidationError") {
        const messages = Object.values(dbError.errors)
          .map((err) => err.message)
          .join(", ");
        throw new AppError(`Validation failed: ${messages}`, 400);
      }
      throw new AppError("Failed to register user", 500);
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    logError("registerUser", error, { email: req.body?.email });
    sendErrorResponse(res, error);
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    // Validate email format
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      throw new AppError("Invalid email format", 400);
    }

    // Find user and verify password
    let user;
    try {
      user = await User.findOne({ email: trimmedEmail.toLowerCase() });
    } catch (dbError) {
      throw new AppError("Database error during login", 500);
    }

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    let isPasswordValid;
    try {
      isPasswordValid = await user.comparePassword(password);
    } catch (compareError) {
      logError("loginUser - comparePassword", compareError);
      throw new AppError("Failed to verify password", 500);
    }

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie and send response
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        userId: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    logError("loginUser", error, { email: req.body?.email });
    sendErrorResponse(res, error);
  }
}

export async function logoutUser(req, res) {
  try {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logError("logoutUser", error);
    sendErrorResponse(res, error);
  }
}
