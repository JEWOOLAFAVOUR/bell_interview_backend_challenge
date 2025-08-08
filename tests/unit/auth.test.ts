import crypto from "crypto-js";
import jwt from "jsonwebtoken";
import { User } from "../../models/user/user";
import authController from "../../controllers/auth-controller/userController";
import { createTestUser } from "../utils/testHelpers";

describe("Auth Controller Unit Tests", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      // Arrange
      mockReq.body = {
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        id: 1,
        firstname: "John",
        lastname: "Doe",
        fullname: "John Doe",
        email: "john@example.com",
        avatar: undefined,
        role: "user",
      };

      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User, "create").mockResolvedValue(mockUser as any);

      // Act
      await authController.createUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "User created successfully",
        user: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          fullname: "John Doe",
          email: "john@example.com",
          avatar: undefined,
          role: "user",
        },
      });
    });

    it("should return error if user already exists", async () => {
      // Arrange
      mockReq.body = {
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "password123",
      };

      const existingUser = await createTestUser({ email: "john@example.com" });
      jest.spyOn(User, "findOne").mockResolvedValue(existingUser);

      // Act
      await authController.createUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already exists",
        error: null,
      });
    });
  });

  describe("loginUser", () => {
    it("should login user successfully with correct credentials", async () => {
      // Arrange
      mockReq.body = {
        email: "john@example.com",
        password: "password123",
      };

      // Create a user with the same password encryption as the real controller
      const secret_key = process.env.PASS_SEC || "testsecret";
      const encryptedPassword = crypto.AES.encrypt(
        "password123",
        secret_key
      ).toString();

      const mockUser = {
        id: 1,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: encryptedPassword,
        avatar: "1",
        role: "user",
      };

      jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);
      jest.spyOn(jwt, "sign").mockReturnValue("mockToken" as any);

      // Act
      await authController.loginUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Login successful",
        user: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          fullname: "John Doe",
          email: "john@example.com",
          avatar: "1",
          role: "user",
          token: "mockToken",
        },
      });
    });

    it("should return error for invalid credentials", async () => {
      // Arrange
      mockReq.body = {
        email: "john@example.com",
        password: "wrongPassword",
      };

      // Create a user with different password
      const secret_key = process.env.PASS_SEC || "testsecret";
      const encryptedPassword = crypto.AES.encrypt(
        "password123",
        secret_key
      ).toString();

      const mockUser = {
        id: 1,
        password: encryptedPassword,
      };

      jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      // Act
      await authController.loginUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
        error: null,
      });
    });
  });
});
