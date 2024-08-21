import foldersService from "../services/folders_service.js";
import { validationResult } from "express-validator";

const index = async (req, res) => {
  const query = {};
  if (req.user_id) query.user = req.user_id;

  foldersService
    .getFolders(query)
    .then((folders) => {
      return res.status(200).json(folders);
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

  const folder = {
    name: req.body.name,
    author: req.body.author,
    user: req.user_id,
  };

  foldersService
    .createFolder(folder)
    .then((folder) => {
      return res.status(201).json(folder);
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

  const folder = {
    name: req.body.name,
    author: req.body.author,
  };
  foldersService
    .updateFolder(req.params.id, folder)
    .then((folder) => {
      return res.status(200).json(folder);
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

  foldersService
    .deleteFolder(req.params.id)
    .then((folder) => {
      return res.status(200).json(folder);
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
};
