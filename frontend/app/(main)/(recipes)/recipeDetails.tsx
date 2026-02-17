import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../../contexts/CartContext';
import { getMissingIngredients } from '../../../lib/api';
import { MealVista } from '../../../constants/theme';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  price: number;
}

export default function RecipeDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getTotalItems, addToCart, cartItems } = useCart();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [addMissingLoading, setAddMissingLoading] = useState(false);

  const substitutionsParam = params.substitutions as string | undefined;
  const recipeWithSubstitutionsParam = params.recipeWithSubstitutions as string | undefined;
  const substitutions: { original: string; alternative: string; allergen: string }[] = substitutionsParam
    ? (() => {
        try {
          return JSON.parse(substitutionsParam);
        } catch {
          return [];
        }
      })()
    : [];
  const recipeWithSubstitutions: { ingredients?: string[] } | null = recipeWithSubstitutionsParam
    ? (() => {
        try {
          return JSON.parse(recipeWithSubstitutionsParam);
        } catch {
          return null;
        }
      })()
    : null;

  const meal = {
    title: params.mealTitle as string || 'Recipe',
    image: params.mealImage as string || 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800',
    description: (params.mealDescription as string) || '',
    time: params.mealTime as string || '35',
    calories: params.mealCalories as string || '290',
    difficulty: params.mealDifficulty as string || 'Medium',
    rating: params.mealRating as string || '4.8',
  };

  // Use ingredients passed via params (from backend) when available
  const passedIngredientsRaw = params.ingredients as string | undefined;
  const ingredientsList: Ingredient[] = passedIngredientsRaw
    ? JSON.parse(passedIngredientsRaw).map((name: string, i: number) => ({
        id: String(i + 1),
        name,
        category: 'Pantry',
        price: 0,
      }))
    : [
        { id: '1', name: 'Pumpkin Puree', category: 'Canned Goods', price: 3.99 },
        { id: '2', name: 'Onion', category: 'Vegetables', price: 1.49 },
        { id: '3', name: 'Garlic', category: 'Vegetables', price: 0.99 },
        { id: '4', name: 'Vegetable Broth', category: 'Canned Goods', price: 2.99 },
        { id: '5', name: 'Heavy Cream', category: 'Dairy', price: 4.99 },
        { id: '6', name: 'Ground Cinnamon', category: 'Spices', price: 2.49 },
        { id: '7', name: 'Nutmeg', category: 'Spices', price: 2.99 },
        { id: '8', name: 'Olive Oil', category: 'Oils', price: 5.99 },
      ];

  const handleToggleIngredient = (id: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No Selection', 'Please select at least one ingredient to add to cart');
      return;
    }

    let addedCount = 0;
    selectedIngredients.forEach((id) => {
      const ingredient = ingredientsList.find((ing) => ing.id === id);
      if (ingredient) {
        const itemId = `ingredient-${ingredient.id}`;
        const alreadyInCart = cartItems.some((c) => c.id === itemId);
        if (!alreadyInCart) {
          addToCart({
            id: itemId,
            name: ingredient.name,
            price: ingredient.price,
            category: ingredient.category,
          });
          addedCount += 1;
        }
      }
    });

    Alert.alert(
      'Success',
      addedCount > 0
        ? `${addedCount} ingredient(s) added to cart`
        : 'Selected ingredient(s) are already in your cart',
      [
        {
          text: 'OK',
          onPress: () => setSelectedIngredients([]),
        },
      ]
    );
  };

  const handleViewInstructions = () => {
    router.push({
      pathname: '/instructions',
      params: {
        mealTitle: meal.title,
        mealImage: meal.image,
        instructions: params.instructions as string || '[]',
      },
    });
  };

  const handleViewNutrients = () => {
    router.push({ 
      pathname: '/macronutrients', 
      params: {
        mealTitle: meal.title,
        macros: params.macros as string || '{}',
        micros: params.micros as string || '{}',
      }
    });
  };

  const handleViewAllergens = () => {
    router.push({
      pathname: '/seeAllergens',
      params: {
        mealTitle: meal.title,
        mealImage: meal.image,
        ingredients: JSON.stringify(ingredientsList.map((i) => i.name)),
      },
    });
  };

  const handleCartPress = () => {
    router.push('/viewCart');
  };

  const handleAddMissingToCart = async () => {
    setAddMissingLoading(true);
    try {
      const ingredientNames = ingredientsList.map((i) => i.name);
      const res = await getMissingIngredients({
        recipe: { ingredients: ingredientNames, title: meal.title },
        userIngredients: [],
      });
      if (!res.success || !res.missingIngredients?.length) {
        Alert.alert('Info', 'No missing ingredients; you have everything needed for this recipe.');
        return;
      }
      let added = 0;
      for (const m of res.missingIngredients) {
        const name = m.name || m.original || '';
        if (!name) continue;
        const slug = name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || `ing-${added}`;
        const itemId = `missing-${slug}`;
        const already = cartItems.some((c) => c.name.toLowerCase() === name.toLowerCase());
        if (!already) {
          addToCart({
            id: itemId,
            name,
            price: 0,
            category: 'Pantry',
          });
          added += 1;
        }
      }
      Alert.alert(
        'Added to cart',
        added > 0
          ? `Added ${added} missing ingredient(s) to your cart.`
          : 'Missing ingredients are already in your cart.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Could not get missing ingredients. Check your connection.'
      );
    } finally {
      setAddMissingLoading(false);
    }
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
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <TouchableOpacity 
          onPress={handleCartPress}
          style={styles.cartButton}
        >
          <Feather name="shopping-cart" size={24} color={MealVista.white} />
          {getTotalItems() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Image */}
        <Image 
          source={{ uri: meal.image }} 
          style={styles.recipeImage}
          resizeMode="cover"
        />

        {/* Recipe Info */}
        <View style={styles.content}>
          <Text style={styles.recipeTitle}>{meal.title}</Text>
          
          <View style={styles.recipeMeta}>
            <View style={styles.metaBadge}>
              <Feather name="clock" size={14} color={MealVista.textSecondary} />
              <Text style={styles.metaText}>{meal.time} min</Text>
            </View>
            <View style={styles.metaBadge}>
              <Feather name="zap" size={14} color={MealVista.textSecondary} />
              <Text style={styles.metaText}>{meal.calories} kcal</Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                meal.difficulty === "Easy" && styles.easyBadge,
                meal.difficulty === "Medium" && styles.mediumBadge,
                meal.difficulty === "Hard" && styles.hardBadge,
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  meal.difficulty === "Easy" && styles.easyText,
                  meal.difficulty === "Medium" && styles.mediumText,
                  meal.difficulty === "Hard" && styles.hardText,
                ]}
              >
                {meal.difficulty}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleViewInstructions}
              activeOpacity={0.8}
            >
              <Feather name="book-open" size={18} color={MealVista.white} />
              <Text style={styles.primaryButtonText}>View Instructions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewNutrients}
              activeOpacity={0.8}
            >
              <Feather name="pie-chart" size={18} color={MealVista.primary} />
              <Text style={styles.secondaryButtonText}>View Nutrients</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tertiaryButton}
              onPress={handleViewAllergens}
              activeOpacity={0.8}
            >
              <Feather name="alert-triangle" size={18} color={MealVista.primary} />
              <Text style={styles.tertiaryButtonText}>View Allergens</Text>
            </TouchableOpacity>
          </View>

          {/* Allergen-safe version (when substitutions from AI search) */}
          {substitutions.length > 0 && (
            <View style={styles.allergenSafeSection}>
              <View style={styles.allergenSafeHeader}>
                <Feather name="shield" size={18} color={MealVista.primary} />
                <Text style={styles.allergenSafeTitle}>Allergen-safe version</Text>
              </View>
              <Text style={styles.allergenSafeSubtext}>Substitutions applied for your profile:</Text>
              {substitutions.map((s, idx) => (
                <View key={idx} style={styles.substitutionRow}>
                  <Text style={styles.substitutionOriginal}>{s.original}</Text>
                  <Feather name="arrow-right" size={14} color={MealVista.textSecondary} />
                  <Text style={styles.substitutionAlternative}>{s.alternative}</Text>
                </View>
              ))}
              {recipeWithSubstitutions?.ingredients && recipeWithSubstitutions.ingredients.length > 0 && (
                <View style={styles.safeIngredientsList}>
                  <Text style={styles.safeIngredientsTitle}>Safe ingredients list:</Text>
                  {recipeWithSubstitutions.ingredients.map((ing: string, idx: number) => (
                    <Text key={idx} style={styles.safeIngredientItem}>• {ing}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {meal.description || `A delicious recipe: ${meal.title}.`}
            </Text>
          </View>

          {/* Ingredients Section */}
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.ingredientsHeaderActions}>
                {selectedIngredients.length > 0 && (
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCart}
                  >
                    <Feather name="shopping-cart" size={16} color={MealVista.white} />
                    <Text style={styles.addToCartButtonText}>
                      Add selected ({selectedIngredients.length})
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.addMissingButton, addMissingLoading && styles.addMissingButtonDisabled]}
                  onPress={handleAddMissingToCart}
                  disabled={addMissingLoading}
                >
                  {addMissingLoading ? (
                    <ActivityIndicator size="small" color={MealVista.white} />
                  ) : (
                    <>
                      <Feather name="package" size={16} color={MealVista.white} />
                      <Text style={styles.addMissingButtonText}>Add missing to cart</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {ingredientsList.map((ingredient) => {
              const isSelected = selectedIngredients.includes(ingredient.id);
              return (
                <TouchableOpacity
                  key={ingredient.id}
                  style={[
                    styles.ingredientCard,
                    isSelected && styles.ingredientCardSelected,
                  ]}
                  onPress={() => handleToggleIngredient(ingredient.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Feather name="check" size={14} color={MealVista.white} />
                    )}
                  </View>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                  </View>
                  <Text style={styles.ingredientPrice}>Rs {ingredient.price.toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: MealVista.white,
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  recipeImage: {
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
    backgroundColor: MealVista.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 13,
    color: MealVista.textSecondary,
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
  descriptionText: {
    fontSize: 14,
    color: MealVista.textSecondary,
    lineHeight: 22,
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  ingredientsHeader: {
    marginBottom: 16,
  },
  ingredientsHeaderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MealVista.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addToCartButtonText: {
    color: MealVista.white,
    fontSize: 13,
    fontWeight: '600',
  },
  addMissingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MealVista.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addMissingButtonDisabled: {
    opacity: 0.7,
  },
  addMissingButtonText: {
    color: MealVista.white,
    fontSize: 13,
    fontWeight: '600',
  },
  allergenSafeSection: {
    backgroundColor: MealVista.backgroundTint,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: MealVista.cardBorder,
  },
  allergenSafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  allergenSafeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MealVista.primary,
  },
  allergenSafeSubtext: {
    fontSize: 13,
    color: MealVista.textSecondary,
    marginBottom: 10,
  },
  substitutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  substitutionOriginal: {
    fontSize: 13,
    color: MealVista.textSecondary,
    flex: 1,
  },
  substitutionAlternative: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    flex: 1,
  },
  safeIngredientsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MealVista.cardBorder,
  },
  safeIngredientsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  safeIngredientItem: {
    fontSize: 13,
    color: MealVista.textSecondary,
    marginBottom: 2,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MealVista.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: MealVista.cardBorder,
    shadowColor: MealVista.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientCardSelected: {
    borderColor: MealVista.primary,
    backgroundColor: MealVista.backgroundTint,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: MealVista.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: MealVista.surface,
  },
  checkboxSelected: {
    backgroundColor: MealVista.primary,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ingredientCategory: {
    fontSize: 13,
    color: MealVista.textSecondary,
  },
  ingredientPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: MealVista.primary,
  },
});
