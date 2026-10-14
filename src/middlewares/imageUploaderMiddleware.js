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
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 30, parts: 40 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      const error = new Error("Invalid image type");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

// Utility function to upload a single file
export const uploadSingleFileToCloudinary = async (file, folder) => {
  const compressedBuffer = await sharp(file.buffer, {
    limitInputPixels: 40 * 1000 * 1000,
  })
    .resize({ width: 800 }) // Resize width to 800px
    .toFormat("jpeg") // Convert to JPEG for better compression
    .jpeg({ quality: 80 }) // Adjust quality (80% recommended)
    .toBuffer()
    .catch((error) => {
      const invalid = new Error("Image compression failed", { cause: error });
      invalid.status = 400;
      throw invalid;
    });

  const b64 = compressedBuffer.toString("base64");
  let dataURI = `data:image/jpeg;base64,${b64}`;

  const response = await cloudinary.uploader.upload(dataURI, {
    folder: `hasad/${folder}`,
    timeout: 60000, // Increase timeout to 60 seconds
  });

  return response.secure_url;
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
    uploadSingleFileToCloudinary(file, folder),
  );
  return Promise.all(uploadPromises);
};

// Function to delete images from Cloudinary
export const deleteFilesFromCloudinary = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  const deletePromises = imageUrls.map(async (image) => {
    try {
      const url = new URL(image);
      if (url.hostname !== "res.cloudinary.com")
        throw new Error("Invalid asset URL");
      const prefix = `/${config.cloud_name}/image/upload/`;
      if (!url.pathname.startsWith(prefix))
        throw new Error("Invalid asset path");
      const path = url.pathname.slice(prefix.length).replace(/^v[0-9]+\//, "");
      if (!path.startsWith("hasad/")) throw new Error("Invalid asset folder");
      const publicId = decodeURIComponent(path.replace(/\.[^/.]+$/, ""));

      return await cloudinary.uploader.destroy(publicId, { timeout: 10000 });
    } catch (error) {
      return { result: "Failed to delete" };
    }
  });

  return Promise.all(deletePromises);
};

// Middleware for uploading multiple files
export const uploadMultipleMiddleware = upload.array("images", 10);

// Middleware for uploading a single file
export const uploadSingleMiddleware = upload.single("image");
