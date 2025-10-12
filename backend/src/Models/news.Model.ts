
import { Document, Schema, model } from 'mongoose';

export interface INews extends Document {
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    }
  },
  { timestamps: true }
);

export default model<INews>('News', newsSchema);
