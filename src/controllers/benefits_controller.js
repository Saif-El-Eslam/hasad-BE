import benefitsService from "../services/benefits_service.js";
import booksService from "../services/books_service.js";
import { validationResult } from "express-validator";
import { benefitColorBorderMap } from "../config/colors.js";
import {
  uploadSingleFileToCloudinary,
  deleteFilesFromCloudinary,
} from "../middlewares/imageUploaderMiddleware.js";

const index = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const query = {
    book: req.params.bookId,
    user: req.user_id,
  };

  benefitsService
    .getBenefits(query)
    .then((benefits) => {
      return res.status(200).json(benefits);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const create = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const benefit = {
      name: req.body.name,
      content: req.body.content,
      page_number: req.body.page_number,
      color: req.body.color,
      border_color: benefitColorBorderMap.get(req.body.color),
      book: req.params.bookId,
      user: req.user_id,
    };

    const folderName = "benefits";
    if (req.file) {
      const imageUrl = await uploadSingleFileToCloudinary(req.file, folderName);
      benefit.img_url = imageUrl;
    }

    const newBenefit = await benefitsService.createBenefit(benefit);
    if (newBenefit.book) {
      booksService.changeNumOfBenefits(newBenefit.book, 1);
    }

    return res.status(200).json(newBenefit);
  } catch (error) {
    return res.send(error.message).status(500);
  }
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const benefit = await benefitsService.getBenefitById(req.params.id);
    if (!benefit) {
      return res.status(404).json({ message: "Benefit not found" });
    }

    if (req.body.name) benefit.name = req.body.name;
    if (req.body.content) benefit.content = req.body.content;
    if (req.body.page_number) benefit.page_number = req.body.page_number;
    if (req.body.color) {
      benefit.color = req.body.color;
      benefit.border_color = benefitColorBorderMap.get(req.body.color);
    }

    if (benefit.img_url && req.file) {
      await deleteFilesFromCloudinary([benefit.img_url]);
      benefit.img_url = null;
      await benefit.save();
    }
    if (req.file) {
      const folderName = "benefits";
      const imageUrl = await uploadSingleFileToCloudinary(req.file, folderName);
      benefit.img_url = imageUrl;
    }

    await benefit.save();

    return res.status(200).json(benefit);
  } catch (error) {
    return res.send(error.message).status(500);
  }
};

const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const benefit = await benefitsService.getBenefitById(req.params.id);
    if (!benefit) {
      return res.status(404).json({ message: "Benefit not found" });
    }

    if (benefit.img_url) await deleteFilesFromCloudinary([benefit.img_url]);
    await booksService.changeNumOfBenefits(benefit.book, -1);

    await benefit.deleteOne();

    return res.status(200).json({ message: "Benefit deleted successfully" });
  } catch (error) {
    return res.send(error.message).status(500);
  }
};

const favourites = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const query = {
    user: req.user_id,
    favourated: true,
  };

  benefitsService
    .getBenefits(query)
    .then((benefits) => {
      return res.status(200).json(benefits);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const favourite = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  benefitsService
    .updateBenefit(req.params.id, { favourated: true })
    .then((favourite) => {
      return res.status(200).json(favourite);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const unfavourite = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  benefitsService
    .updateBenefit(req.params.id, { favourated: false })
    .then((favourite) => {
      return res.status(200).json(favourite);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

export default {
  index,
  create,
  update,
  destroy,
  favourites,
  favourite,
  unfavourite,
};
