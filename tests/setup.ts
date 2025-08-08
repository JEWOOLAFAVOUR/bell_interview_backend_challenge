// Set test environment variables BEFORE importing modules
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.DB_NAME = "bell_booking_test_db";
process.env.PORT = "5001"; // Use different port for tests

// Mock rate limiters for testing to prevent rate limit errors
jest.mock("../middlewares/rateLimiters", () => ({
  loginLimiter: (req: any, res: any, next: any) => next(),
  registerLimiter: (req: any, res: any, next: any) => next(),
  bookingLimiter: (req: any, res: any, next: any) => next(),
  adminLimiter: (req: any, res: any, next: any) => next(),
  failedLoginLimiter: (req: any, res: any, next: any) => next(),
}));

import { sequelize } from "../db";

// Suppress console logs during tests
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(async () => {
  try {
    // Connect to test database and sync
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // This will recreate all tables

    originalLog("✅ Test database connected and synced");
  } catch (error) {
    originalError("❌ Unable to connect to test database:", error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    originalLog("✅ Test database disconnected");
  } catch (error) {
    originalError("❌ Error closing test database:", error);
  }
});

// Global test timeout
jest.setTimeout(30000);
