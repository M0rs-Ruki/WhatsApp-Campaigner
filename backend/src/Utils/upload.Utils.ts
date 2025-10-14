import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM alternative to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Cb = multer.FileFilterCallback;

// Configure disk storage for Multer
const storage = multer.diskStorage({
    destination: (
        req: Request, 
        file: Express.Multer.File, 
        cb: (error: Error | null, destination: string) => void
    ) => {
        const destinationPath = path.join(__dirname, '..', '..', 'public', 'uploads');
        cb(null, destinationPath);
    },

    filename: (
        req: Request, 
        file: Express.Multer.File, 
        cb: (error: Error | null, filename: string) => void
    ) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

// ✅ FIXED: Strict image validation (JPG, PNG, GIF, WebP only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: Cb): void => {
    // Define allowed MIME types and extensions
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'  // ✅ Correct MIME type for WebP
    ];

    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Check both MIME type AND extension
    const isValidMimeType = allowedMimeTypes.includes(mimeType);
    const isValidExtension = allowedExtensions.test(fileExtension);

    if (isValidMimeType && isValidExtension) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed!'));
    }
};

// Create the Multer instance
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 1024 * 1024 * 5, // 5MB
        files: 1
    },
    fileFilter: fileFilter
});

// Multer error handler middleware
const multerErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.',
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'You can only upload one file at a time.',
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name.',
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload error.',
        });
    }
    next();
};

// Helper function for file type category
export const getFileTypeCategory = (mimetype: string): 'image' | 'video' | 'pdf' | null => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'pdf';
    return null;
};

export { upload, multerErrorHandler };
export default upload;
