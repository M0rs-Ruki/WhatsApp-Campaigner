
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const connectDB = async (): Promise<void> => {
    // 1. Get and validate environment variables
    const mongoURI = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;

    if (!mongoURI || !dbName) {
        console.error("🔴 Missing required environment variables: MONGO_URI or DB_NAME");
        process.exit(1);
    }

    try {
        const connectionString = `${mongoURI}/${dbName}`;
        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`🟢 MongoDB Connected! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        // 2. Safely handle the error type
        if (error instanceof Error) {
            console.error(`🔴 MongoDB connection Error: ${error.message}`);
        } else {
            console.error("🔴 An unknown error occurred during DB connection:", error);
        }
        process.exit(1);
    }
};

export default connectDB;