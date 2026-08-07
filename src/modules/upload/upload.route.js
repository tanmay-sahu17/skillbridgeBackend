import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../../middlewares/auth.middleware.js';
import { uploadToCloudinary } from '../../config/cloudinary.config.js';
import { uploadToImageKit } from '../../config/imagekit.config.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded' });
    }

    const role = req.user.role.toLowerCase();
    const category = req.body.folder || 'general';
    let url;
    if (role === 'college') {
      url = await uploadToCloudinary(
        req.file.path,
        role,
        req.user.id,
        category,
      );
    } else {
      url = await uploadToImageKit(
        req.file.path,
        role,
        req.user.id,
        category,
        req.file.originalname,
      );
    }

    res.status(200).json({
      success: true,
      data: {
        url,
        publicId: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Internal server error during upload' });
  }
});

export default router;
