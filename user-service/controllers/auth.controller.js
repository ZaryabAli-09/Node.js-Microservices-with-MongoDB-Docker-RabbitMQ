import { ApiError } from "../utils/apiError.js";

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw ApiError(400, "Name, email and password are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError(409, "User with this email already exists");
    }
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json(new ApiResponse(null, "User registered successfully"));
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw ApiError(400, "Email and password are required");
    }
    const user = await User.find
      .findOne({ email, password })
      .select("-password");
    if (!user) {
      throw ApiError(401, "Invalid email or password");
    }
    res.status(200).json(new ApiResponse(user, "Login successful"));
  } catch (error) {
    next(error);
  }
}
