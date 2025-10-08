import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
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
  description: String,
  transactionDate: { type: Date, default: Date.now, index: true }
});

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
