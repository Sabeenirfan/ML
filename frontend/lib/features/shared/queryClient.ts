import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
        },
        mutations: { retry: 1 },
    },
});

export const queryKeys = {
    recipes: ['recipes'] as const,
    recipesByCategory: (category: string) => ['recipes', 'category', category] as const,
    recipeById: (id: string) => ['recipes', id] as const,
    recipeSearch: (query: string) => ['recipes', 'search', query] as const,
    userProfile: ['user', 'profile'] as const,
    userFavorites: ['user', 'favorites'] as const,
    cart: ['cart'] as const,
    categories: ['categories'] as const,
    orders: ['orders'] as const,
    orderHistory: ['orders', 'history'] as const,
    recommendations: ['recommendations'] as const,
};
