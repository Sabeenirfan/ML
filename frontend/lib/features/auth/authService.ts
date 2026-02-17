import api from '../api/api';
import { storeToken, clearToken } from './authStorage';
import type { AuthResponse, ProfileResponse, UsersResponse } from './types';
import { queryClient, queryKeys } from '../shared/queryClient';

export * from './types';

export const signup = async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/signup', data);
    if (response.data.token) {
      await storeToken(response.data.token);
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    if (response.data.token) {
      await storeToken(response.data.token);
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const loginWithGoogle = async (data: { idToken?: string; accessToken?: string }): Promise<AuthResponse> => {
  try {
    const tokenType = data.idToken ? 'idToken' : 'accessToken';
    console.log('[authService] Calling /api/auth/google with', tokenType);
    const response = await api.post<AuthResponse>('/api/auth/google', data);
    console.log('[authService] Google auth successful, received token');
    if (response.data.token) {
      await storeToken(response.data.token);
    }
    return response.data;
  } catch (error: any) {
    console.error('[authService] Google auth error:', {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      endpoint: error?.config?.url,
      errorMsg: error?.message
    });
    throw error;
  }
};

export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await api.get<ProfileResponse>('/api/auth/me');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateProfile = async (data: {
  name?: string;
  email?: string;
  dietaryPreferences?: string[];
  allergens?: string[];
  height?: number;
  weight?: number;
  bmi?: number;
  bmiCategory?: string;
  healthGoal?: 'weight_loss' | 'weight_gain' | 'maintenance';
}): Promise<ProfileResponse> => {
  try {
    const response = await api.put<ProfileResponse>('/api/auth/me', data);
    // Invalidate recommendations so Home refetches with new preferences
    queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await clearToken();
  } catch (error: any) {
    console.error('Logout error:', error);
    await clearToken();
  }
};

export const getAllUsers = async (): Promise<UsersResponse> => {
  try {
    const response = await api.get<UsersResponse>('/api/admin/users');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/api/admin/users/${userId}`);
  } catch (error: any) {
    throw error;
  }
};
