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

// Debit Balance 
// Add this interface at the top with other interfaces
interface DebitBalanceResult {
  sender: IUser;
  receiver: IUser;
  transaction: ITransaction;
}

// NEW: Debit Balance Service
export const debitBalanceService = async (
  senderId: string,
  receiverId: string,
  amount: number
): Promise<DebitBalanceResult> => {
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

    // Check if sender has authority (admin or reseller)
    if (sender.role !== UserRole.ADMIN && sender.role !== UserRole.RESELLER) {
      throw new Error("Only admin or reseller can debit balance");
    }

    // Check if receiver has enough balance
    if (receiver.balance < amount) {
      throw new Error("Insufficient balance in user account");
    }

    // Store balances before transaction
    const receiverBalanceBefore = receiver.balance;
    const senderBalanceBefore = sender.balance;

    // Debit from receiver (user loses money)
    receiver.balance -= amount;
    const receiverBalanceAfter = receiver.balance;

    // Credit to sender (admin/reseller gains money) - BOTH admin and reseller gain!
    sender.balance += amount;
    const senderBalanceAfter = sender.balance;

    // Create TWO transactions: 
    // 1. CREDIT transaction for sender (they gained money)
    const creditTransactionDoc = await Transaction.create([{
      senderId: receiver._id,  // Money came from receiver
      receiverId: sender._id,  // Sender received money
      type: "credit",
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      status: "success"
    }], { session });

    // 2. DEBIT transaction for receiver (they lost money)
    const debitTransactionDoc = await Transaction.create([{
      senderId: sender._id,    // Initiated by sender (admin/reseller)
      receiverId: receiver._id, // Receiver lost money
      type: "debit",
      amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      status: "success"
    }], { session });

    const creditTransaction = creditTransactionDoc[0];
    const debitTransaction = debitTransactionDoc[0];

    // Push CREDIT transaction to sender's history
    sender.allTransaction.push(creditTransaction._id as mongoose.Types.ObjectId);
    
    // Push DEBIT transaction to receiver's history
    receiver.allTransaction.push(debitTransaction._id as mongoose.Types.ObjectId);

    // Save both users
    await sender.save({ session });
    await receiver.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      sender,
      receiver,
      transaction: debitTransaction // Return debit transaction for response
    };
  } catch (error) {
    await session.abortTransaction();
    
    // Log failed transaction (outside session)
    try {
      await Transaction.create({
        senderId: senderId,
        receiverId: receiverId,
        type: "debit",
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


