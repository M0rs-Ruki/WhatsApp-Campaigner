import mongoose, { ClientSession } from "mongoose";
import User, { IUser } from "../Models/user.Model.js";
import Transaction, { ITransaction } from "../Models/transaction.Model.js";

interface TransactionResult {
  user: IUser;
  transaction: ITransaction;
}

export const creditBalanceService = async (
  id: string,
  amount: number,
  description?: string
): Promise<TransactionResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  let balanceBefore = 0;
  let transactionLog: ITransaction | null = null;

  try {
    const user = await User.findById(id).session(session);
    
    if (!user) {
      // Log failed transaction - outside session
      transactionLog = await Transaction.create({
        userId: id,
        type: "credit",
        amount,
        balanceBefore: 0,
        balanceAfter: 0,
        status: "failed",
        failureReason: "User not found",
        description: description || "Credit transaction"
      });
      
      throw new Error("User not found");
    }

    balanceBefore = user.balance;
    user.balance += amount;
    const newBalance = user.balance;
    await user.save({ session });

    // Create successful transaction log - inside session
    const transaction = await Transaction.create([{
      userId: user._id,
      type: "credit",
      amount,
      balanceBefore,
      balanceAfter: newBalance,
      status: "success",
      description: description || "Credit transaction"
    }], { session });

    await session.commitTransaction();
    
    return {
      user,
      transaction: transaction[0]
    };
  } catch (error) {
    await session.abortTransaction();
    
    // If transaction log wasn't created yet, create it now
    if (!transactionLog) {
      transactionLog = await Transaction.create({
        userId: id,
        type: "credit",
        amount,
        balanceBefore,
        balanceAfter: balanceBefore,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
        description: description || "Credit transaction"
      });
    }
    
    throw error;
  } finally {
    await session.endSession();
  }
};

export const debitBalanceService = async (
  id: string,
  amount: number,
  description?: string
): Promise<TransactionResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  let balanceBefore = 0;
  let transactionLog: ITransaction | null = null;

  try {
    const user = await User.findById(id).session(session);
    
    if (!user) {
      // Log failed transaction
      transactionLog = await Transaction.create({
        userId: id,
        type: "debit",
        amount,
        balanceBefore: 0,
        balanceAfter: 0,
        status: "failed",
        failureReason: "User not found",
        description: description || "Debit transaction"
      });
      
      throw new Error("User not found");
    }

    balanceBefore = user.balance;

    if (user.balance < amount) {
      // Log failed transaction
      transactionLog = await Transaction.create({
        userId: user._id,
        type: "debit",
        amount,
        balanceBefore,
        balanceAfter: balanceBefore,
        status: "failed",
        failureReason: "Insufficient balance",
        description: description || "Debit transaction"
      });
      
      throw new Error("Insufficient balance");
    }

    user.balance -= amount;
    const newBalance = user.balance;
    await user.save({ session });

    // Create successful transaction log - inside session
    const transaction = await Transaction.create([{
      userId: user._id,
      type: "debit",
      amount,
      balanceBefore,
      balanceAfter: newBalance,
      status: "success",
      description: description || "Debit transaction"
    }], { session });

    await session.commitTransaction();
    
    return {
      user,
      transaction: transaction[0]
    };
  } catch (error) {
    await session.abortTransaction();
    
    // If transaction log wasn't created yet, create it now
    if (!transactionLog) {
      transactionLog = await Transaction.create({
        userId: id,
        type: "debit",
        amount,
        balanceBefore,
        balanceAfter: balanceBefore,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
        description: description || "Debit transaction"
      });
    }
    
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getTransactionHistoryService = async (
  userId: string,
  limit: number = 50,
  includeFailedTransactions: boolean = true
): Promise<ITransaction[]> => {
  const filter: any = { userId };
  
  if (!includeFailedTransactions) {
    filter.status = "success";
  }
  
  return await Transaction.find(filter)
    .sort({ transactionDate: -1 })
    .limit(limit);
};
