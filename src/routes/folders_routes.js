import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import foldersRoutes from "../controllers/folders_controller.js";
import BooksRoutes from "./books_routes.js";
import foldersValidation from "../validations/folders_validation.js";
import { uploadSingleMiddleware } from "../middlewares/imageUploaderMiddleware.js";

const router = express.Router();

router.get("/", authenticate, foldersValidation.index, foldersRoutes.index);
router.post(
  "/",
  authenticate,
  uploadSingleMiddleware,
  foldersValidation.create,
  foldersRoutes.create
);
router.put(
  "/:id",
  authenticate,
  uploadSingleMiddleware,
  foldersValidation.update,
  foldersRoutes.update
);
router.delete(
  "/:id",
  authenticate,
  foldersValidation.destroy,
  foldersRoutes.destroy
);

router.use("/:folderId/books", BooksRoutes);

export default router;
