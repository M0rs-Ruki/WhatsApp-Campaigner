import 'express';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
