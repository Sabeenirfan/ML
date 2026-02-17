/**
 * Barrel exports for lib features.
 * Import from 'lib' or 'lib/features/<feature>/<module>' for clean imports.
 */
export {
  signup,
  login,
  loginWithGoogle,
  getProfile,
  updateProfile,
  logout,
  getAllUsers,
  deleteUser,
  type AuthUser,
  type User,
  type AuthResponse,
  type ProfileResponse,
  type UsersResponse,
} from './features/auth/authService';

export {
  getInventory,
  getInventoryItem,
  addInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
  type InventoryResponse,
} from './features/inventory/inventoryService';
