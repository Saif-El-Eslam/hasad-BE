import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/index.js";
import sharp from "sharp";

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Utility function to upload a single file
export const uploadSingleFileToCloudinary = async (file, folder) => {
  try {
    const compressedBuffer = await sharp(file.buffer)
      .resize({ width: 800 }) // Resize width to 800px
      .toFormat("jpeg") // Convert to JPEG for better compression
      .jpeg({ quality: 80 }) // Adjust quality (80% recommended)
      .toBuffer()
      .catch((error) => {
        console.error("Error compressing image:", error);
        throw new Error("Image compression failed");
      });

    const b64 = Buffer.from(compressedBuffer.buffer).toString("base64");
    let dataURI = `data:image/jpeg;base64,${b64}`;

    const response = await cloudinary.uploader.upload(dataURI, {
      folder, // Upload to the specified folder
      timeout: 60000, // Increase timeout to 60 seconds
    });

    return response.secure_url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error.status ? error : { status: 500, message: "Upload failed" };
  }
};

// Function to handle multiple file uploads
export const uploadFilesToCloudinary = async (files, folder) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided for upload");
  }

  if (!["profiles", "books", "folders", "benefits"].includes(folder)) {
    throw new Error("Invalid folder name");
  }

  const uploadPromises = files.map((file) =>
    uploadSingleFileToCloudinary(file, folder)
  );
  return Promise.all(uploadPromises);
};

// Function to delete images from Cloudinary
export const deleteFilesFromCloudinary = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) {
    return { result: "No images to delete" };
  }

  const deletePromises = imageUrls.map(async (image) => {
    try {
      const urlParts = image.split("/");
      const folderName = urlParts[urlParts.length - 2];
      const publicId = urlParts[urlParts.length - 1].split(".")[0];

      return await cloudinary.uploader.destroy(`${folderName}/${publicId}`);
    } catch (error) {
      console.error("Error deleting file:", error);
      return { result: "Failed to delete" };
    }
  });

  return Promise.all(deletePromises);
};

// Middleware for uploading multiple files
export const uploadMultipleMiddleware = upload.array("images");

// Middleware for uploading a single file
export const uploadSingleMiddleware = upload.single("image");
