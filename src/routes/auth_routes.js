import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import authRoutes from "../controllers/auth_controller.js";
import authValidation from "../validations/auth_validation.js";

const router = express.Router();

router.post("/register", authValidation.register, authRoutes.register);
router.post("/login", authValidation.login, authRoutes.login);
router.post("/logout", authenticate, authRoutes.logout);

export default router;
