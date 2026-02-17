import { useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import api, { getAiFeed, getRecommendations, type RecommendationItem } from '@/lib/api';
import { getRecipeImageUrl } from '@/lib/imageOptimizer';

interface Recipe {
  id?: string;
  name?: string;
  title?: string;
  image?: string;
  prepTime?: number;
  cookTime?: number;
  calories?: number;
  difficulty?: string;
  rating?: string | number;
  ingredients?: unknown[];
  instructions?: unknown[];
  macros?: unknown;
  micros?: unknown;
  allergens?: string[];
}

export interface Meal {
  id: string;
  image: string;
  title: string;
  time: number;
  calories: number;
  difficulty: string;
  rating: number;
  trending?: boolean;
  featured?: boolean;
  category?: string;
  recipeData?: unknown;
}

function parseTimeMins(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export interface RecommendationsData {
  list: Meal[];
  isAuthenticated: boolean;
}

/** Personalized recommendations for home (cached, refreshed every 12h). Returns meals + auth flag for empty state. */
export const useRecommendations = (limit = 24) => {
  const refreshRequested = useRef(false);
  const query = useQuery({
    queryKey: [...queryKeys.recommendations, limit],
    queryFn: async (): Promise<RecommendationsData> => {
      const res = await getRecommendations(limit, { refresh: refreshRequested.current });
      refreshRequested.current = false;
      const recs = res.recommendations || [];
      const list = recs.map((r: RecommendationItem): Meal => ({
        id: r.recipeId,
        image: r.imageUrl || getRecipeImageUrl(r.title),
        title: r.title,
        time: r.time ?? 30,
        calories: r.calories,
        difficulty: r.difficulty ?? 'Medium',
        rating: typeof r.rating === 'number' ? r.rating : parseFloat(String(r.rating)) || 4.5,
        category: r.category,
        recipeData: {
          id: r.recipeId,
          name: r.title,
          title: r.title,
          ingredients: r.recipeData?.ingredients ?? [],
          instructions: r.recipeData?.instructions ?? [],
          macros: r.recipeData?.macros ?? {},
          allergens: r.recipeData?.allergens ?? [],
        },
        recommendationReason: r.reason,
        tags: r.tags,
      }));
      return { list, isAuthenticated: res.isAuthenticated ?? false };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const refetchRecs = useCallback(() => {
    refreshRequested.current = true;
    return query.refetch();
  }, [query]);
  return { ...query, refetchRecs };
};

export const useAiRecipesByCategory = (category: string) => {
  return useQuery({
    queryKey: [...queryKeys.recipesByCategory(category.toLowerCase()), 'ai'],
    queryFn: async (): Promise<Meal[]> => {
      const categoryMap: Record<string, string> = {
        Pakistani: 'pakistani', Italian: 'italian', Chinese: 'chinese',
        Mexican: 'mexican', Thai: 'thai', Mediterranean: 'mediterranean',
      };
      const apiCategory = categoryMap[category] || category.toLowerCase();

      // 1) Try AI feed (recipe-engine)
      try {
        const response = await getAiFeed(apiCategory);
        const raw = response.results || [];
        if (raw.length > 0) {
          return raw.map((item: { recipe?: Record<string, unknown> }, idx: number) => {
            const r = item.recipe || {};
            const title = (r.title || r.name || 'Recipe') as string;
            const ingredients = Array.isArray(r.ingredients)
              ? r.ingredients.map((i: unknown) => typeof i === 'string' ? i : ((i as { name?: string })?.name) || '')
              : [];
            const directions = r.directions || r.instructions || [];
            const instructions = Array.isArray(directions)
              ? directions.map((step: unknown, i: number) => (typeof step === 'string' ? { id: i + 1, text: step } : step))
              : [];
            const prepTime = parseTimeMins(r.prep_time as string);
            const cookTime = parseTimeMins(r.cook_time as string);
            const time = prepTime + cookTime || 30;
            const recipeImage = getRecipeImageUrl(title);
            const recipeData = {
              id: `ai-${idx}-${title.replace(/\s+/g, '-').toLowerCase()}`,
              name: title, title, image: recipeImage, prepTime, cookTime,
              calories: (r.calories as number) || 300,
              difficulty: (r.difficulty as string) || 'Medium',
              rating: '4.5', ingredients, instructions,
              macros: r.macros || { protein: 15, carbs: 35, fat: 12, fiber: 3 },
              micros: r.micros || { calcium: 100, iron: 2, vitaminA: 500, vitaminC: 20 },
              allergens: [] as string[],
            };
            return {
              id: recipeData.id, image: recipeImage, title: recipeData.name, category, time,
              calories: recipeData.calories, difficulty: recipeData.difficulty,
              rating: parseFloat(String(recipeData.rating)) || 4.5,
              trending: false, featured: false, recipeData,
            };
          });
        }
      } catch (_) {
        /* AI feed failed, fall through to backend category */
      }

      // 2) Fallback: backend category API (Spoonacular + TheMealDB) – no recipe-engine needed
      const catResponse = await api.get(`/api/recipes/category/${apiCategory}`);
      if (catResponse?.data?.success === true) {
        const recipesData: Recipe[] = catResponse.data.recipes || [];
        if (recipesData.length > 0) {
          return recipesData
            .map((recipe, idx): Meal | null => {
              try {
                if (!recipe || (!recipe.id && !recipe.name)) return null;
                return {
                  id: recipe.id || `recipe-${idx}`,
                  image: recipe.image || getRecipeImageUrl(recipe.name || recipe.title || ''),
                  title: recipe.name || recipe.title || 'Unknown Recipe',
                  category,
                  time: (recipe.prepTime || 0) + (recipe.cookTime || 0) || 30,
                  calories: recipe.calories || 250,
                  difficulty: recipe.difficulty || 'Medium',
                  rating: parseFloat(String(recipe.rating)) || 4.5,
                  trending: false,
                  featured: false,
                  recipeData: recipe,
                };
              } catch {
                return null;
              }
            })
            .filter((meal): meal is Meal => meal !== null);
        }
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useRecipesByCategory = (category: string) => {
  return useQuery({
    queryKey: queryKeys.recipesByCategory(category.toLowerCase()),
    queryFn: async (): Promise<Meal[]> => {
      const categoryMap: Record<string, string> = {
        Pakistani: 'pakistani', Italian: 'italian', Chinese: 'chinese',
        Mexican: 'mexican', Thai: 'thai', Mediterranean: 'mediterranean',
      };
      const apiCategory = categoryMap[category] || category.toLowerCase();
      const response = await api.get(`/api/recipes/category/${apiCategory}`);
      if (response?.data?.success === true) {
        const recipesData: Recipe[] = response.data.recipes || [];
        if (recipesData?.length > 0) {
          return recipesData
            .map((recipe, idx): Meal | null => {
              try {
                if (!recipe || (!recipe.id && !recipe.name)) return null;
                return {
                  id: recipe.id || `recipe-${idx}`,
                  image: recipe.image || 'https://via.placeholder.com/400',
                  title: recipe.name || recipe.title || 'Unknown Recipe',
                  category, time: (recipe.prepTime || 0) + (recipe.cookTime || 0) || 30,
                  calories: recipe.calories || 250, difficulty: recipe.difficulty || 'Medium',
                  rating: parseFloat(String(recipe.rating)) || 4.5,
                  trending: false, featured: false, recipeData: recipe,
                };
              } catch { return null; }
            })
            .filter((meal): meal is Meal => meal !== null);
        }
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useRecipeSearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.recipeSearch(query),
    queryFn: async () => {
      const response = await api.get(`/api/recipes/search/${encodeURIComponent(query.trim())}`);
      if (response.data.success) return response.data.recipes || [];
      return [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};
