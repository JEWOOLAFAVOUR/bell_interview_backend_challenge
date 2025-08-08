import rateLimit from "express-rate-limit";

// Login rate limiter - 5 attempts per 10 minutes
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 login attempts per 10 minutes
  message: {
    success: false,
    error: "Too many login attempts. Please try again in 10 minutes.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Register rate limiter - 3 attempts per 10 minutes
export const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 registration attempts per 10 minutes
  message: {
    success: false,
    error: "Too many registration attempts. Please try again in 10 minutes.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful registrations
});

// Booking creation limiter - 10 bookings per 15 minutes
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 booking attempts per 15 minutes
  message: {
    success: false,
    error: "Too many booking attempts. Please try again in 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password reset limiter (if you add this feature)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    error: "Too many password reset attempts. Please try again in 1 hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations limiter
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 admin operations per 5 minutes
  message: {
    success: false,
    error: "Too many admin operations. Please try again in 5 minutes.",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
