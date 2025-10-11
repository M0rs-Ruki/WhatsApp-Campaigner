import { Request, Response } from 'express';
import User, { UserRole, UserStatus } from '../Models/user.Model.js';
import { IUser } from '../Models/user.Model.js';
import { hashPassword } from '../Utils/hashPassword.Utils.js';

// Create User
const createUser = async (req: Request, res: Response) => {
    try {
        const { companyName, email, password, number, role, balance} = req.body;
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        const image = req.file?.path || '';
        const creatorId = req.user!._id;


        if (!companyName || !email || !password || !number || !role || !balance || !image) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.',
            });
        }

        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        const numberExists = await User.findOne({ number });
        if (numberExists) {
            return res.status(409).json({
                success: false,
                message: 'An account with this number already exists.',
            });
        }

        const creator = await User.findById(creatorId);
        if (!creator || creator.role !== UserRole.ADMIN && creator.role !== UserRole.RESELLER) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and Reseller can create users.',
            });
        }

        const hashedPassword = await hashPassword(password);


        const newUser = await User.create({
            companyName,
            email,
            password: hashedPassword,
            number,
            image,
            balance,
            userID: creatorId,
            role: role || UserRole.USER,
            status: UserStatus.ACTIVE,
        });

        return res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data: {
                companyName: newUser.companyName,
                email: newUser.email,
                number: newUser.number,
                role: newUser.role,
                status: newUser.status,
                balance: newUser.balance,
                image: newUser.image,
            }
        });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error During user creation.',
            error: error.message,
        });
    }
};


// DELETE USER (Soft Delete)
const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        const adminId = req.user!._id;

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== UserRole.ADMIN && admin.role !== UserRole.RESELLER) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and Resellers can delete users.',
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        user.status = UserStatus.DELETED;
        user.deletedAt = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully.',
        });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error During user deletion.',
            error: error.message,
        });
    }
};


// FREEZE/DEACTIVATE USER
const freezeUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        const adminId = req.user!._id;

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== UserRole.ADMIN && admin.role !== UserRole.RESELLER) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and Resellers can freeze/deactivate users.',
            });
        };

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (user.status !== UserStatus.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: 'User is already inactive.',
            });
        };

        user.status = UserStatus.INACTIVE;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'User frozen successfully. They cannot perform any actions.',
        });


    } catch (error: any) {
        console.error('Error freezing user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error During user freezing',
            error: error.message,
        });
    }
};


// UNFREEZE/ACTIVATE USER
const unfreezeUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        const adminId = req.user!._id;

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== UserRole.ADMIN && admin.role !== UserRole.RESELLER) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and Resellers can unfreeze/activate users.',
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        user.status = UserStatus.ACTIVE;
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'User unfrozen successfully.',
        });

    } catch (error: any) {
        console.error('Error unfreezing user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error During user unfreezing.',
            error: error.message,
        });
    }
};

// declare global {
//     namespace Express {
//       interface Request {
//         user?: IUser;
//       }
//     }
//   }
  
// UPDATE USER
const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const authenticatedUser = req.user as IUser;

        if (!authenticatedUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }


        const isOwner = authenticatedUser._id.toString() === userId;
        const isAdminOrReseller = authenticatedUser.role === UserRole.ADMIN || authenticatedUser.role === UserRole.RESELLER;

        if (!isOwner && !isAdminOrReseller) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this user.',
            });
        }

        const updateFields: { [key: string]: any } = {};
        if (req.body.companyName) updateFields.companyName = req.body.companyName;
        if (req.body.email) updateFields.email = req.body.email;
        if (req.body.number) updateFields.number = req.body.number;

        // If no fields to update were provided, return an error.
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No update information provided.',
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: `User not found.${userId}`,
            });
        }


        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: updatedUser._id,
                companyName: updatedUser.companyName,
                email: updatedUser.email,
                number: updatedUser.number,
                role: updatedUser.role,
            },
        });

    } catch (error: any) { // Use 'any' to check for error properties like 'code'
        // Handle specific DB errors like a duplicate email
        if (error.code === 11000) {
            return res.status(409).json({ // 409 Conflict
                success: false,
                message: 'This email is already in use.',
            });
        }
        
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: errorMessage,
        });
    }
};


export { createUser, deleteUser, freezeUser, unfreezeUser, updateUser };