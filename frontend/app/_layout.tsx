import { Stack } from "expo-router";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { CartProvider } from "../contexts/CartContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <FavoritesProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </FavoritesProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
