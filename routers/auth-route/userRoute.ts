import { Router } from "express";
import authController from "../../controllers/auth-controller/userController";
import {
  validateLogin,
  validateUser,
  validate,
} from "../../middlewares/validator";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimiters";

const router: Router = Router();

// USER ROUTES with specific rate limiters
router.post(
  "/register",
  registerLimiter, // 3 attempts per 10 minutes
  validateUser,
  validate,
  authController.createUser
);

router.post(
  "/login",
  loginLimiter, // 5 attempts per 10 minutes
  validateLogin,
  validate,
  authController.loginUser
);

export default router;
