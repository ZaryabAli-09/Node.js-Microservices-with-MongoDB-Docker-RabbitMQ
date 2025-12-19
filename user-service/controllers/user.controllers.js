export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(new ApiResponse(users, "Users fetched successfully"));
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(user, "User fetched successfully"));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) {
      throw ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(user, "User updated successfully"));
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(null, "User deleted successfully"));
  } catch (error) {
    next(error);
  }
}
