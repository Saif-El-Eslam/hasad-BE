import { deleteResource } from "./lifecycle_service.js";
import Folder from "../models/folder.js";

// create a new folder
const createFolder = async (folder) => {
  const newFolder = new Folder(folder);
  const savedFolder = await newFolder.save();
  return savedFolder;
};

// get all folders
const getFolders = async (query = {}, sort = { createdAt: -1 }) => {
  const folders = await Folder.find(query).sort(sort);
  return folders;
};

// get a single folder By Id
const getFolderById = async (id) => {
  const folder = await Folder.findById(id);
  return folder;
};

// update a folder
const updateFolder = async (id, folder) => {
  const updatedFolder = await Folder.findByIdAndUpdate(id, folder, {
    new: true,
    runValidators: true,
  });
  return updatedFolder;
};

// increase the number of books in a folder
const changeNumOfBooks = async (id, num) => {
  const updatedFolder = await Folder.findByIdAndUpdate(
    id,
    { $inc: { num_of_books: num } },
    { new: true },
  );
  return updatedFolder;
};

// delete a folder
const deleteFolder = (id, user) =>
  deleteResource("folder", { _id: id, ...(user ? { user } : {}) });

export default {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  changeNumOfBooks,
};
