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

// Updated file filter to allow images, videos, AND PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: Cb): void => {
    // Define allowed file types for images, videos, and PDFs
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|mpeg|mov|avi/;
    const allowedPdfTypes = /pdf/;

    const fileExtension = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mimeType = file.mimetype;

    const isImage = allowedImageTypes.test(fileExtension) && 
                    mimeType.startsWith('image/');

    const isVideo = allowedVideoTypes.test(fileExtension) && 
                    mimeType.startsWith('video/');


    const isPdf = allowedPdfTypes.test(fileExtension) && 
                  mimeType === 'application/pdf';

    if (isImage || isVideo || isPdf) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (jpeg, jpg, png, gif, webp), videos (mp4, mpeg, mov, avi), and PDFs are allowed!'));
    }
};

// Create the Multer instance with the configured options
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 1024 * 1024 * 5, // 5MB
        files: 1 // Only ONE file at a time
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
        // Multer-specific Errors
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
        // Other errors (e.g., file type validation)
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload error.',
        });
    }
    next();
};

// Helper function to determine file type category
export const getFileTypeCategory = (mimetype: string): 'image' | 'video' | 'pdf' | null => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'pdf';
    return null;
};

export { upload, multerErrorHandler };
export default upload;