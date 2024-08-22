import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import benefitsRoutes from "../controllers/benefits_controller.js";
import benefitsValidation from "../validations/benefits_validation.js";

const router = express.Router({ mergeParams: true });

router.get(
  "/favourites",
  // (req, res, next) => {
  //   if (req.params.bookId) {
  //     return next("route");
  //   }
  //   next();
  // },
  authenticate,
  benefitsValidation.favourites,
  benefitsRoutes.favourites
);

router.put(
  "/:id/favourite",
  authenticate,
  benefitsValidation.favourite,
  benefitsRoutes.favourite
);

router.put(
  "/:id/unfavourite",
  authenticate,
  benefitsValidation.unfavourite,
  benefitsRoutes.unfavourite
);

router.get("/", authenticate, benefitsValidation.index, benefitsRoutes.index);
router.post(
  "/",
  authenticate,
  benefitsValidation.create,
  benefitsRoutes.create
);
router.put(
  "/:id",
  authenticate,
  benefitsValidation.update,
  benefitsRoutes.update
);
router.delete(
  "/:id",
  authenticate,
  benefitsValidation.destroy,
  benefitsRoutes.destroy
);

export default router;
