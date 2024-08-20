import folderService from "../services/folder_service.js";
import { validationResult } from "express-validator";

const index = async (req, res) => {
  folderService
    .getFolders()
    .then((folders) => {
      res.status(200).json(folders);
    })
    .catch((error) => {
      res.send(error.message).status(500);
    });
};

const create = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const folder = {
    name: req.body.name,
    user: req.user_id,
  };

  folderService
    .createFolder(folder)
    .then((folder) => {
      res.status(201).json(folder);
    })
    .catch((error) => {
      res.send(error.message).status(500);
    });
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  if (!(await folderService.getFolderById(req.params.id)))
    return res.status(404).json({ message: "Folder not found" });

  const folder = {
    name: req.body.name,
    author: req.body.author,
  };

  folderService
    .updateFolder(req.params.id, folder)
    .then((folder) => {
      res.status(200).json(folder);
    })
    .catch((error) => {
      res.send(error.message).status(500);
    });
};

const destroy = async (req, res) => {
  if (!(await folderService.getFolderById(req.params.id)))
    return res.status(404).json({ message: "Folder not found" });

  folderService
    .deleteFolder(req.params.id)
    .then((folder) => {
      res.status(200).json(folder);
    })
    .catch((error) => {
      res.send(error.message).status(500);
    });
};

export default {
  index,
  create,
  update,
  destroy,
};
