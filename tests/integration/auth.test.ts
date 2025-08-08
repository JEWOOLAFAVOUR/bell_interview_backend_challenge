import request from "supertest";
import app from "../../app";
import { sequelize } from "../../db";
import { User } from "../../models/user/user";

describe("Auth Integration Tests", () => {
  beforeEach(async () => {
    // Clean up database before each test
    await User.destroy({ where: {}, force: true });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "User created successfully", // Match your actual response
          user: expect.objectContaining({
            firstname: "John",
            lastname: "Doe",
            email: "john@example.com",
            role: "user",
          }),
        })
      );
    });

    it("should return validation error for invalid email", async () => {
      const userData = {
        firstname: "John",
        lastname: "Doe",
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("should return error if user already exists", async () => {
      // First registration
      await request(app).post("/api/v1/auth/register").send({
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "password123",
      });

      // Second registration with same email
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          firstname: "Jane",
          lastname: "Doe",
          email: "john@example.com",
          password: "password456",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app).post("/api/v1/auth/register").send({
        firstname: "Test",
        lastname: "User",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should login user with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Login successful",
          user: expect.objectContaining({
            email: "test@example.com",
            token: expect.any(String),
          }),
        })
      );
    });

    it("should return error for wrong password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });
});
