import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

export const loginLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100,
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
