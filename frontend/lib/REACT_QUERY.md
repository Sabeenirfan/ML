# React Query Implementation Guide

## Overview
React Query has been implemented to provide automatic request caching, background refetching, and stale-while-revalidate behavior, eliminating unnecessary API calls on component remounts.

## What Was Installed

```bash
npm install @tanstack/react-query
```

## Files Created/Modified

### Created Files

1. **`lib/queryClient.ts`** - Query client configuration with:
   - 5-minute stale time
   - 10-minute garbage collection time
   - Automatic retry with exponential backoff
   - Centralized query keys for consistency

2. **`hooks/useRecipes.ts`** - Custom React Query hooks:
   - `useRecipesByCategory(category)` - Fetch recipes by category with caching
   - `useRecipeSearch(query, enabled)` - Search recipes with caching

### Modified Files

1. **`app/_layout.tsx`** - Added `QueryClientProvider` wrapper
2. **`app/home.tsx`** - Replaced manual fetching with `useRecipesByCategory` hook

## Configuration

### Query Client Settings

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000,         // 10 minutes - cache retention
    retry: 2,                        // Retry failed requests 2 times
    refetchOnWindowFocus: false,     // Don't refetch on window focus
    refetchOnReconnect: true,        // Refetch on network reconnect
    refetchOnMount: true,            // Refetch if data is stale
  }
}
```

## Query Keys

Centralized query keys for consistent cache management:

```typescript
queryKeys.recipes                              // All recipes
queryKeys.recipesByCategory('pakistani')       // Recipes by category
queryKeys.recipeById('recipe-123')             // Single recipe
queryKeys.recipeSearch('chicken')              // Search results
queryKeys.userProfile                          // User profile
queryKeys.cart                                 // Shopping cart
```

## Usage Examples

### Basic Usage - Recipes by Category

```tsx
import { useRecipesByCategory } from '../hooks/useRecipes';

function RecipeList() {
  const { data: recipes = [], isLoading, error } = useRecipesByCategory('Pakistani');

  if (isLoading) return <SkeletonList count={6} type="grid" />;
  if (error) return <Text>Error loading recipes</Text>;

  return (
    <View>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </View>
  );
}
```

### Search with Conditional Fetching

```tsx
import { useRecipeSearch } from '../hooks/useRecipes';

function SearchScreen() {
  const [query, setQuery] = useState('');
  
  const { data: results = [], isLoading } = useRecipeSearch(
    query,
    query.length >= 2  // Only fetch when query is 2+ characters
  );

  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      {isLoading ? <Loading /> : <Results recipes={results} />}
    </View>
  );
}
```

### Manual Refetch

```tsx
const { data, refetch } = useRecipesByCategory('Italian');

<Button onPress={() => refetch()}>Refresh</Button>
```

### Manual Cache Invalidation

```tsx
import { queryClient, queryKeys } from '../lib/queryClient';

// Invalidate specific category
queryClient.invalidateQueries({ 
  queryKey: queryKeys.recipesByCategory('Pakistani') 
});

// Invalidate all recipes
queryClient.invalidateQueries({ 
  queryKey: queryKeys.recipes 
});
```

## Benefits

### ✅ No Duplicate Requests
- When navigating back to the home screen, cached data is used
- No unnecessary API calls on component remounts

### ✅ Automatic Background Refetching
- Data automatically refetches when stale (after 5 minutes)
- Reconnection triggers refetch to sync data

### ✅ Smart Caching
- Data persists for 10 minutes even without active subscribers
- Reduces server load and improves performance

### ✅ Better UX
- Instant data display from cache
- Background updates keep data fresh
- Seamless offline-to-online transitions

## Advanced Features

### Pagination

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['recipes', 'infinite'],
  queryFn: ({ pageParam = 1 }) => fetchRecipes(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

### Mutations with Cache Updates

```tsx
import { useMutation } from '@tanstack/react-query';

const addToFavorites = useMutation({
  mutationFn: (recipeId) => api.post('/api/favorites', { recipeId }),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.userFavorites });
  },
});
```

### Optimistic Updates

```tsx
const updateRecipe = useMutation({
  mutationFn: updateRecipeApi,
  onMutate: async (newRecipe) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['recipe', newRecipe.id] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['recipe', newRecipe.id]);

    // Optimistically update
    queryClient.setQueryData(['recipe', newRecipe.id], newRecipe);

    return { previous };
  },
  onError: (err, newRecipe, context) => {
    // Rollback on error
    queryClient.setQueryData(['recipe', newRecipe.id], context.previous);
  },
});
```

## Migration Guide

### Before (Manual Fetching)

```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/recipes');
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [category]);
```

### After (React Query)

```tsx
const { data = [], isLoading } = useRecipesByCategory(category);
```

## Debugging

### React Query DevTools (Optional)

```bash
npm install @tanstack/react-query-devtools
```

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Next Steps

Consider applying React Query to:
- `app/search.tsx` - Use `useRecipeSearch` hook
- `app/favorites.tsx` - Fetch favorites with caching
- `app/profile.tsx` - User profile data
- `app/orderHistory.tsx` - Order history with pagination
