// types/express-rate-limit.d.ts
import 'express';

declare module 'express' {
  export interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime?: Date;
    };
  }
}
