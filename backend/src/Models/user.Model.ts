import mongoose, { Schema, Document, model } from 'mongoose';

export enum UserRole {
  USER = 'user',
  RESELLER = 'reseller',
  ADMIN = 'admin',
}

export interface IUser extends Document {
  companyName: string;
  uID: string;
  email: string;
  image: string;
  number: number;
  password: string;
  role: UserRole;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  uID: {
    type: String,
    unique: true,
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
  },
  image: {
    type: String,
    required: [true, 'User image URL is required'],
  },
  number: {
    type: Number,
    required: [true, 'Phone number is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  balance: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  },
}, {
  timestamps: true 
});

const User = model<IUser>('User', userSchema);

export default User;

