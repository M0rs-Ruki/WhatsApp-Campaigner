import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Delete all files in public/uploads directory
 * Keeps the directory itself, only removes files inside it
 */
export const cleanupUploadsFolder = (): void => {
    const uploadsPath = path.join(__dirname, '..', '..', 'public', 'uploads');

    try {
        // Check if directory exists
        if (!fs.existsSync(uploadsPath)) {
            console.log('✅ Uploads folder does not exist. Nothing to clean.');
            return;
        }

        // Read all files in directory
        const files = fs.readdirSync(uploadsPath);

        if (files.length === 0) {
            console.log('✅ Uploads folder is already empty. No cleanup needed.');
            return;
        }

        let deletedCount = 0;
        let errorCount = 0;

        // Delete each file
        files.forEach((file) => {
            const filePath = path.join(uploadsPath, file);
            
            try {
                // Only delete files, not directories
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`🗑️  Deleted: ${file}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to delete ${file}:`, error);
            }
        });

        console.log(`\n✅ Cleanup completed!`);
        console.log(`   📊 Files deleted: ${deletedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📁 Folder: ${uploadsPath}\n`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
};

export default cleanupUploadsFolder;
