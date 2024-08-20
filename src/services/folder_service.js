import Folder from "../models/folder.js";

// create a new folder
const createFolder = async (folder) => {
  try {
    const newFolder = new Folder(folder);
    const savedFolder = await newFolder.save();
    return savedFolder;
  } catch (error) {
    throw new Error(error.message);
  }
};

// get all folders
const getFolders = async () => {
  try {
    const folders = await Folder.find();
    return folders;
  } catch (error) {
    throw new Error(error.message);
  }
};

// get a single folder By Id
const getFolderById = async (id) => {
  try {
    const folder = await Folder.findById(id);
    return folder;
  } catch (error) {
    throw new Error(error.message);
  }
};

// update a folder
const updateFolder = async (id, folder) => {
  try {
    const updatedFolder = await Folder.findByIdAndUpdate(id, folder, {
      new: true,
    });
    return updatedFolder;
  } catch (error) {
    throw new Error(error.message);
  }
};

// delete a folder
const deleteFolder = async (id) => {
  try {
    const deletedFolder = await Folder.findByIdAndDelete(id);
    return deletedFolder;
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
};
