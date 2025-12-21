import jwt from "jsonwebtoken";

export function verifyUser(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    console.log(err.message);
    res.status(401).json({ message: "Invalid token" });
  }
}
