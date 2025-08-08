import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/helper";
import { User } from "../models/user/user";
import { CustomRequest } from "../utils/types";

export const generateAccessToken = (
  userId: string,
  isAdmin: boolean
): string => {
  return jwt.sign({ id: userId, isAdmin }, process.env.JWT_SECRET as string, {
    expiresIn: "40d",
  });
};

export const verifyToken = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return sendError(res, 403, "No token provided");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.userId = decoded.id;

    // Use Sequelize findByPk instead of findById
    const user = await User.findByPk(decoded.id);

    if (!user) return sendError(res, 404, "User not found");

    // Convert Sequelize instance to plain object for easier access
    req.user = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isAdmin: user.role === "admin",
    };

    next();
  } catch (error: any) {
    return sendError(res, 401, error.message || "Invalid token");
  }
};

export const isAdmin = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return sendError(res, 403, "No token provided");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.userId = decoded.id;

    // Use Sequelize findByPk instead of findById
    const user = await User.findByPk(decoded.id);

    if (!user) return sendError(res, 404, "User not found");

    // Convert Sequelize instance to plain object
    req.user = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isAdmin: user.role === "admin",
    };

    // Check if user is admin
    if (user.role !== "admin") {
      return sendError(res, 403, "Admin access only");
    }

    next();
  } catch (error: any) {
    return sendError(res, 401, error.message || "Invalid token");
  }
};
