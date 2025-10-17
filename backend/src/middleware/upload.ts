import multer from 'multer';

// Configure multer for memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Export field configurations for different upload scenarios
export const profileMediaUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]);

export const serviceMediaUpload = upload.array('serviceMedia', 10); // Max 10 images per service
