import { Request, Response } from "express";
import { User } from "../../models/user/user";
import crypto from "crypto-js";
import { generateAccessToken } from "../../middlewares/verifyToken";
import { sendError } from "../../utils/helper";

const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstname, lastname, email, password, avatar } = req.body;
    // let role: string = "user";

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return sendError(
        res,
        400,
        "Firstname, lastname, email, and password are required"
      );
    }

    const secret_key = process.env.PASS_SEC;

    if (!secret_key) {
      throw new Error("PASS_SEC environment variable is required");
    }

    // Check if user already exists (only check email since username is removed)
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return sendError(res, 400, "Email already exists");
    }

    // Hash password with crypto-js
    const hashedPassword = crypto.AES.encrypt(password, secret_key).toString();
    const picked_avatar = avatar || "1";
    const userRole = "user"; // Default to 'user' role

    // Create and save new user
    const newUser = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: picked_avatar,
      role: userRole,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        fullname: `${newUser.firstname} ${newUser.lastname}`,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Create user error:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err: any) => err.message);
      return sendError(res, 400, messages.join(", "));
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return sendError(res, 400, "Email already exists");
    }

    return sendError(res, 500, "Internal server error");
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    const secret_key = process.env.PASS_SEC;

    if (!secret_key) {
      throw new Error("PASS_SEC environment variable is required");
    }

    // Check if user exists
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return sendError(res, 400, "Invalid email or password");
    }

    // Decrypt and compare password
    const decryptedPassword = crypto.AES.decrypt(
      user.password,
      secret_key
    ).toString(crypto.enc.Utf8);

    if (decryptedPassword !== password) {
      return sendError(res, 400, "Invalid email or password");
    }

    // Generate JWT token
    const token = generateAccessToken(
      user.id.toString(),
      user.role === "admin"
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        fullname: `${user.firstname} ${user.lastname}`,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

export default { createUser, loginUser };
