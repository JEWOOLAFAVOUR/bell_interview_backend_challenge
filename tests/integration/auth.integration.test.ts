import request from "supertest";
import app from "../../app";
import { createTestUser, createTestAdmin } from "../utils/testHelpers";

describe("Auth Routes Integration Tests", () => {
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

      expect(response.body).toMatchObject({
        success: true,
        message: "User created successfully",
        user: {
          firstname: "John",
          lastname: "Doe",
          email: "john@example.com",
          role: "user",
        },
      });
    });

    it("should return validation error for invalid data", async () => {
      const invalidUserData = {
        firstname: "J", // Too short
        lastname: "Doe",
        email: "invalid-email",
        password: "123", // Too short
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it("should return error if user already exists", async () => {
      // Create a user first
      await createTestUser({ email: "john@example.com" });

      const userData = {
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: "User already exists",
      });
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login user with correct credentials", async () => {
      // Create a test user
      await createTestUser({
        email: "john@example.com",
        password: "password123",
      });

      const loginData = {
        email: "john@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Login successful",
        data: {
          user: {
            email: "john@example.com",
            role: "user",
          },
          token: expect.any(String),
        },
      });
    });

    it("should return error for invalid credentials", async () => {
      await createTestUser({
        email: "john@example.com",
        password: "password123",
      });

      const loginData = {
        email: "john@example.com",
        password: "wrongPassword",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: "Invalid email or password",
      });
    });

    it("should return error for non-existent user", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid email or password",
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should block requests after rate limit is exceeded", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      // Make multiple requests to exceed rate limit
      for (let i = 0; i < 6; i++) {
        await request(app).post("/api/v1/auth/login").send(loginData);
      }

      // The next request should be rate limited
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(429);

      expect(response.body).toMatchObject({
        error: expect.stringContaining("Too many"),
      });
    });
  });
});
