import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../lib/api';
import { MealVista } from '../../../constants/theme';

interface Nutrient {
  label: string;
  value: string;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  image: string;
  calories: number;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  rating: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  micros: {
    calcium: number;
    iron: number;
    vitaminA: number;
    vitaminC: number;
  };
  allergens: string[];
  dietTypes: string[];
  ingredients: string[];
  instructions?: string[];
}

const categoryColors: { [key: string]: string } = {
  italian: '#E8472B',
  pakistani: '#1F4788',
  indian: '#FF9933',
  chinese: '#DE2910',
  mexican: '#CE1126',
};

const NutrientBadge = ({ label, value, unit }: Nutrient) => (
  <View style={styles.nutrientBadge}>
    <Text style={styles.nutrientLabel}>{label}</Text>
    <Text style={styles.nutrientValue}>{value}</Text>
    <Text style={styles.nutrientUnit}>{unit}</Text>
  </View>
);

const RecipeCard = ({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.8}
    style={styles.mealCard}
  >
    <View style={styles.imageContainer}>
      <Image source={{ uri: recipe.image }} style={styles.mealImage} />
      <TouchableOpacity style={styles.bookmarkButton}>
        <Feather name="bookmark" size={18} color={MealVista.primary} />
      </TouchableOpacity>
    </View>
    <View style={styles.mealInfo}>
      <Text style={styles.mealTitle} numberOfLines={2}>
        {recipe.name}
      </Text>
      <View style={styles.mealDetails}>
        <View style={styles.detailItem}>
          <Feather name="clock" size={12} color="#666" />
          <Text style={styles.detailText}>{recipe.prepTime + recipe.cookTime} min</Text>
        </View>
        <Text style={styles.caloriesText}>{recipe.calories} kcal</Text>
      </View>
      <View style={styles.mealFooter}>
        <View style={styles.rating}>
          <Feather name="star" size={12} color="#FFA500" />
          <Text style={styles.ratingText}>{recipe.rating}</Text>
        </View>
        <View
          style={[
            styles.difficultyBadge,
            recipe.difficulty === "Easy" && styles.easyBadge,
            recipe.difficulty === "Medium" && styles.mediumBadge,
            recipe.difficulty === "Hard" && styles.hardBadge,
          ]}
        >
          <Text
            style={[
              styles.difficultyText,
              recipe.difficulty === "Easy" && styles.easyText,
              recipe.difficulty === "Medium" && styles.mediumText,
              recipe.difficulty === "Hard" && styles.hardText,
            ]}
          >
            {recipe.difficulty}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const RecipeDetailView = ({
  recipe,
  onBack,
  category,
}: {
  recipe: Recipe;
  onBack: () => void;
  category: string;
}) => {
  const router = useRouter();
  const categoryColor = categoryColors[category];

  const handleViewInstructions = (recipe: Recipe) => {
    router.push({
      pathname: '/instructions',
      params: {
        mealTitle: recipe.name,
      },
    });
  };

  const handleViewNutrients = (recipe: Recipe) => {
    router.push({
      pathname: '/nutritionalBreakdown',
      params: {
        mealTitle: recipe.name,
      },
    });
  };

  const handleViewAllergens = (recipe: Recipe) => {
    router.push({
      pathname: '/seeAllergens',
      params: {
        mealTitle: recipe.name,
        mealImage: recipe.image,
        ingredients: JSON.stringify(recipe.ingredients || []),
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={categoryColor} />
      <View style={[styles.detailHeader, { backgroundColor: categoryColor }]}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="chevron-left" size={28} color={MealVista.white} />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{recipe.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: recipe.image }} style={styles.detailImage} />

        <View style={styles.content}>
          <Text style={styles.recipeTitle}>{recipe.name}</Text>

          <View style={styles.recipeMeta}>
            <View style={styles.metaBadge}>
              <Feather name="clock" size={14} color="#666" />
              <Text style={styles.metaText}>{recipe.prepTime} min prep</Text>
            </View>
            <View style={styles.metaBadge}>
              <Feather name="zap" size={14} color="#666" />
              <Text style={styles.metaText}>{recipe.cookTime} min cook</Text>
            </View>
            <View style={styles.metaBadge}>
              <Feather name="users" size={14} color="#666" />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                recipe.difficulty === "Easy" && styles.easyBadge,
                recipe.difficulty === "Medium" && styles.mediumBadge,
                recipe.difficulty === "Hard" && styles.hardBadge,
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  recipe.difficulty === "Easy" && styles.easyText,
                  recipe.difficulty === "Medium" && styles.mediumText,
                  recipe.difficulty === "Hard" && styles.hardText,
                ]}
              >
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              activeOpacity={0.8}
              onPress={() => handleViewInstructions(recipe)}
            >
              <Feather name="book-open" size={18} color={MealVista.white} />
              <Text style={styles.primaryButtonText}>View Instructions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => handleViewNutrients(recipe)}
            >
              <Feather name="pie-chart" size={18} color={MealVista.primary} />
              <Text style={styles.secondaryButtonText}>View Nutrients</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tertiaryButton}
              activeOpacity={0.8}
              onPress={() => handleViewAllergens(recipe)}
            >
              <Feather name="alert-triangle" size={18} color={MealVista.primary} />
              <Text style={styles.tertiaryButtonText}>View Allergens</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Nutritional Information</Text>
          </View>

          <View style={styles.descriptionSection}>
            <View style={styles.calorieBox}>
              <Text style={styles.calorieValue}>{recipe.calories}</Text>
              <Text style={styles.calorieLabel}>kcal per serving</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Macronutrients</Text>
            <View style={styles.macroGrid}>
              <NutrientBadge label="Protein" value={recipe.macros.protein.toString()} unit="g" />
              <NutrientBadge label="Carbs" value={recipe.macros.carbs.toString()} unit="g" />
              <NutrientBadge label="Fat" value={recipe.macros.fat.toString()} unit="g" />
              <NutrientBadge label="Fiber" value={recipe.macros.fiber.toString()} unit="g" />
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Micronutrients</Text>
            <View style={styles.macroGrid}>
              <NutrientBadge label="Calcium" value={recipe.micros.calcium.toString()} unit="mg" />
              <NutrientBadge label="Iron" value={recipe.micros.iron.toString()} unit="mg" />
              <NutrientBadge label="Vitamin A" value={recipe.micros.vitaminA.toString()} unit="μg" />
              <NutrientBadge label="Vitamin C" value={recipe.micros.vitaminC.toString()} unit="mg" />
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Allergen Information</Text>
            {recipe.allergens.length > 0 ? (
              <View style={styles.allergenList}>
                {recipe.allergens.map((allergen) => (
                  <View key={allergen} style={styles.allergenChip}>
                    <Feather name="alert-circle" size={14} color="#FF6B6B" />
                    <Text style={styles.allergenChipText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noAllergenBox}>
                <Feather name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.noAllergenText}>No common allergens</Text>
              </View>
            )}
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Diet Types</Text>
            <View style={styles.dietList}>
              {recipe.dietTypes.map((diet) => (
                <View key={diet} style={styles.dietChip}>
                  <Text style={styles.dietChipText}>{diet}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Feather name="circle" size={6} color="#999" style={{ marginRight: 8 }} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default function CategoryDetail() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, [category]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use centralized API configuration
      const response = await api.get(`/api/recipes/category/${category || 'italian'}`);
      
      if (response.data.success) {
        setRecipes(response.data.recipes);
      } else {
        throw new Error(response.data.message || 'Failed to fetch recipes');
      }
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      let errorMessage = 'Failed to fetch recipes';
      
      if (err.message === 'Network Error' || err.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to server. Please check:\n1. Backend server is running\n2. Correct IP address in app.json\n3. Device and server are on same network';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categoryColor = categoryColors[category || 'italian'];

  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: '/recipeDetails',
      params: {
        mealTitle: recipe.name,
        mealImage: recipe.image,
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
      },
    });
  };

  if (!selectedRecipe) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={categoryColor} />

        <View style={[styles.header, { backgroundColor: categoryColor }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color={MealVista.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {category?.charAt(0).toUpperCase()}{category?.slice(1)} Recipes
          </Text>
          <View style={{ width: 32 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={categoryColor} />
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchRecipes}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color="#999" />
            <Text style={styles.emptyText}>No recipes found</Text>
          </View>
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <RecipeCard recipe={item} onPress={() => handleRecipePress(item)} />
            )}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  return (
    <RecipeDetailView
      recipe={selectedRecipe}
      onBack={() => setSelectedRecipe(null)}
      category={category || 'italian'}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MealVista.white,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MealVista.white,
    flex: 1,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  detailImage: {
    width: '100%',
    height: 280,
  },
  content: {
    padding: 20,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    fontSize: 13,
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
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MealVista.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: MealVista.white,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MealVista.surface,
    borderWidth: 1.5,
    borderColor: MealVista.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: MealVista.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MealVista.surface,
    borderWidth: 1.5,
    borderColor: MealVista.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  tertiaryButtonText: {
    color: MealVista.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  calorieBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutrientBadge: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 2,
  },
  nutrientUnit: {
    fontSize: 10,
    color: '#999',
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    flexDirection: 'row',
    backgroundColor: '#ffe0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  allergenChipText: {
    fontSize: 12,
    color: '#CC0000',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noAllergenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  noAllergenText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  dietList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dietChipText: {
    fontSize: 12,
    color: '#1565c0',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ingredientList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientText: {
    fontSize: 12,
    color: '#333',
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  gridRow: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: MealVista.surface,
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: MealVista.surface,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealInfo: {
    padding: 10,
  },
  mealTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  mealDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  caloriesText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: MealVista.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: MealVista.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
});
