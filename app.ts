import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import "express-async-errors";
import helmet from "helmet";
import authRouter from "./routers/auth-route/userRoute";
import propertyRouter from "./routers/property-route/propertyRoute";
import bookingRouter from "./routers/booking-route/bookingRoute";
import "./db"; // This will connect to PostgreSQL

dotenv.config();

// Check required environment variables
const requiredEnvVars = ["JWT_SECRET", "NODE_ENV"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`⚠️ Required environment variable ${envVar} is not set!`);
    process.exit(1);
  }
});

// Initialize Express app
const app = express();

// General rate limiting (200 requests per 10 minutes)
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("combined")); // Simple logging
app.use(generalLimiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/properties", propertyRouter);
app.use("/api/v1/bookings", bookingRouter);

// Handle 404 routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global error handling middleware
app.use(function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`Error: ${err.message} (${req.method} ${req.originalUrl})`);

  // Handle specific error types
  if (err.name === "UnauthorizedError") {
    res.status(401).json({
      success: false,
      error: "Invalid token or not authenticated",
    });
    return;
  }

  if (
    err.name === "ValidationError" ||
    err.name === "SequelizeValidationError"
  ) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.message,
    });
    return;
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error(`Unhandled Rejection:`, reason);
  process.exit(1);
});

export default app;
