import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import appConfig from './app.config.js';
import { ApiError } from '../core/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

cloudinary.config({
  cloud_name: appConfig.cloudinary.cloudName,
  api_key: appConfig.cloudinary.apiKey,
  api_secret: appConfig.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (filePath, role, userId, category) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `skillbridge/${role}/${userId}/${category}`,
      resource_type: 'auto',
    });
    await fs.unlink(filePath).catch(() => {});
    return result.secure_url;
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `File upload failed: ${error.message}`,
    );
  }
};

export default cloudinary;
