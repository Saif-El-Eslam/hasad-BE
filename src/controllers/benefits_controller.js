import { saveWithImage, createWithImage } from "../services/image_service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import benefitsService from "../services/benefits_service.js";
import { validationResult } from "express-validator";
import { benefitColorBorderMap } from "../config/colors.js";
import { getSortQuery } from "../utils/sort.js";

const index = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const query = {
    book: req.params.bookId,
    user: req.user_id,
  };

  const { sortBy, sortDirection } = req.query;
  const sortQuery = getSortQuery(sortBy, sortDirection);

  return benefitsService
    .getBenefits(query, sortQuery)
    .then((benefits) => {
      return res.status(200).json(benefits);
    })
    .catch((error) => {
      throw error;
    });
};

const show = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const benefit = await benefitsService.getBenefitById(req.params.id);
  if (!benefit) {
    return res.status(404).json({ message: "Benefit not found" });
  }

  return res.status(200).json(benefit);
};

const create = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const benefit = {
    name: req.body.name,
    content: req.body.content,
    page_number: req.body.page_number,
    color: req.body.color,
    border_color: benefitColorBorderMap.get(req.body.color),
    book: req.params.bookId,
    user: req.user_id,
  };

  const newBenefit = await createWithImage(
    benefit,
    req.file,
    "benefits",
    benefitsService.createBenefit,
  );

  return res.status(200).json(newBenefit);
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

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

  await saveWithImage(benefit, req.file, "benefits");

  return res.status(200).json(benefit);
};

const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const benefit = await benefitsService.deleteBenefit(
    req.params.id,
    req.user_id,
  );
  if (!benefit) {
    return res.status(404).json({ message: "Benefit not found" });
  }

  return res.status(200).json({ message: "Benefit deleted successfully" });
};

const favourites = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const query = {
    user: req.user_id,
    favourated: true,
  };
  if (req.params.bookId) query.book = req.params.bookId;

  const { sortBy, sortDirection } = req.query;
  const sortQuery = getSortQuery(sortBy, sortDirection);

  return benefitsService
    .getBenefits(query, sortQuery)
    .then((benefits) => {
      return res.status(200).json(benefits);
    })
    .catch((error) => {
      throw error;
    });
};

const favourite = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  return benefitsService
    .updateBenefit(req.params.id, { favourated: true })
    .then((favourite) => {
      return res.status(200).json(favourite);
    })
    .catch((error) => {
      throw error;
    });
};

const unfavourite = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  return benefitsService
    .updateBenefit(req.params.id, { favourated: false })
    .then((favourite) => {
      return res.status(200).json(favourite);
    })
    .catch((error) => {
      throw error;
    });
};

export default Object.fromEntries(
  Object.entries({
    index,
    show,
    create,
    update,
    destroy,
    favourites,
    favourite,
    unfavourite,
  }).map(([name, handler]) => [name, asyncHandler(handler)]),
);
