import { Router } from "express";
import bookingController from "../../controllers/booking-controller/bookingController";
import {
  validateBooking,
  validateUpdateBooking,
  validateParamId,
  validate,
} from "../../middlewares/validator";
import { verifyToken, isAdmin } from "../../middlewares/verifyToken";
import { bookingLimiter, adminLimiter } from "../../middlewares/rateLimiters";

const router: Router = Router();

// User routes (require authentication)
router.post(
  "/",
  bookingLimiter,
  verifyToken,
  validateBooking,
  validate,
  bookingController.createBooking
);
router.get("/my", verifyToken, bookingController.getMyBookings);
router.get(
  "/:id",
  verifyToken,
  validateParamId,
  validate,
  bookingController.getBookingById
);
router.put(
  "/:id",
  verifyToken,
  validateParamId,
  validateUpdateBooking,
  validate,
  bookingController.updateBooking
);
router.delete(
  "/:id",
  verifyToken,
  validateParamId,
  validate,
  bookingController.deleteBooking
);

// Admin routes
router.get("/", adminLimiter, isAdmin, bookingController.getAllBookings);

export default router;
