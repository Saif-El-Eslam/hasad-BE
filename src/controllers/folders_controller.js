import { saveWithImage, createWithImage } from "../services/image_service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import foldersService from "../services/folders_service.js";
import { validationResult } from "express-validator";
import { getSortQuery } from "../utils/sort.js";

const index = async (req, res) => {
  const query = {};
  if (req.user_id) query.user = req.user_id;

  const { sortBy, sortDirection } = req.query;
  const sortQuery = getSortQuery(sortBy, sortDirection);

  return foldersService
    .getFolders(query, sortQuery)
    .then((folders) => {
      return res.status(200).json(folders);
    })
    .catch((error) => {
      throw error;
    });
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

  const folder = {
    name: req.body.name,
    author: req.body.author,
    user: req.user_id,
  };

  const newFolder = await createWithImage(
    folder,
    req.file,
    "folders",
    foldersService.createFolder,
  );

  return res.status(201).json(newFolder);
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

  const folder = await foldersService.getFolderById(req.params.id);
  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  if (req.body.name) folder.name = req.body.name;
  if (req.body.author) folder.author = req.body.author;

  await saveWithImage(folder, req.file, "folders");

  return res.status(200).json(folder);
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

  const folder = await foldersService.deleteFolder(req.params.id, req.user_id);
  if (!folder) return res.status(404).json({ message: "Folder not found" });

  return res.status(200).json({ message: "Folder deleted successfully" });
};

export default Object.fromEntries(
  Object.entries({
    index,
    create,
    update,
    destroy,
  }).map(([name, handler]) => [name, asyncHandler(handler)]),
);
