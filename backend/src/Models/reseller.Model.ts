import mongoose, { Schema, Document, model } from 'mongoose';

export interface IReseller extends Document {
  companyName: string;
  email: string;
  image: string;
  number: number;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const resellerSchema = new Schema<IReseller>({
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
    required: [true, 'image URL is required'],
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

const Reseller = model<IReseller>('Reseller', resellerSchema);

export default Reseller;

