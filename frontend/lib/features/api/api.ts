import axios from 'axios';
import Constants from 'expo-constants';

import { getStoredToken, storeToken, clearToken } from '../auth/authStorage';

const getBaseURL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
    || Constants.expoConfig?.extra?.apiUrl
    || Constants.manifest2?.extra?.apiUrl;

  if (envUrl) {
    console.log('[API] Using baseURL from env:', envUrl);
    return envUrl;
  }

  console.log('[API] Using default baseURL: http://192.168.1.20:5000');
  return 'http://192.168.1.20:5000';
};

const baseURL = getBaseURL();
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  console.log('[API] Request:', config.method?.toUpperCase(), baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('[API] Error:', {
      status: error?.response?.status,
      url: error?.config?.url,
      message: error?.message,
      baseURL: baseURL,
    });

    // Do not try refresh-token for login/signup - they are not token-based; reject with original error so UI shows backend message
    const isAuthAttempt =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/google');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthAttempt) {
      originalRequest._retry = true;
      try {
        const response = await api.post('/api/auth/refresh-token');
        const { token } = response.data;
        await storeToken(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearToken();
        return Promise.reject(refreshError);
      }
    }

    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      error.message = `Network Error: Cannot connect to ${baseURL}. Please check your backend server and network configuration.`;
    }

    return Promise.reject(error);
  }
);

export default api;

// ---------------------------------------------------------------------------
// AI Recipe Engine API
// ---------------------------------------------------------------------------

const AI_SEARCH_TIMEOUT_MS = 90000;

export interface AiSearchBody {
  query: string;
  maxResults?: number;
  generateIfNoMatch?: boolean;
  preferenceTags?: string[];
  dietaryPreferences?: string[];
  healthGoal?: string;
  bmiCategory?: string;
  /** User allergens for safe substitutions (e.g. ['dairy', 'nuts']) */
  userAllergens?: string[];
}

export interface AiSearchResultItem {
  type: string;
  recipe: {
    title?: string;
    name?: string;
    description?: string;
    image_url?: string;
    ingredients?: string[] | { name: string }[];
    directions?: string[];
    instructions?: unknown[];
    prep_time?: string;
    cook_time?: string;
    servings?: number;
    difficulty?: string;
  };
  rank: number;
  similarity_score?: number;
  recipe_with_substitutions?: { ingredients?: unknown[] };
  substitutions?: { original: string; alternative: string; allergen: string }[];
}

export interface AiSearchResponse {
  success?: boolean;
  results: AiSearchResultItem[];
  query_type?: string;
  total_results?: number;
  ingredients?: string[];
  message?: string;
}

const SEARCH_QUERY_MAX_LENGTH = 500;

/** Sanitize search query for API: trim, limit length, strip control chars. */
export function sanitizeSearchQuery(input: string): string {
  if (input == null || typeof input !== 'string') return '';
  return input.replace(/\s+/g, ' ').trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
}

export async function postAiSearch(body: AiSearchBody): Promise<AiSearchResponse> {
  const sanitized = {
    ...body,
    query: sanitizeSearchQuery(body.query),
  };
  if (!sanitized.query) {
    throw new Error('Query is required and cannot be empty');
  }
  const { data } = await api.post<AiSearchResponse>('/api/ai-recipes/search', sanitized, {
    timeout: AI_SEARCH_TIMEOUT_MS,
  });
  return {
    success: data?.success ?? true,
    results: data?.results ?? [],
    total_results: data?.total_results ?? (data?.results?.length ?? 0),
    query_type: data?.query_type,
    ingredients: data?.ingredients,
    message: data?.message,
  };
}

export interface MissingIngredientsBody {
  recipe: { ingredients: string[]; title?: string; name?: string };
  userIngredients?: string[];
}

export interface MissingIngredientsResponse {
  success: boolean;
  missingIngredients: { name: string; original?: string }[];
  recipeTitle?: string;
}

export async function getMissingIngredients(body: MissingIngredientsBody): Promise<MissingIngredientsResponse> {
  const { data } = await api.post<MissingIngredientsResponse>('/api/ai-recipes/missing-ingredients', body);
  return data;
}

export interface AllergenAlternativesResponse {
  success: boolean;
  allergens?: { ingredient: string; allergenType: string }[];
  alternatives?: { original: string; alternative: string; allergen: string }[];
  message?: string;
}

export async function postAllergenAlternatives(
  recipeTitle: string,
  ingredients: string[],
  userAllergens?: string[]
): Promise<AllergenAlternativesResponse> {
  const { data } = await api.post<AllergenAlternativesResponse>(
    '/api/ai-recipes/allergen-alternatives',
    { recipeTitle, ingredients, userAllergens }
  );
  return data;
}

export interface AiHealthResponse {
  success: boolean;
  aiEngine?: { available?: boolean; status?: string; engineLoaded?: boolean };
}

export async function getAiHealth(): Promise<AiHealthResponse> {
  const { data } = await api.get<AiHealthResponse>('/api/ai-recipes/health');
  return data;
}

export interface AiFeedResponse {
  success?: boolean;
  results: AiSearchResultItem[];
  query?: string;
  query_type?: string;
  total_results?: number;
  category?: string | null;
}

export async function getAiFeed(category?: string): Promise<AiFeedResponse> {
  const params = category ? { category: category.toLowerCase() } : {};
  const { data } = await api.get<AiFeedResponse>('/api/ai-recipes/feed', { params, timeout: 20000 });
  return data;
}

// ---------------------------------------------------------------------------
// Recommendations API (personalized home feed)
// ---------------------------------------------------------------------------

export interface RecommendationItem {
  recipeId: string;
  title: string;
  imageUrl: string | null;
  calories: number;
  tags: string[];
  reason: string;
  score?: number;
  category?: string;
  time?: number;
  difficulty?: string;
  rating?: number;
  recipeData?: {
    id?: string;
    name?: string;
    title?: string;
    ingredients?: unknown[];
    instructions?: unknown[];
    macros?: Record<string, number>;
    allergens?: string[];
  };
}

export interface RecommendationsResponse {
  success: boolean;
  recommendations: RecommendationItem[];
  count: number;
  isAuthenticated?: boolean;
  message?: string;
}

export async function getRecommendations(
  limit?: number,
  options?: { refresh?: boolean }
): Promise<RecommendationsResponse> {
  const params: Record<string, string | number> = limit ? { limit } : {};
  if (options?.refresh) params.refresh = 'true';
  const { data } = await api.get<RecommendationsResponse>('/api/recommendations', { params, timeout: 25000 });
  return data;
}

export type InteractionType = 'view' | 'like' | 'save' | 'cooked';

export async function recordRecommendationInteraction(body: {
  recipeId: string;
  recipeTitle?: string;
  type: InteractionType;
  cuisine?: string;
  category?: string;
}): Promise<void> {
  await api.post('/api/recommendations/interaction', body);
}
