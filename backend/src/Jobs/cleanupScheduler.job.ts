import cron from 'node-cron';
import { cleanupUploadsFolder } from '../Utils/cleanup.Utils.js';

/**
 * Schedule cleanup job to run daily at 3:00 AM IST
 * Cron expression: '0 3 * * *' means "At 3:00 AM every day"
 */
export const startCleanupScheduler = (): void => {
    // ✅ FIXED: Remove 'scheduled' property, just use timezone
    const task = cron.schedule('0 3 * * *', () => {
        const now = new Date();
        console.log('\n🧹 ========================================');
        console.log(`🧹 SCHEDULED CLEANUP STARTED`);
        console.log(`🕒 Time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log('🧹 ========================================\n');

        cleanupUploadsFolder();

        console.log('🧹 ========================================');
        console.log('🧹 SCHEDULED CLEANUP FINISHED');
        console.log('🧹 ========================================\n');
    }, {
        timezone: 'Asia/Kolkata' // ✅ Only timezone option
    });

    // ✅ Start the task manually
    task.start();

    console.log('✅ Cleanup scheduler started! Will run daily at 3:00 AM IST');
    console.log('📁 Target folder: public/uploads');
};

export default startCleanupScheduler;
