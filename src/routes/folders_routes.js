import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import foldersRoutes from "../controllers/folders_controller.js";
import foldersValidation from "../validations/folders_validation.js";

const router = express.Router();

router.get("/folders", authenticate, foldersRoutes.index);
router.post(
  "/folders",
  authenticate,
  foldersValidation.create,
  foldersRoutes.create
);
router.put(
  "/folders/:id",
  authenticate,
  foldersValidation.update,
  foldersRoutes.update
);
router.delete("/folders/:id", authenticate, foldersRoutes.destroy);

export default router;
