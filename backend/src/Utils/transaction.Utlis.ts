import mongoose, { ClientSession } from "mongoose";
import User, { IUser } from "../Models/user.Model.js";
import Transaction, { ITransaction } from "../Models/transaction.Model.js";
import { UserRole } from "../Models/user.Model.js";


interface CreditBalanceResult {
  sender: IUser;
  receiver: IUser;
  transaction: ITransaction;
}

export const creditBalanceService = async (
  senderId: string,
  receiverId: string,
  amount: number
): Promise<CreditBalanceResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find sender and receiver
    const sender = await User.findById(senderId).session(session);
    const receiver = await User.findById(receiverId).session(session);

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    // Check if sender has authority (admin or reseller)
    if (sender.role !== UserRole.ADMIN && sender.role !== UserRole.RESELLER) {
      throw new Error("Only admin or reseller can credit balance");
    }

    // Check if reseller has enough balance
    if (sender.role === UserRole.RESELLER) {
      if (sender.balance < amount) {
        throw new Error("Insufficient balance");
      }
      // Deduct from reseller
      sender.balance -= amount;
    }
    // Admin has unlimited balance, no deduction needed

    // Store receiver's balance before transaction
    const receiverBalanceBefore = receiver.balance;

    // Credit to receiver
    receiver.balance += amount;
    const receiverBalanceAfter = receiver.balance;

    // Create transaction record
    const transactionDoc = await Transaction.create([{
      senderId: sender._id,
      receiverId: receiver._id,
      type: "credit",
      amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      status: "success"
    }], { session });

    const transaction = transactionDoc[0];

    // Push transaction ID to both sender's and receiver's allTransaction arrays
    sender.allTransaction.push(transaction._id as mongoose.Types.ObjectId);
    receiver.allTransaction.push(transaction._id as mongoose.Types.ObjectId);

    // Save both users
    await sender.save({ session });
    await receiver.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      sender,
      receiver,
      transaction
    };
  } catch (error) {
    await session.abortTransaction();
    
    // Log failed transaction (outside session)
    try {
      await Transaction.create({
        senderId: senderId,
        receiverId: receiverId,
        type: "credit",
        amount,
        balanceBefore: 0,
        balanceAfter: 0,
        status: "failed"
      });
    } catch (logError) {
      // If logging fails, just continue with throwing the original error
      console.error("Failed to log transaction:", logError);
    }
    
    throw error;
  } finally {
    await session.endSession();
  }
};
