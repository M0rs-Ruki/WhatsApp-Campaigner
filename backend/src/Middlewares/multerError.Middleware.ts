
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const multerErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    if (err instanceof multer.MulterError) {
        // Multer-spacific Errror
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.',
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

export default multerErrorHandler;