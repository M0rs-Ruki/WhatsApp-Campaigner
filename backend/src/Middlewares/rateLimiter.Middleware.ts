import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit
  message: {
    error: "Too many requests from this IP address",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests from this IP address",
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});
