/**
 * Inventory feature types - aligned with backend Inventory model and API responses.
 */

export interface InventoryItem {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  subcategory?: string;
  stock: number;
  unit?: string;
  status?: string;
  image?: string;
  minStock?: number;
  maxStock?: number;
  price?: number;
  supplier?: string;
  lastRestocked?: string;
  origin?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryResponse {
  success: boolean;
  count: number;
  categories: string[];
  items: InventoryItem[];
}
