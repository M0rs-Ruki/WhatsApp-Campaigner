import { Request, Response, NextFunction } from "express";
import { creditBalanceService } from "../Utils/transaction.Utlis.js";

export const creditBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { receiverId, amount } = req.body;
    const senderId = req.user?._id || req.user?.id;

    // Validation
    if (!senderId) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    if (!receiverId || !amount) {
      res.status(400).json({
        success: false,
        message: "receiverId and amount are required"
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

    // Call service
    const result = await creditBalanceService(
      senderId,
      receiverId,
      parseFloat(amount)
    );

    res.status(200).json({
      success: true,
      message: "Balance credited successfully",
      data: {
        senderBalance: result.sender.balance,
        receiverBalance: result.receiver.balance,
        transaction: {
          id: result.transaction._id,
          amount: result.transaction.amount,
          type: result.transaction.type,
          status: result.transaction.status,
          date: result.transaction.transactionDate
        }
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Sender not found" || error.message === "Receiver not found") {
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
      if (error.message === "Only admin or reseller can credit balance") {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }
    }
    next(error);
  }
};

export const debitBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Will implement later
  res.status(501).json({
    success: false,
    message: "Debit functionality not implemented yet"
  });
};
