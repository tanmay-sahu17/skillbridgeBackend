import ImageKit from '@imagekit/nodejs';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { ApiError } from '../core/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload file to ImageKit with organized folder structure
 */
export const uploadToImageKit = async (filePath, role, userId, category, fileName) => {
  try {
    const fileStream = fs.createReadStream(filePath);

    const result = await imagekit.files.upload({
      file: fileStream, // required
      fileName: fileName || `upload_${Date.now()}`, // required
      folder: `skillbridge/${role}/${userId}/${category}`,
      useUniqueFileName: true,
    });

    // Delete local temp file after successful upload
    await fsPromises.unlink(filePath);
    
    return result.url;
  } catch (error) {
    // Clean up temp file on error too
    await fsPromises.unlink(filePath).catch(() => {});
    console.error('ImageKit Upload Error:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `File upload failed: ${error.message}`
    );
  }
};

export default imagekit;
