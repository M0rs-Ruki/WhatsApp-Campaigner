import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Delete all files in public/uploads directory
 * Keeps the directory itself, only removes files inside it
 * Then creates an empty `.gitkeep` file inside it
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
        } else {
            let deletedCount = 0;
            let errorCount = 0;

            // Delete each file
            files.forEach((file) => {
                const filePath = path.join(uploadsPath, file);

                try {
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
        }

        // Create .gitkeep file after cleanup
        const gitkeepFilePath = path.join(uploadsPath, '.gitkeep');

        if (!fs.existsSync(gitkeepFilePath)) {
            fs.writeFileSync(gitkeepFilePath, '');
            console.log(`📄 Created empty file: ${gitkeepFilePath}`);
        } else {
            console.log(`ℹ️  .gitkeep file already exists.`);
        }

        console.log(`\n✅ Final structure ready at: ${uploadsPath}\n`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
};

export default cleanupUploadsFolder;
