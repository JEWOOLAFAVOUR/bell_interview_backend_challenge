import request from "supertest";
import app from "../../app";
import {
  createTestUser,
  createTestAdmin,
  createTestProperty,
  createTestBooking,
  generateToken,
  getAuthHeaders,
} from "../utils/testHelpers";
import { User, Property, Booking } from "../../models";

describe("Bookings Integration Tests", () => {
  let user: any;
  let admin: any;
  let property: any;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Clean up database
    await Booking.destroy({ where: {}, force: true });
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test data
    user = await createTestUser();
    admin = await createTestAdmin();
    property = await createTestProperty();
    userToken = generateToken(user);
    adminToken = generateToken(admin);
  });

  describe("POST /api/v1/bookings", () => {
    it("should create booking successfully", async () => {
      // Generate future dates dynamically
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const bookingData = {
        property_id: property.id,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      const response = await request(app)
        .post("/api/v1/bookings")
        .set(getAuthHeaders(userToken))
        .send(bookingData)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Booking confirmed successfully",
          data: expect.objectContaining({
            booking: expect.objectContaining({
              property_id: property.id,
              user_id: user.id,
              status: "confirmed",
              start_date: expect.any(String),
              end_date: expect.any(String),
            }),
          }),
        })
      );
    });

    it("should require authentication for booking creation", async () => {
      // Generate future dates dynamically
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const bookingData = {
        property_id: property.id,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      const response = await request(app)
        .post("/api/v1/bookings")
        .send(bookingData)
        .expect(403);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/v1/bookings/my", () => {
    it("should get user bookings with boolean flags", async () => {
      const confirmedBooking = await createTestBooking(user, property, {
        status: "confirmed",
      });

      const response = await request(app)
        .get("/api/v1/bookings/my")
        .set(getAuthHeaders(userToken))
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "User bookings retrieved successfully",
          data: expect.objectContaining({
            bookings: expect.any(Array),
            summary: expect.objectContaining({
              total_bookings: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  describe("POST /api/v1/bookings/:id/cancel", () => {
    it("should cancel booking successfully", async () => {
      const booking = await createTestBooking(user, property);

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set(getAuthHeaders(userToken))
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Booking cancelled successfully",
          data: expect.objectContaining({
            booking: expect.objectContaining({
              id: booking.id,
              status: "cancelled",
            }),
          }),
        })
      );
    });
  });

  describe("GET /api/v1/bookings (Admin)", () => {
    it("should get all bookings as admin", async () => {
      await createTestBooking(user, property);

      const response = await request(app)
        .get("/api/v1/bookings")
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Bookings retrieved successfully",
          data: expect.objectContaining({
            bookings: expect.any(Array),
            pagination: expect.any(Object),
          }),
        })
      );
    });

    it("should deny access to regular users", async () => {
      const response = await request(app)
        .get("/api/v1/bookings")
        .set(getAuthHeaders(userToken))
        .expect(403);

      expect(response.body).toHaveProperty("success", false);
    });
  });
});
