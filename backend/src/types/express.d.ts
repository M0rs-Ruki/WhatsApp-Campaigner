import type { IUser } from '../Models/user.Model.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser ;
    }
  }
}

export {};
