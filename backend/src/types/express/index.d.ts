import { IUser } from '../../Models/user.Model.js';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      user?: IUser; 
    }
  }
}

export {};
