import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { postAiSearch, sanitizeSearchQuery, type AiSearchResultItem } from '../../../lib/api';
import { getProfile } from '../../../lib/authService';
import { getThumbnailUrl, getRecipeImageUrl } from '../../../lib/imageOptimizer';
import { handleError } from '../../../lib/errorHandler';
import { MealVista } from '../../../constants/theme';


interface Recipe {
  id: string;
  name: string;
  image: string;
  description?: string;
  calories: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  rating: string;
  macros: { protein: number; carbs: number; fat: number; fiber: number };
  micros: { calcium: number; iron: number; vitaminA: number; vitaminC: number; sodium?: number; potassium?: number };
  ingredients: string[];
  instructions: any[];
  allergens: string[];
  dietTypes: string[];
  isAIGenerated?: boolean;
  /** 'groq' = runtime AI (Groq-only) */
  source?: 'gemini' | 'groq' | 'database';
  personalizedFor?: any;
  substitutions?: { original: string; alternative: string; allergen: string }[];
  recipeWithSubstitutions?: { ingredients?: any[] };
}

function parseTimeMins(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function mapAiResultToRecipe(item: AiSearchResultItem, index: number): Recipe {
  const r = item.recipe;
  const title = r.title || r.name || 'Recipe';
  const ingredientsRaw = r.ingredients || [];
  const ingredients = Array.isArray(ingredientsRaw)
    ? ingredientsRaw.map((i) => (typeof i === 'string' ? i : (i as { name: string }).name))
    : [];
  const directions = r.directions || r.instructions || [];
  const instructions = Array.isArray(directions)
    ? directions.map((step: any, i: number) => (typeof step === 'string' ? { id: i + 1, text: step } : step))
    : [];
  const prepTime = parseTimeMins(r.prep_time);
  const cookTime = parseTimeMins(r.cook_time);
  const type = (item.type || '').toLowerCase();
  const isFromAI = type.includes('gemini') || type.includes('groq');
  const source: 'gemini' | 'groq' | 'database' = type.includes('groq') ? 'groq' : type.includes('gemini') ? 'gemini' : 'database';
  const imageUrl = r.image_url;
  return {
    id: `ai-${index}-${title.replace(/\s+/g, '-').toLowerCase()}`,
    name: title,
    image: imageUrl && typeof imageUrl === 'string' ? imageUrl : getRecipeImageUrl(title),
    description: typeof r.description === 'string' ? r.description : '',
    calories: typeof (r as any).calories === 'number' ? (r as any).calories : 300,
    prepTime: prepTime || 15,
    cookTime: cookTime || 20,
    difficulty: r.difficulty || 'Medium',
    rating: '4.5',
    macros: (r as any).macros && typeof (r as any).macros === 'object' ? (r as any).macros : { protein: 15, carbs: 35, fat: 12, fiber: 3 },
    micros: (r as any).micros && typeof (r as any).micros === 'object' ? (r as any).micros : { calcium: 100, iron: 2, vitaminA: 500, vitaminC: 20, sodium: 400, potassium: 200 },
    ingredients,
    instructions,
    allergens: Array.isArray((r as any).allergens) ? (r as any).allergens : [],
    dietTypes: [],
    isAIGenerated: isFromAI,
    source,
    substitutions: item.substitutions,
    recipeWithSubstitutions: item.recipe_with_substitutions,
  };
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = sanitizeSearchQuery(searchQuery);
    if (!trimmed || trimmed.length < 2) {
      Alert.alert('Invalid Search', 'Please enter at least 2 characters to search.');
      return;
    }

    setLoading(true);
    setEmptyMessage(null);

    let profile: any = null;
    try {
      const profileResponse = await getProfile();
      profile = profileResponse.user;
      setUserProfile(profile);
    } catch {
      console.log('[AI Search] Could not load user profile, using default');
    }

    const preferenceTags: string[] = [];
    if (profile?.dietaryPreferences?.length) {
      preferenceTags.push(...profile.dietaryPreferences);
    }
    if (profile?.healthGoal && profile.healthGoal !== 'maintenance') {
      preferenceTags.push(profile.healthGoal === 'weight_loss' ? 'weight_loss' : 'weight_gain');
    }

    const userAllergens = Array.isArray(profile?.allergens)
      ? profile.allergens.map((a: string) => String(a).trim()).filter(Boolean)
      : undefined;

    try {
      console.log('[AI Search] Calling AI engine:', trimmed);
      const aiResponse = await postAiSearch({
        query: trimmed,
        maxResults: 25,
        generateIfNoMatch: true,
        preferenceTags: preferenceTags.length ? preferenceTags : undefined,
        dietaryPreferences: profile?.dietaryPreferences,
        healthGoal: profile?.healthGoal,
        bmiCategory: profile?.bmiCategory,
        userAllergens,
      });
      const rawResults = Array.isArray(aiResponse?.results) ? aiResponse.results : [];
      const finalRecipes = rawResults.map((item, idx) => mapAiResultToRecipe(item, idx));
      setRecipes(finalRecipes);
      setEmptyMessage(
        finalRecipes.length === 0 && aiResponse?.message
          ? aiResponse.message
          : finalRecipes.length === 0
            ? 'No recipes found. Try a different search or check that the recipe engine is running.'
            : null
      );
      console.log('[AI Search] AI returned', finalRecipes.length, 'recipes');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Recipe search failed. Please try again.';
      console.warn('[AI Search] Error:', message);
      handleError(err, 'Recipe Search');
      setRecipes([]);
      setEmptyMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: '/recipeDetails',
      params: {
        mealTitle: recipe.name,
        mealImage: recipe.image,
        mealDescription: recipe.description || '',
        mealTime: (recipe.prepTime + recipe.cookTime).toString(),
        mealCalories: recipe.calories.toString(),
        mealDifficulty: recipe.difficulty,
        mealRating: recipe.rating.toString(),
        recipeId: recipe.id,
        ingredients: JSON.stringify(recipe.ingredients || []),
        instructions: JSON.stringify(recipe.instructions || []),
        macros: JSON.stringify(recipe.macros || {}),
        micros: JSON.stringify(recipe.micros || {}),
        allergens: JSON.stringify(recipe.allergens || []),
        substitutions: recipe.substitutions ? JSON.stringify(recipe.substitutions) : undefined,
        recipeWithSubstitutions: recipe.recipeWithSubstitutions
          ? JSON.stringify(recipe.recipeWithSubstitutions)
          : undefined,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MealVista.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={MealVista.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Recipe Search</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color={MealVista.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by recipe name or ingredient..."
            placeholderTextColor={MealVista.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Feather name="x" size={18} color={MealVista.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading || sanitizeSearchQuery(searchQuery).length < 2}
        >
          {loading ? (
            <ActivityIndicator size="small" color={MealVista.white} />
          ) : (
            <Feather name="search" size={20} color={MealVista.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* AI Info Banner */}
      {userProfile && (userProfile.bmi || userProfile.healthGoal || userProfile.dietaryPreferences?.length > 0) && (
        <View style={styles.aiInfoBanner}>
          <Feather name="star" size={16} color={MealVista.primary} />
          <Text style={styles.aiInfoText}>
            Recipes personalized for your profile (BMI: {userProfile.bmiCategory}, Goal: {userProfile.healthGoal === 'weight_loss' ? 'Weight Loss' : userProfile.healthGoal === 'weight_gain' ? 'Weight Gain' : 'Maintenance'})
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={MealVista.primary} />
            <Text style={styles.loadingText}>Searching with AI...</Text>
          </View>
        ) : recipes.length === 0 && searchQuery.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={MealVista.textSecondary} />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>
              Try different keywords or ingredients. If this keeps happening, ensure the Node backend (port 5000) and AI recipe engine (port 8000) are running.
            </Text>
          </View>
        ) : recipes.length > 0 ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsHeaderText}>
                {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.resultsHeaderBadges}>
                {recipes.some((r) => r.source === 'gemini') && (
                  <View style={styles.aiBadge}>
                    <Feather name="cpu" size={12} color={MealVista.primary} />
                    <Text style={styles.aiBadgeText}>Gemini</Text>
                  </View>
                )}
                {recipes.some((r) => r.source === 'groq') && (
                  <View style={styles.groqBadge}>
                    <Feather name="zap" size={12} color="#6B21A8" />
                    <Text style={styles.groqBadgeText}>Groq</Text>
                  </View>
                )}
                {recipes.some((r) => r.source === 'database') && (
                  <View style={styles.dbBadge}>
                    <Feather name="book" size={12} color={MealVista.textSecondary} />
                    <Text style={styles.dbBadgeText}>Library</Text>
                  </View>
                )}
              </View>
            </View>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getThumbnailUrl(recipe.image) }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                <View style={styles.recipeInfo}>
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeTitle} numberOfLines={2}>
                      {recipe.name}
                    </Text>
                    {recipe.source === 'gemini' && (
                      <View style={styles.sourceTagGemini}>
                        <Feather name="cpu" size={10} color="#fff" />
                        <Text style={styles.sourceTagGeminiText}>Gemini</Text>
                      </View>
                    )}
                    {recipe.source === 'groq' && (
                      <View style={styles.sourceTagGroq}>
                        <Feather name="zap" size={10} color="#fff" />
                        <Text style={styles.sourceTagGroqText}>Groq</Text>
                      </View>
                    )}
                    {recipe.source === 'database' && (
                      <View style={styles.sourceTagDb}>
                        <Feather name="book" size={10} color="#fff" />
                        <Text style={styles.sourceTagDbText}>Library</Text>
                      </View>
                    )}
                    {recipe.substitutions && recipe.substitutions.length > 0 && (
                      <View style={styles.allergenTag}>
                        <Feather name="shield" size={10} color={MealVista.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={14} color={MealVista.textSecondary} />
                      <Text style={styles.metaText}>
                        {(recipe.prepTime + recipe.cookTime)} min
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="zap" size={14} color="#666" />
                      <Text style={styles.metaText}>{recipe.calories} kcal</Text>
                    </View>
                    <View
                      style={[
                        styles.difficultyBadge,
                        recipe.difficulty === 'Easy' && styles.easyBadge,
                        recipe.difficulty === 'Medium' && styles.mediumBadge,
                        recipe.difficulty === 'Hard' && styles.hardBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          recipe.difficulty === 'Easy' && styles.easyText,
                          recipe.difficulty === 'Medium' && styles.mediumText,
                          recipe.difficulty === 'Hard' && styles.hardText,
                        ]}
                      >
                        {recipe.difficulty}
                      </Text>
                    </View>
                  </View>
                  {recipe.dietTypes && recipe.dietTypes.length > 0 && (
                    <View style={styles.dietTypes}>
                      {recipe.dietTypes.slice(0, 3).map((diet, idx) => (
                        <View key={idx} style={styles.dietTag}>
                          <Text style={styles.dietTagText}>{diet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Feather name="search" size={64} color={MealVista.cardBorder} />
            <Text style={styles.placeholderText}>
              {emptyMessage
                ? (emptyMessage.toLowerCase().includes('limit') ? 'AI limit reached' : 'No results')
                : 'Search for AI-Powered Recipes'}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {emptyMessage || 'Enter a recipe name or ingredient to get personalized recipe recommendations'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MealVista.backgroundTint,
  },
  header: {
    backgroundColor: MealVista.primary,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MealVista.white,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: MealVista.surface,
    borderBottomWidth: 1,
    borderBottomColor: MealVista.cardBorder,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MealVista.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: MealVista.cardBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: MealVista.primary,
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MealVista.backgroundTint,
    gap: 8,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 12,
    color: MealVista.primary,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: MealVista.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  resultsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultsHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MealVista.backgroundTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  allergenBadgeText: {
    fontSize: 11,
    color: MealVista.primary,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MealVista.backgroundTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    color: MealVista.primary,
    fontWeight: '600',
  },
  dbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dbBadgeText: {
    fontSize: 11,
    color: MealVista.textSecondary,
    fontWeight: '600',
  },
  groqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  groqBadgeText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '600',
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeImage: {
    width: 120,
    height: 120,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  aiTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MealVista.backgroundTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTagGemini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MealVista.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceTagGeminiText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  sourceTagDb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceTagDbText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  sourceTagGroq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6B21A8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceTagGroqText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  allergenTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MealVista.backgroundTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: MealVista.textSecondary,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  easyBadge: {
    backgroundColor: '#D1FAE5',
  },
  mediumBadge: {
    backgroundColor: '#FEF3C7',
  },
  hardBadge: {
    backgroundColor: '#FEE2E2',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  easyText: {
    color: '#059669',
  },
  mediumText: {
    color: '#D97706',
  },
  hardText: {
    color: '#DC2626',
  },
  dietTypes: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dietTag: {
    backgroundColor: MealVista.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dietTagText: {
    fontSize: 10,
    color: MealVista.textSecondary,
    fontWeight: '500',
  },
  placeholderContainer: {
    padding: 60,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: MealVista.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
// end StyleSheet
