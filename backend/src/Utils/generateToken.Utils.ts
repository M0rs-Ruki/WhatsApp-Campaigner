import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: "./.env"});

interface UserPayload {
    _id: any;
    email: string;
    role: string;
}

const generateToken = (user: UserPayload): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("🔴 FATAL ERROR: JWT_SECRET is not defined in environment variables.");
        process.exit(1);
    }

    const tokenPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };

    const token = jwt.sign(
        tokenPayload,
        secret,
        { expiresIn: "30d" }
    );

    return token;
}

export default generateToken;