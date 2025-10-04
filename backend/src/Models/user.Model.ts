import mongoose, { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
  companyName: string;
  email: string;
  image: string;
  number: number;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
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
  },
}, {
  timestamps: true 
});

const User = model<IUser>('User', userSchema);

export default User;

