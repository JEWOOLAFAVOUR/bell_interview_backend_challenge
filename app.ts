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

// Only initialize database if not in test environment
if (process.env.NODE_ENV !== "test") {
  require("./db");
}

dotenv.config();

// Check required environment variables
const requiredEnvVars = ["JWT_SECRET"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`⚠️ Required environment variable ${envVar} is not set!`);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
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

// Only use morgan and rate limiting if not in test
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
  app.use(generalLimiter);
}

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

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
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
}

export default app;
