import { Document, Schema, model } from 'mongoose';

export enum ComplaintStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface IComplaint extends Document {
  createdBy: Schema.Types.ObjectId;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminResponse?: string;
  resolvedBy?: Schema.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters long'],
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.PENDING,
      index: true
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin response cannot exceed 2000 characters']
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  },
  { 
    timestamps: true 
  }
);

complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });

complaintSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === ComplaintStatus.RESOLVED || this.status === ComplaintStatus.CLOSED) {
      if (!this.resolvedAt) {
        this.resolvedAt = new Date();
      }
    }
  }
  next();
});

export default model<IComplaint>('Complaint', complaintSchema);
