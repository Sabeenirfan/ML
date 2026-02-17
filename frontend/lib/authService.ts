/**
 * Auth and Inventory services - re-exports from feature modules for backward compatibility.
 * New code may import from lib/features/auth/authService or lib/features/inventory/inventoryService.
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
