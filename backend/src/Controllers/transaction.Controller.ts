import { Request, Response, NextFunction } from "express";
import {
  creditBalanceService,
  debitBalanceService,
  getTransactionHistoryService
} from "../Utils/transaction.Utlis.js";

export const creditBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount) {
      res.status(400).json({
        success: false,
        message: "userId and amount are required"
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
      return;
    }

    const result = await creditBalanceService(
      userId,
      parseFloat(amount),
      description
    );

    res.status(200).json({
      success: true,
      message: "Balance credited successfully",
      data: {
        balance: result.user.balance,
        transaction: result.transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

export const debitBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount) {
      res.status(400).json({
        success: false,
        message: "userId and amount are required"
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
      return;
    }

    const result = await debitBalanceService(
      userId,
      parseFloat(amount),
      description
    );

    res.status(200).json({
      success: true,
      message: "Balance debited successfully",
      data: {
        balance: result.user.balance,
        transaction: result.transaction
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      if (error.message === "Insufficient balance") {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
    }
    next(error);
  }
};

export const getTransactionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await getTransactionHistoryService(userId, limit);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};
