import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import authRoutes from "../controllers/auth_controller.js";
import authValidation from "../validations/auth_validation.js";
import { uploadSingleMiddleware } from "../middlewares/imageUploaderMiddleware.js";

const router = express.Router();

router.post("/register", authValidation.register, authRoutes.register);
router.post("/login", authValidation.login, authRoutes.login);
router.post("/logout", authenticate, authRoutes.logout);
router.post(
  "/verify-user-request",
  authenticate,
  authValidation.verifyUserRequest,
  authRoutes.verifyUserRequest
);
router.post(
  "/verify-user",
  authenticate,
  authValidation.verifyUser,
  authRoutes.verifyUser
);
router.post(
  "/reset-password-request",
  authenticate,
  authValidation.resetPasswordRequest,
  authRoutes.resetPasswordRequest
);
router.post(
  "/reset-password",
  authenticate,
  authValidation.resetPassword,
  authRoutes.resetPassword
);
router.post(
  "/profile-picture",
  authenticate,
  uploadSingleMiddleware,
  authValidation.uploadProfilePicture,
  authRoutes.uploadProfilePicture
);

router.delete(
  "/profile-picture",
  authenticate,
  authValidation.deleteProfilePicture,
  authRoutes.deleteProfilePicture
);

export default router;
