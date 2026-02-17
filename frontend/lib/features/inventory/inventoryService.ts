import api from '../api/api';
import type { InventoryItem, InventoryResponse } from './types';

export * from './types';

export const getInventory = async (category?: string, search?: string): Promise<InventoryResponse> => {
  try {
    const params: any = {};
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;

    const response = await api.get<InventoryResponse>('/api/admin/inventory', { params });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getInventoryItem = async (itemId: string): Promise<{ success: boolean; item: InventoryItem }> => {
  try {
    const response = await api.get(`/api/admin/inventory/${itemId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const addInventoryItem = async (itemData: Partial<InventoryItem>): Promise<{ success: boolean; item: InventoryItem }> => {
  try {
    console.log('[addInventoryItem] Sending data:', itemData);
    const response = await api.post('/api/admin/inventory', itemData);
    console.log('[addInventoryItem] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[addInventoryItem] Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createInventoryItem = addInventoryItem;

export const updateInventoryItem = async (itemId: string, itemData: Partial<InventoryItem>): Promise<{ success: boolean; item: InventoryItem }> => {
  try {
    console.log('[updateInventoryItem] Updating item:', itemId, 'with data:', itemData);
    const response = await api.patch(`/api/admin/inventory/${itemId}`, itemData);
    console.log('[updateInventoryItem] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[updateInventoryItem] Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteInventoryItem = async (itemId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[deleteInventoryItem] Deleting item:', itemId);
    const response = await api.delete(`/api/admin/inventory/${itemId}`);
    console.log('[deleteInventoryItem] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[deleteInventoryItem] Error:', error.response?.data || error.message);
    throw error;
  }
};
