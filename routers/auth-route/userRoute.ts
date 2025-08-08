import { Router } from "express";
import authController from "../../controllers/auth-controller/userController";
import {
  validateLogin,
  validateUser,
  validate,
} from "../../middlewares/validator";
import {
  loginLimiter,
  registerLimiter,
  failedLoginLimiter,
} from "../../middlewares/rateLimiters";

const router: Router = Router();

// USER ROUTES with layered rate limiting
router.post(
  "/register",
  registerLimiter, // 5 total attempts per 10 minutes
  validateUser,
  validate,
  authController.createUser
);

router.post(
  "/login",
  loginLimiter, // 8 total attempts per 10 minutes
  failedLoginLimiter, // 5 failed attempts per 15 minutes
  validateLogin,
  validate,
  authController.loginUser
);

export default router;
