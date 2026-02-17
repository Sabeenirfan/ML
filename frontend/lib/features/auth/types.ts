export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: string;
  dietaryPreferences?: string[];
  allergens?: string[];
  height?: number;
  weight?: number;
  bmi?: number;
  bmiCategory?: string;
  healthGoal?: 'weight_loss' | 'weight_gain' | 'maintenance';
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface ProfileResponse {
  user: AuthUser;
}

export interface UsersResponse {
  users: User[];
  count?: number;
}
