import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Environment variables base upload dir or default
const uploadDir = process.env.UPLOAD_PATH || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `vehicle-${uniqueSuffix}${ext}`);
  },
});

// File Filter (Only Images allowed)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP image files are allowed.'));
  }
};

// Multer Upload Instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Max Limit
  },
});
