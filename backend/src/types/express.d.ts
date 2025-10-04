import type { IUser } from '../Models/user.Model.js';
import type { IReseller } from '../Models/reseller.Model.js';
import type { IAdmin } from '../Models/admin.Model.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser | IReseller | IAdmin;
    }
  }
}

export {};
