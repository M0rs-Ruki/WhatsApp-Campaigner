import { Request, Response } from 'express';
import User from '../Models/user.Model.js';

const createUser = async (req: Request, res: Response) => {
    try {
        const { companyName, email, password, number } = req.body;
        const image = req.file?.path || '';
        const creatorID = req.user._id;
        if (!companyName || !email || !password || !image || !number) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.',
            });
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        };

        if ()
        

    } catch (error) {
        
    }
}