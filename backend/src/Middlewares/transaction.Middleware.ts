import mongoose, { ClientSession } from "mongoose";
import User, { IUser } from "../Models/user.Model.js";
import Transaction, { ITransaction } from "../Models/transaction.Model.js";

interface TransactionResult {
  user: IUser;
  transaction: ITransaction;
}

const creditBalance = async (
  id: string, 
  amount: number, 
  description?: string
): Promise<TransactionResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(id).session(session);
    
    if (!user) {
      throw new Error("User not found");
    }

    user.balance += amount;
    const newBalance = user.balance;
    await user.save({ session });

    const transaction = await Transaction.create([{
      userId: user._id,
      type: "credit",
      amount,
      balanceAfter: newBalance,
      description: description || "Credit transaction"
    }], { session });

    await session.commitTransaction();
    
    return {
      user,
      transaction: transaction[0]
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in creditBalance:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

const debitBalance = async (
  id: string, 
  amount: number, 
  description?: string
): Promise<TransactionResult> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(id).session(session);
    
    if (!user) {
      throw new Error("User not found");
    }

    if (user.balance < amount) {
      throw new Error("Insufficient balance");
    }

    user.balance -= amount;
    const newBalance = user.balance;
    await user.save({ session });

    const transaction = await Transaction.create([{
      userId: user._id,
      type: "debit",
      amount,
      balanceAfter: newBalance,
      description: description || "Debit transaction"
    }], { session });

    await session.commitTransaction();
    
    return {
      user,
      transaction: transaction[0]
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in debitBalance:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

const getTransactionHistory = async (
  userId: string, 
  limit: number = 50
): Promise<ITransaction[]> => {
  try {
    return await Transaction.find({ userId })
      .sort({ transactionDate: -1 })
      .limit(limit);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
};

export { creditBalance, debitBalance, getTransactionHistory };
