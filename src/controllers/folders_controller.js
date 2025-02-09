import foldersService from "../services/folders_service.js";
import { validationResult } from "express-validator";
import {
  uploadSingleFileToCloudinary,
  deleteFilesFromCloudinary,
} from "../middlewares/imageUploaderMiddleware.js";

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

  try {
    const folder = {
      name: req.body.name,
      author: req.body.author,
      user: req.user_id,
    };

    const folderName = "folders";
    if (req.file) {
      const imageUrl = await uploadSingleFileToCloudinary(req.file, folderName);
      folder.img_url = imageUrl;
    }

    const newFolder = await foldersService.createFolder(folder);

    return res.status(201).json(newFolder);
  } catch (error) {
    console.log(error);
    return res.send(error.message).status(500);
  }
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const folder = await foldersService.getFolderById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (req.body.name) folder.name = req.body.name;
    if (req.body.author) folder.author = req.body.author;

    if (folder.img_url && req.file) {
      await deleteFilesFromCloudinary([folder.img_url]);

      folder.img_url = null;
      await folder.save();
    }
    if (req.file) {
      const folderName = "folders";
      const imageUrl = await uploadSingleFileToCloudinary(req.file, folderName);
      folder.img_url = imageUrl;
    }

    await folder.save();

    return res.status(200).json(folder);
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const folder = await foldersService.deleteFolder(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (folder.img_url) await deleteFilesFromCloudinary([folder.img_url]);

    await folder.deleteOne();

    return res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    return res.send(error.message).status(500);
  }
};

export default {
  index,
  create,
  update,
  destroy,
};
