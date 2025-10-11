import mongoose, { ClientSession } from "mongoose";
import User, { IUser, UserRole } from "../Models/user.Model.js";
import Transaction, { ITransaction } from "../Models/transaction.Model.js";

interface CreditBalanceResult {
  sender: IUser;
  receiver: IUser;
  transaction: ITransaction;
}

interface DebitForCampaignResult {
  user: IUser;
  transaction: ITransaction;
  actualNumbersProcessed: number;
}

// Credit Balance Service (existing)
export const creditBalanceService = async (
  senderId: string,
  receiverId: string,
  amount: number
): Promise<CreditBalanceResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await User.findById(senderId).session(session);
    const receiver = await User.findById(receiverId).session(session);

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    if (sender.role !== UserRole.ADMIN && sender.role !== UserRole.RESELLER) {
      throw new Error("Only admin or reseller can credit balance");
    }

    if (sender.role === UserRole.RESELLER) {
      if (sender.balance < amount) {
        throw new Error("Insufficient balance");
      }
      sender.balance -= amount;
    }

    const receiverBalanceBefore = receiver.balance;
    receiver.balance += amount;
    const receiverBalanceAfter = receiver.balance;

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

    sender.allTransaction.push(transaction._id as mongoose.Types.ObjectId);
    receiver.allTransaction.push(transaction._id as mongoose.Types.ObjectId);

    await sender.save({ session });
    await receiver.save({ session });

    await session.commitTransaction();

    return {
      sender,
      receiver,
      transaction
    };
  } catch (error) {
    await session.abortTransaction();
    
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
      console.error("Failed to log transaction:", logError);
    }
    
    throw error;
  } finally {
    await session.endSession();
  }
};

// NEW: Debit Balance for Campaign
export const debitForCampaignService = async (
  userId: string,
  campaignId: string,
  requestedAmount: number
): Promise<DebitForCampaignResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const balanceBefore = user.balance;

    // Calculate actual amount to debit (limited by user's balance)
    const actualAmount = Math.min(requestedAmount, user.balance);

    if (actualAmount === 0) {
      throw new Error("Insufficient balance");
    }

    // Debit from user
    user.balance -= actualAmount;
    const balanceAfter = user.balance;

    // Create transaction record
    const transactionDoc = await Transaction.create([{
      receiverId: user._id,
      senderId: undefined, // No sender for campaign debit
      campaignId: campaignId,
      type: "debit",
      amount: actualAmount,
      balanceBefore,
      balanceAfter,
      status: "success"
    }], { session });

    const transaction = transactionDoc[0];

    // Push transaction to user's allTransaction array
    user.allTransaction.push(transaction._id as mongoose.Types.ObjectId);

    await user.save({ session });

    await session.commitTransaction();

    return {
      user,
      transaction,
      actualNumbersProcessed: actualAmount // 1 point = 1 number
    };
  } catch (error) {
    await session.abortTransaction();
    
    // Log failed transaction
    try {
      await Transaction.create({
        receiverId: userId,
        campaignId: campaignId,
        type: "debit",
        amount: requestedAmount,
        balanceBefore: 0,
        balanceAfter: 0,
        status: "failed"
      });
    } catch (logError) {
      console.error("Failed to log transaction:", logError);
    }
    
    throw error;
  } finally {
    await session.endSession();
  }
};
