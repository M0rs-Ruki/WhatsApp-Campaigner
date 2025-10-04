import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../Models/user.Model.js';
import Reseller from '../Models/reseller.Model.js';
import Admin from '../Models/admin.Model.js';

// Register a new user
export const register = async (req: Request, res: Response) => {
    try {
        const { companyName, email, password, image, number, userType } = req.body;

        // Validate required fields
        if (!companyName || !email || !password || !image || !number || !userType) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email }) ||
                            await Reseller.findOne({ email }) ||
                            await Admin.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Create user based on type
        let newUser: any;
        switch (userType.toLowerCase()) {
            case 'user':
                newUser = await User.create({ companyName, email, password, image, number });
                break;
            case 'reseller':
                newUser = await Reseller.create({ companyName, email, password, image, number });
                break;
            case 'admin':
                newUser = await Admin.create({ companyName, email, password, image, number });
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid user type. Must be 'user', 'reseller', or 'admin'"
                });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id.toString(), email: newUser.email },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                companyName: newUser.companyName,
                email: newUser.email,
                image: newUser.image,
                number: newUser.number,
                userType
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user in any collection
        let user: any = await User.findOne({ email }).select('+password');
        let userType = 'user';

        if (!user) {
            user = await Reseller.findOne({ email }).select('+password');
            userType = 'reseller';
        }

        if (!user) {
            user = await Admin.findOne({ email }).select('+password');
            userType = 'admin';
        }

        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                companyName: user.companyName,
                email: user.email,
                image: user.image,
                number: user.number,
                userType
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
