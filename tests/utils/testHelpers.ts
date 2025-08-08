import jwt from "jsonwebtoken";
import crypto from "crypto-js";
import { User } from "../../models/user/user";
import { Property } from "../../models/property/property";
import { Booking } from "../../models/booking/booking";

export const createTestUser = async (userData: Partial<any> = {}) => {
  const secret_key = process.env.PASS_SEC || "testsecret";
  const hashedPassword = crypto.AES.encrypt(
    "password123",
    secret_key
  ).toString();

  const defaultUser = {
    firstname: "Test",
    lastname: "User",
    email: "test@example.com",
    password: hashedPassword,
    role: "user" as "user",
    avatar: "1",
  };

  const user = await User.create({ ...defaultUser, ...userData });
  return user;
};

export const createTestAdmin = async (userData: Partial<any> = {}) => {
  const secret_key = process.env.PASS_SEC || "testsecret";
  const hashedPassword = crypto.AES.encrypt(
    "password123",
    secret_key
  ).toString();

  const defaultAdmin = {
    firstname: "Admin",
    lastname: "User",
    email: "admin@example.com",
    password: hashedPassword,
    role: "admin" as "admin",
    avatar: "1",
  };

  const admin = await User.create({ ...defaultAdmin, ...userData });
  return admin;
};

export const createTestProperty = async (propertyData: Partial<any> = {}) => {
  const defaultProperty = {
    title: "Test Property",
    description:
      "A beautiful test property for vacation rental with amazing amenities and great location",
    price_per_night: 100.0,
    available_from: new Date("2025-06-01"), // Well into the future
    available_to: new Date("2025-12-31"),
  };

  const property = await Property.create({
    ...defaultProperty,
    ...propertyData,
    available_from: propertyData.available_from
      ? new Date(propertyData.available_from)
      : defaultProperty.available_from,
    available_to: propertyData.available_to
      ? new Date(propertyData.available_to)
      : defaultProperty.available_to,
  });
  return property;
};

export const createTestBooking = async (
  user: any,
  property: any,
  bookingData: Partial<any> = {}
) => {
  // Generate future dates dynamically
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);

  const defaultBooking = {
    property_id: property.id,
    user_id: user.id,
    user_name: `${user.firstname} ${user.lastname}`,
    start_date: tomorrow,
    end_date: weekLater,
    total_price: 500.0,
    status: "confirmed" as "confirmed",
  };

  const booking = await Booking.create({
    ...defaultBooking,
    ...bookingData,
    start_date: bookingData.start_date
      ? new Date(bookingData.start_date)
      : defaultBooking.start_date,
    end_date: bookingData.end_date
      ? new Date(bookingData.end_date)
      : defaultBooking.end_date,
  });
  return booking;
};

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
    },
    process.env.JWT_SECRET || "testsecret",
    { expiresIn: "1h" }
  );
};

export const getAuthHeaders = (token: string) => {
  return { Authorization: `Bearer ${token}` };
};

export const cleanupDatabase = async () => {
  try {
    await Booking.destroy({ where: {}, force: true });
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  } catch (error) {
    console.error("Error cleaning up database:", error);
  }
};
