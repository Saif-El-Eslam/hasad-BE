import benefitsService from "../services/benefits_service.js";
import booksService from "../services/books_service.js";
import { validationResult } from "express-validator";

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

  const benefit = {
    name: req.body.name,
    content: req.body.content,
    page_number: req.body.page_number,
    Image_url: req.body.Image_url,
    color: req.body.color,
    book: req.params.bookId,
    user: req.user_id,
  };

  benefitsService
    .createBenefit(benefit)
    .then((benefit) => {
      booksService.changeNumOfBenefits(req.params.bookId, 1);

      return res.status(201).json(benefit);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const benefit = {
    name: req.body.name,
    content: req.body.content,
    page_number: req.body.page_number,
    Image_url: req.body.Image_url,
    color: req.body.color,
    book: req.params.bookId,
    user: req.user_id,
  };

  benefitsService
    .updateBenefit(req.params.id, benefit)
    .then((benefit) => {
      return res.status(200).json(benefit);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  benefitsService
    .deleteBenefit(req.params.id)
    .then((benefit) => {
      booksService.changeNumOfBenefits(req.params.bookId, -1);

      return res.status(200).json(benefit);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
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
