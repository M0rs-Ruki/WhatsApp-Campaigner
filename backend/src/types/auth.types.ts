import { UserRole } from '../Models/user.Model.js';

// Separate interface for authenticated user context
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// JWT payload interface
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}
