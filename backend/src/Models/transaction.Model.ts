import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  balanceBefore: number;
  status: "success" | "failed";
  failureReason?: string;
  description?: string;
  transactionDate: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    enum: ["credit", "debit"], 
    required: true 
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  status: {
    type: String,
    enum: ["success", "failed"],
    required: true,
    default: "success"
  },
  failureReason: { type: String },
  description: { type: String },
  transactionDate: { type: Date, default: Date.now, index: true }
});

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
