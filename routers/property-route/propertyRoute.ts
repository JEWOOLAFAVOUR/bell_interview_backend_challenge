import { Router } from "express";
import propertyController from "../../controllers/property-controller/propertyController";
import {
  validateProperty,
  validateUpdateProperty,
  validatePropertyQuery,
  validateAvailabilityQuery,
  validateParamId,
  validate,
} from "../../middlewares/validator";
import { verifyToken, isAdmin } from "../../middlewares/verifyToken";
import { adminLimiter } from "../../middlewares/rateLimiters";

const router: Router = Router();

// Public routes
router.get(
  "/",
  validatePropertyQuery,
  validate,
  propertyController.getAllProperties
);
router.get(
  "/available",
  validatePropertyQuery,
  validate,
  propertyController.getAvailableProperties
);

// New route
router.get(
  "/:id",
  validateParamId,
  validate,
  propertyController.getPropertyById
);
router.get(
  "/:id/availability",
  validateParamId,
  validateAvailabilityQuery,
  validate,
  propertyController.getPropertyAvailability
);

// Admin only routes
router.post(
  "/",
  adminLimiter,
  isAdmin,
  validateProperty,
  validate,
  propertyController.createProperty
);
router.put(
  "/:id",
  adminLimiter,
  isAdmin,
  validateParamId,
  validateUpdateProperty,
  validate,
  propertyController.updateProperty
);
router.delete(
  "/:id",
  adminLimiter,
  isAdmin,
  validateParamId,
  validate,
  propertyController.deleteProperty
);

export default router;
