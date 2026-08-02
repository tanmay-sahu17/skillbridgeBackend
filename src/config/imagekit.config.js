import ImageKit from '@imagekit/nodejs';
import fs from 'fs/promises';
import { ApiError } from '../core/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload file to ImageKit with organized folder structure
 *
 * Example paths:
 *   skillbridge/college/abc123/logos
 *   skillbridge/student/xyz456/resume
 */
export const uploadToImageKit = async (filePath, role, userId, category, fileName) => {
  try {
    const fileBuffer = await fs.readFile(filePath);

    const result = await imagekit.upload({
      file: fileBuffer, // required
      fileName: fileName || `upload_${Date.now()}`, // required
      folder: `skillbridge/${role}/${userId}/${category}`,
      useUniqueFileName: true,
    });

    // Delete local temp file after successful upload
    await fs.unlink(filePath);
    
    return result.url;
  } catch (error) {
    // Clean up temp file on error too
    await fs.unlink(filePath).catch(() => {});
    console.error('ImageKit Upload Error:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `File upload failed: ${error.message}`
    );
  }
};

export default imagekit;
