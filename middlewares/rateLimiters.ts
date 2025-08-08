import rateLimit from "express-rate-limit";

// Login rate limiter - 5 attempts per 10 minutes (ALL attempts count)
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    error: "Too many login attempts. Please try again in 10 minutes.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count ALL requests, including successful ones
});

// Register rate limiter - 3 attempts per 10 minutes (ALL attempts count)
export const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: "Too many registration attempts. Please try again in 10 minutes.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Booking creation limiter - 10 bookings per 15 minutes
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many booking attempts. Please try again in 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Admin operations limiter - 50 admin operations per 5 minutes
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: "Too many admin operations. Please try again in 5 minutes.",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Additional security: Failed login attempts limiter (more restrictive)
export const failedLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: "Too many failed login attempts. Please try again in 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req, res) => {
    // Skip counting if login was successful (status 200)
    return res.statusCode === 200;
  },
});
