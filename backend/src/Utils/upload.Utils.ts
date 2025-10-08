import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import { fileURLToPath } from 'url';

// ESM alternative to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Cb = FileFilterCallback;

// Configure disk storage for Multer
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const destinationPath = path.join(__dirname, '..', '..', 'public', 'images');
        cb(null, destinationPath);
    },

    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

// File filter to allow only specific image types
const fileFilter = (req: Request, file: Express.Multer.File, cb: Cb): void => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;

    const isExtensionAllowed = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const isMimeTypeAllowed = allowedFileTypes.test(file.mimetype);

    if (isExtensionAllowed && isMimeTypeAllowed) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
    }
};

// Create the Multer instance with the configured options
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 1024 * 1024 * 5 // 5MB
    },
    fileFilter: fileFilter
});

export default upload;
