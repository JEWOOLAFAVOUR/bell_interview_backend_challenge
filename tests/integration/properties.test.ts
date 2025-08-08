import request from "supertest";
import app from "../../app";
import {
  createTestUser,
  createTestAdmin,
  createTestProperty,
  generateToken,
  getAuthHeaders,
} from "../utils/testHelpers";
import { User, Property } from "../../models";

describe("Properties Integration Tests", () => {
  let user: any;
  let admin: any;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Clean up database
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test users
    user = await createTestUser();
    admin = await createTestAdmin();
    userToken = generateToken(user);
    adminToken = generateToken(admin);
  });

  describe("GET /api/v1/properties", () => {
    it("should get all properties without authentication", async () => {
      await createTestProperty();
      await createTestProperty({ title: "Second Property" });

      const response = await request(app).get("/api/v1/properties").expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Properties retrieved successfully",
          data: expect.objectContaining({
            properties: expect.any(Array),
            pagination: expect.objectContaining({
              currentPage: expect.any(Number),
              totalPages: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  describe("POST /api/v1/properties", () => {
    it("should create property as admin", async () => {
      // Generate future dates dynamically to avoid past date validation issues
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365); // One year from now

      const propertyData = {
        title: "New Test Property",
        description:
          "A beautiful new property for testing with great amenities",
        price_per_night: 200,
        available_from: tomorrow.toISOString().split("T")[0], // Format as YYYY-MM-DD
        available_to: futureDate.toISOString().split("T")[0],
      };

      const response = await request(app)
        .post("/api/v1/properties")
        .set(getAuthHeaders(adminToken))
        .send(propertyData);

      if (response.status !== 201) {
        console.error("Property creation failed:", {
          status: response.status,
          body: response.body,
          propertyData,
          adminToken: adminToken.substring(0, 20) + "...",
        });
      }

      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Property created successfully",
          data: expect.objectContaining({
            property: expect.objectContaining({
              title: "New Test Property",
            }),
          }),
        })
      );
    });

    it("should deny property creation for regular user", async () => {
      const propertyData = {
        title: "New Test Property",
        description:
          "A beautiful new property for testing with great amenities",
        price_per_night: 200,
        available_from: "2025-01-01",
        available_to: "2025-12-31",
      };

      const response = await request(app)
        .post("/api/v1/properties")
        .set(getAuthHeaders(userToken))
        .send(propertyData)
        .expect(403);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/v1/properties/available", () => {
    it("should get only available properties", async () => {
      const property = await createTestProperty();

      const response = await request(app)
        .get("/api/v1/properties/available")
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Available properties retrieved successfully",
          data: expect.objectContaining({
            properties: expect.any(Array),
          }),
        })
      );
    });
  });
});
