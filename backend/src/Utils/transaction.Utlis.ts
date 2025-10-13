import mongoose, { ClientSession } from "mongoose";
import User, { IUser, UserRole } from "../Models/user.Model.js";
import Transaction, { ITransaction } from "../Models/transaction.Model.js";

interface CreditBalanceResult {
  sender: IUser;
  receiver: IUser;
  debitTransaction: ITransaction;
  creditTransaction: ITransaction;
}

interface DebitBalanceResult {
  sender: IUser;
  receiver: IUser;
  creditTransaction: ITransaction;
  debitTransaction: ITransaction;
}

// CREDIT BALANCE SERVICE - Admin/Reseller GIVES money to someone
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

    // Store balances BEFORE transaction
    const senderBalanceBefore = sender.balance;
    const receiverBalanceBefore = receiver.balance;

    // If sender is RESELLER, deduct balance and check sufficient funds
    if (sender.role === UserRole.RESELLER) {
      if (sender.balance < amount) {
        throw new Error("Insufficient balance");
      }
      sender.balance -= amount;
    }
    // If sender is ADMIN, balance stays the same (unlimited)

    const senderBalanceAfter = sender.balance;

    // Receiver always gains money
    receiver.balance += amount;
    const receiverBalanceAfter = receiver.balance;

    // Create DEBIT transaction for SENDER (they gave money away)
    const debitTransactionDoc = await Transaction.create([{
      senderId: sender._id,
      receiverId: receiver._id,
      type: "debit",
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      status: "success"
    }], { session });

    // Create CREDIT transaction for RECEIVER (they received money)
    const creditTransactionDoc = await Transaction.create([{
      senderId: sender._id,
      receiverId: receiver._id,
      type: "credit",
      amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      status: "success"
    }], { session });

    const debitTransaction = debitTransactionDoc[0];
    const creditTransaction = creditTransactionDoc[0];

    // Add DEBIT transaction to SENDER's history
    sender.allTransaction.push(debitTransaction._id as mongoose.Types.ObjectId);
    
    // Add CREDIT transaction to RECEIVER's history
    receiver.allTransaction.push(creditTransaction._id as mongoose.Types.ObjectId);

    // Save both users
    await sender.save({ session });
    await receiver.save({ session });

    await session.commitTransaction();

    return { 
      sender, 
      receiver, 
      debitTransaction,
      creditTransaction 
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// DEBIT BALANCE SERVICE - Admin/Reseller TAKES money from someone
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

    // Check if sender has authority
    if (sender.role !== UserRole.ADMIN && sender.role !== UserRole.RESELLER) {
      throw new Error("Only admin or reseller can debit balance");
    }

    // Check if receiver has enough balance
    if (receiver.balance < amount) {
      throw new Error("Insufficient balance in receiver account");
    }

    // Store balances BEFORE transaction
    const senderBalanceBefore = sender.balance;
    const receiverBalanceBefore = receiver.balance;

    // Receiver loses money
    receiver.balance -= amount;
    const receiverBalanceAfter = receiver.balance;

    // If sender is RESELLER, they gain money
    if (sender.role === UserRole.RESELLER) {
      sender.balance += amount;
    }
    // If sender is ADMIN, balance stays the same (unlimited)

    const senderBalanceAfter = sender.balance;

    // Create CREDIT transaction for SENDER (they gained money)
    const creditTransactionDoc = await Transaction.create([{
      senderId: receiver._id,
      receiverId: sender._id,
      type: "credit",
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      status: "success"
    }], { session });

    // Create DEBIT transaction for RECEIVER (they lost money)
    const debitTransactionDoc = await Transaction.create([{
      senderId: sender._id,
      receiverId: receiver._id,
      type: "debit",
      amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      status: "success"
    }], { session });

    const creditTransaction = creditTransactionDoc[0];
    const debitTransaction = debitTransactionDoc[0];

    // Add CREDIT transaction to SENDER's history
    sender.allTransaction.push(creditTransaction._id as mongoose.Types.ObjectId);
    
    // Add DEBIT transaction to RECEIVER's history
    receiver.allTransaction.push(debitTransaction._id as mongoose.Types.ObjectId);

    // Save both users
    await sender.save({ session });
    await receiver.save({ session });

    await session.commitTransaction();

    return {
      sender,
      receiver,
      creditTransaction,
      debitTransaction
    };
  } catch (error) {
    await session.abortTransaction();
    
    // Log failed transaction
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
