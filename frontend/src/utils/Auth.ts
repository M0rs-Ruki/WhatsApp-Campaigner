import { UserRole } from '../constants/Roles';

interface StoredUser {
  email: string;
  role: string;
}

export const getUserRole = (): UserRole | null => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return null;
  }

  try {
    const user: StoredUser = JSON.parse(userStr);
    return user.role as UserRole;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const isTokenValid = (): boolean => {
  const userStr = localStorage.getItem('user');
  return userStr !== null;
};
