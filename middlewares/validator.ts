import { Request, Response, NextFunction } from "express";
import { check, validationResult, body } from "express-validator";

// Auth Validators
export const validateLogin = [
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 6, max: 20 })
    .withMessage("Password must be between 6 to 20 characters long!"),
];

export const validateUser = [
  check("firstname")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Firstname is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Firstname must be between 2 to 50 characters")
    .isAlpha()
    .withMessage("Firstname must contain only letters"),
  check("lastname")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Lastname is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Lastname must be between 2 to 50 characters")
    .isAlpha()
    .withMessage("Lastname must contain only letters"),
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 6, max: 20 })
    .withMessage("Password must be between 6 to 20 characters long!"),
  check("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
];

// Property Validators
export const validateProperty = [
  check("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Property title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 to 200 characters"),
  check("description")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Property description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 to 2000 characters"),
  check("price_per_night")
    .isFloat({ min: 0.01 })
    .withMessage("Price per night must be a positive number greater than 0"),
  check("available_from")
    .isISO8601()
    .withMessage("Available from date must be a valid date")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(value);
      if (inputDate < today) {
        throw new Error("Available from date cannot be in the past");
      }
      return true;
    }),
  check("available_to")
    .isISO8601()
    .withMessage("Available to date must be a valid date")
    .custom((value, { req }) => {
      const availableFrom = new Date(req.body.available_from);
      const availableTo = new Date(value);
      if (availableTo <= availableFrom) {
        throw new Error("Available to date must be after available from date");
      }
      return true;
    }),
];

export const validateUpdateProperty = [
  check("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 to 200 characters"),
  check("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 to 2000 characters"),
  check("price_per_night")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price per night must be a positive number greater than 0"),
  check("available_from")
    .optional()
    .isISO8601()
    .withMessage("Available from date must be a valid date"),
  check("available_to")
    .optional()
    .isISO8601()
    .withMessage("Available to date must be a valid date"),
];

// Booking Validators
export const validateBooking = [
  check("property_id")
    .isInt({ min: 1 })
    .withMessage("Property ID must be a valid positive integer"),
  check("start_date")
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(value);
      if (startDate < today) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  check("end_date")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
      // Check if booking duration is reasonable (max 365 days)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        throw new Error("Booking duration cannot exceed 365 days");
      }
      return true;
    }),
];

export const validateUpdateBooking = [
  check("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(value);
      if (startDate < today) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  check("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  check("status")
    .optional()
    .isIn(["pending", "confirmed", "cancelled"])
    .withMessage("Status must be 'pending', 'confirmed', or 'cancelled'"),
];

// Query Parameter Validators
export const validatePropertyQuery = [
  check("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  check("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  check("available_from")
    .optional()
    .isISO8601()
    .withMessage("Available from date must be a valid date"),
  check("available_to")
    .optional()
    .isISO8601()
    .withMessage("Available to date must be a valid date"),
  check("min_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),
  check("max_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number")
    .custom((value, { req }) => {
      if (
        req.query &&
        req.query.min_price &&
        parseFloat(value) < parseFloat(req.query.min_price as string)
      ) {
        throw new Error("Maximum price must be greater than minimum price");
      }
      return true;
    }),
];

export const validateAvailabilityQuery = [
  check("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  check("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      if (req.query && req.query.start_date) {
        const startDate = new Date(req.query.start_date as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
];

// ID Parameter Validators
export const validateParamId = [
  check("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a valid positive integer"),
];

// General validation middleware - FIXED THE RETURN TYPE ISSUE
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req).array();
  if (!errors.length) return next();

  // Return all errors for better debugging in development
  if (process.env.NODE_ENV === "development") {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
    return; // Add explicit return
  }

  // Return first error in production
  res.status(400).json({
    success: false,
    error: errors[0].msg,
  });
  return; // Add explicit return
};

// Sanitization middleware for common fields
export const sanitizeInput = [
  body("firstname").optional().trim().escape(),
  body("lastname").optional().trim().escape(),
  body("title").optional().trim().escape(),
  body("description").optional().trim().escape(),
];
