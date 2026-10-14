import { uploadSingleFileToCloudinary } from "../middlewares/imageUploaderMiddleware.js";
import { enqueueCleanup, processCleanup } from "./asset_cleanup_service.js";
import { databaseWork } from "./lifecycle_service.js";

export const clearImage = async (document) => {
  const previous = document.img_url;
  await databaseWork(async (session) => {
    document.img_url = null;
    await document.save({ session });
    await enqueueCleanup([previous], session);
  });
  await processCleanup();
};

export const saveWithImage = async (document, file, folder) => {
  if (!file) return document.save();
  const previous = document.img_url;
  const uploaded = await uploadSingleFileToCloudinary(file, folder);
  document.img_url = uploaded;
  try {
    await databaseWork(async (session) => {
      await document.save({ session });
      if (previous) await enqueueCleanup([previous], session);
    });
  } catch (error) {
    document.img_url = previous;
    // On standalone MongoDB, only remove an upload if the save did not persist it.
    const persisted = await document.constructor.findById(document._id);
    if (persisted?.img_url !== uploaded) await enqueueCleanup([uploaded]);
    await processCleanup();
    throw error;
  }
  await processCleanup();
  return document;
};

export const createWithImage = async (values, file, folder, create) => {
  if (file) values.img_url = await uploadSingleFileToCloudinary(file, folder);
  try {
    return await create(values);
  } catch (error) {
    if (values.img_url) {
      await enqueueCleanup([values.img_url]);
      await processCleanup();
    }
    throw error;
  }
};
