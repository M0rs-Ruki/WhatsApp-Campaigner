import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("🔴 Cloudinary environment variables are not set properly. Exiting.");
    process.exit(1);
}

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param localFilePath - Path to the file on local disk
 * @param folder - Cloudinary folder (e.g., 'whatsapp-campaign/users')
 * @param publicId - Custom public ID for the file (optional)
 * @param resourceType - Type of resource: 'image' | 'video' | 'raw' (for PDFs)
 */

export const uploadToCloudinary = async (
    localFilePath: string,
    folder: string,
    publicId?: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<string> => {
    try {
        if (!localFilePath) {
            throw new Error('Local file path is required');
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            folder: folder,
            public_id: publicId,
            resource_type: resourceType,
            // For image only
            ...(resourceType === 'image' && {
                transformation: [
                    {quality: 'auto'},
                    {fatch_format: 'auto'}
                ]
            }),
        });

        // Deleteing the local files after success 
        fs.unlinkSync(localFilePath);

        // Return Cloudinary URL
        return uploadResult.secure_url;


    } catch (error: any) {
        // Delete local file even if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};

/**
 * Delete file from Cloudinary
 * @param imageUrl - Full Cloudinary URL
 * @param resourceType - Type of resource: 'image' | 'video' | 'raw'
 */

export const deleteFromCloudinary = async (
    imageUrl: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
    try {
        if (!imageUrl) return;

        // Extract public_id from Cloudinary URL
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567/whatsapp-campaign/users/user-123-456.jpg
        const urlParts = imageUrl.split('/upload/');
        if (urlParts.length < 2) return;

        const pathWithVersion = urlParts[1]; // v1234567/whatsapp-campaign/users/user-123-456.jpg
        const pathParts = pathWithVersion.split('/');
        pathParts.shift(); // Remove version (v1234567)
        
        const publicIdWithExtension = pathParts.join('/'); // whatsapp-campaign/users/user-123-456.jpg
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        
        console.log(`Deleted from Cloudinary: ${publicId}`);
    } catch (error: any) {
        console.error('Cloudinary delete error:', error);
        // Don't throw error, just log it (deletion failure shouldn't break the request)
    }
};


// FUTURE: Video upload (commented out for now)
/*
export const uploadVideoToCloudinary = async (
    localFilePath: string,
    folder: string,
    publicId?: string
): Promise<string> => {
    return uploadToCloudinary(localFilePath, folder, publicId, 'video');
};
*/

// FUTURE: PDF upload (commented out for now)
/*
export const uploadPdfToCloudinary = async (
    localFilePath: string,
    folder: string,
    publicId?: string
): Promise<string> => {
    return uploadToCloudinary(localFilePath, folder, publicId, 'raw');
};
*/

export default cloudinary;