import type { Request, Response } from 'express';
import User from '../Models/user.Model.js';
import type { IUser } from '../Models/user.Model.js';
import generateToken from '../Utils/generateToken.Utils.js';
import { hashPassword, comparePassword } from '../Utils/hashPassword.Utils.js';

/**
 * Define expected request body types
 */
interface RegistrationBody {
    companyName: string;
    email: string;
    password: string;
    image: string;
    number: string;
    role: string;
    balance: number;
}

interface LoginBody {
    email: string;
    password: string;
}

/**
 * Handles new user registration.
 */
export const Registration = async (
    req: Request<unknown, unknown, RegistrationBody>,
    res: Response
): Promise<Response> => {
    try {
        const { companyName, email, password, number, role, balance } = req.body;

        // Get uploaded file from multer
        const image = req.file?.path || '';

        // Basic validation
        if (!companyName || !email || !password || !image || !number || !role || !balance) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        // Hash Password
        const hashedPassword = await hashPassword(password);

        // Create a new User document with file path
        const newUser: IUser = new User({
            companyName,
            email,
            password: hashedPassword,
            number,
            image,
            balance,
            role,
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser);

        // Cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        };

        res.cookie('token', token, cookieOptions);

        // Prepare safe user object
        const userForResponse = {
            _id: newUser._id,
            companyName: newUser.companyName,
            email: newUser.email,
            image: newUser.image,
            role: newUser.role,
            balance: newUser.balance,
            number: newUser.number,
        };

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            user: userForResponse,
        });
    } catch (error: unknown) {
        console.error('Error in Registration controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred.',
        });
    }
};

/**
 * Handles user login.
 */
export const Login = async (
    req: Request<unknown, unknown, LoginBody>,
    res: Response
): Promise<Response> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        const isPasswordCorrect = await comparePassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        const token = generateToken(user);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        };

        res.cookie('token', token, cookieOptions);

        const userForResponse = {
            _id: user._id,
            companyName: user.companyName,
            email: user.email,
            image: user.image,
            role: user.role,
        };

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully.',
            user: userForResponse,
        });
    } catch (error: unknown) {
        console.error('Error in Login controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred.',
        });
    }
};

/**
 * Handles user logout.
 */
export const Logout = (req: Request, res: Response): Response => {
    try {
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    } catch (error: unknown) {
        console.error('Error in Logout controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred.',
        });
    }
};
