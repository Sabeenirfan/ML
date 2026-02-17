import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from "@expo/vector-icons";
import { useFavorites } from "../../../contexts/FavoritesContext";
import { useRouter } from 'expo-router';
import { useCart } from '../../../contexts/CartContext';
import api from '../../../lib/api';
import { useState, useEffect } from 'react';
import { getThumbnailUrl } from '../../../lib/imageOptimizer';
import { SkeletonList } from '../../../components/SkeletonLoader';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryClient';
import { useAiRecipesByCategory, useRecommendations } from '../../../hooks/useRecipes';
import { recordRecommendationInteraction } from '../../../lib/api';
import { getStoredToken } from '../../../lib/authStorage';
import { MealVista } from '../../../constants/theme';

interface Meal {
  id?: string;
  image: string;
  title: string;
  time: number;
  calories: number;
  difficulty: string;
  rating: number;
  trending?: boolean;
  featured?: boolean;
  category?: string;
  recipeData?: any;
  recommendationReason?: string;
  tags?: string[];
}

interface MealCardProps {
  meal: Meal;
  size?: 'normal' | 'large';
  onPress?: () => void;
  onBookmarkPress?: () => void;
  favorited?: boolean;
  showRecommendationReason?: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const MealCard = ({ meal, size = 'normal', onPress, onBookmarkPress, favorited = false, showRecommendationReason = false }: MealCardProps) => {
  const isLarge = size === 'large';
  const id = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
  const reason = (meal as Meal).recommendationReason;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.mealCard, isLarge && styles.mealCardLarge]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: getThumbnailUrl(meal.image) }} style={styles.mealImage} />
        {meal.trending && (
          <View style={styles.trendingBadge}>
            <Feather name="trending-up" size={12} color={MealVista.white} />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
        <TouchableOpacity style={styles.bookmarkButton} onPress={onBookmarkPress}>
          <Feather name="bookmark" size={18} color={favorited ? '#FF6B6B' : MealVista.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle} numberOfLines={2}>
          {meal.title}
        </Text>
        {showRecommendationReason && reason ? (
          <Text style={styles.recommendationReason} numberOfLines={1}>
            {reason}
          </Text>
        ) : null}
        {meal.tags && meal.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {meal.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.mealDetails}>
          <View style={styles.detailItem}>
            <Feather name="clock" size={12} color={MealVista.textSecondary} />
            <Text style={styles.detailText}>{meal.time} min</Text>
          </View>
          <Text style={styles.caloriesText}>{meal.calories} kcal</Text>
        </View>
        <View style={styles.mealFooter}>
          <View style={styles.rating}>
            <Feather name="star" size={12} color="#FFA500" />
            <Text style={styles.ratingText}>{meal.rating}</Text>
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
      </View>
    </TouchableOpacity>
  );
};

export default function Home() {
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string>('Pakistani');
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    getStoredToken().then((t) => setHasToken(!!t));
  }, []);

  const categories: Category[] = [
    { id: 'pakistani', name: 'Pakistani', color: '#1F4788' },
    { id: 'italian', name: 'Italian', color: '#E8472B' },
    { id: 'chinese', name: 'Chinese', color: '#DE2910' },
    { id: 'mexican', name: 'Mexican', color: '#CE1126' },
    { id: 'thai', name: 'Thai', color: '#2D5016' },
    { id: 'mediterranean', name: 'Mediterranean', color: '#FF9500' },
  ];

  // Separate: (1) Personalized recommendations, (2) Category feed
  const { data: recData, isLoading: recLoading, refetch: refetchRecs } = useRecommendations(24);
  const recommendations = recData?.list ?? [];
  // Prefer API's isAuthenticated; when API fails or returns nothing, fall back to having a token (user is logged in)
  const isAuthenticated = recData?.isAuthenticated ?? hasToken;
  const { data: categoryRecipes = [], isLoading: categoryLoading } = useAiRecipesByCategory(selectedCategory);

  const recommendedMeals = recommendations.slice(0, 8);
  const categoryMeals = categoryRecipes.slice(0, 4);
  const trendingMeals = categoryRecipes.slice(4, 8).map((meal, index) => ({
    ...meal,
    trending: true,
    featured: index === 0,
  }));

  const handleMealPress = (meal: Meal) => {
    const recipeId = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
    recordRecommendationInteraction({
      recipeId,
      recipeTitle: meal.title,
      type: 'view',
      category: meal.category,
    }).catch(() => {});
    const recipeData = (meal as any).recipeData;
    router.push({
      pathname: '/recipeDetails',
      params: {
        mealTitle: meal.title,
        mealImage: meal.image,
        mealTime: meal.time.toString(),
        mealCalories: meal.calories.toString(),
        mealDifficulty: meal.difficulty,
        mealRating: meal.rating.toString(),
        // Pass full recipe data
        recipeId: recipeData?.id || '',
        ingredients: recipeData ? JSON.stringify(recipeData.ingredients || []) : '[]',
        instructions: recipeData ? JSON.stringify(recipeData.instructions || []) : '[]',
        macros: recipeData ? JSON.stringify(recipeData.macros || {}) : '{}',
        micros: recipeData ? JSON.stringify(recipeData.micros || {}) : '{}',
        allergens: recipeData ? JSON.stringify(recipeData.allergens || []) : '[]',
      },
    });
  };

  const handleBookmarkPress = (meal: Meal) => {
    const id = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
    toggleFavorite({
      id,
      title: meal.title,
      image: meal.image,
      time: meal.time,
      calories: meal.calories,
      difficulty: meal.difficulty,
      rating: meal.rating,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MealVista.primary} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MealVista</Text>
          <Text style={styles.headerSubtitle}>Let's Discover ✨</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="search" size={20} color={MealVista.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/viewCart')}
          >
            <Feather name="shopping-cart" size={20} color={MealVista.white} />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/profile')}
          >
            <Feather name="user" size={20} color={MealVista.white} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TouchableOpacity
            style={styles.searchBarInput}
            onPress={() => router.push('/search')}
          >
            <Text style={styles.searchBarPlaceholder}>Search AI recipes...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchBarButton}
            onPress={() => router.push('/search')}
          >
            <Text style={styles.searchBarIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScrollView}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.name)}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 1) Recommended for You – dedicated personalized section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <Text style={styles.sectionSubtitle}>
            Personalized to your diet, allergens & goals
          </Text>
        </View>
        {recLoading ? (
          <View style={styles.gridContainer}>
            <SkeletonList count={4} type="grid" />
          </View>
        ) : recommendedMeals.length === 0 ? (
          <TouchableOpacity
            style={styles.recommendedEmptyCard}
            onPress={() => (isAuthenticated ? refetchRecs() : router.push('/profile'))}
            activeOpacity={0.8}
          >
            <Feather name={isAuthenticated ? 'refresh-cw' : 'user'} size={40} color={MealVista.primary} />
            <Text style={styles.recommendedEmptyTitle}>
              {isAuthenticated ? 'No recommendations yet' : 'Get personalized picks'}
            </Text>
            <Text style={styles.recommendedEmptySubtitle}>
              {isAuthenticated
                ? 'Tap here to refresh, or we may still be loading recipes for your profile.'
                : 'Sign in and set your dietary preferences, allergens & health goal to see recommendations here.'}
            </Text>
            <Text style={styles.recommendedEmptyCta}>
              {isAuthenticated ? 'Tap to refresh' : 'Go to Profile →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.gridContainer}>
            {recommendedMeals.map((meal, index) => {
              const id = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
              const mealWithId = { ...(meal as any), id } as Meal & { id: string };
              return (
                <View key={meal.id || index} style={styles.gridItem}>
                  <MealCard
                    meal={mealWithId}
                    onPress={() => handleMealPress(mealWithId)}
                    onBookmarkPress={() => handleBookmarkPress(mealWithId)}
                    favorited={isFavorited(id)}
                    showRecommendationReason={true}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* 2) From [Category] – separate section by cuisine */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>From {selectedCategory}</Text>
          <Text style={styles.sectionSubtitle}>
            A curated selection from {selectedCategory}
          </Text>
        </View>
        {categoryLoading ? (
          <View style={styles.gridContainer}>
            <SkeletonList count={4} type="grid" />
          </View>
        ) : categoryMeals.length === 0 ? (
          <View style={styles.emptyCategoryBox}>
            <Feather name="inbox" size={48} color={MealVista.textSecondary} />
            <Text style={styles.emptyCategoryText}>No recipes in this category</Text>
            <Text style={styles.emptyCategoryHint}>Try another category above</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {categoryMeals.map((meal, index) => {
              const id = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
              const mealWithId = { ...(meal as any), id } as Meal & { id: string };
              return (
                <View key={meal.id || index} style={styles.gridItem}>
                  <MealCard
                    meal={mealWithId}
                    onPress={() => handleMealPress(mealWithId)}
                    onBookmarkPress={() => handleBookmarkPress(mealWithId)}
                    favorited={isFavorited(id)}
                    showRecommendationReason={false}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* 3) Trending Section (from same category feed) */}
        <View style={styles.trendingHeader}>
          <Feather name="trending-up" size={20} color={MealVista.white} />
          <View style={styles.trendingHeaderText}>
            <Text style={styles.trendingTitle}>Trending & Seasonal</Text>
            <Text style={styles.trendingSubtitle}>Popular this week</Text>
          </View>
        </View>
        {/* Featured Trending Meal */}
        {!categoryLoading && trendingMeals.length > 0 && categoryRecipes.length > 4 && (
          <View style={styles.featuredContainer}>
            {(() => {
              const meal = trendingMeals[0];
              const id = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
              const mealWithId = { ...(meal as any), id } as Meal & { id: string };
              return (
                <MealCard
                  meal={mealWithId}
                  size="large"
                  onPress={() => handleMealPress(mealWithId)}
                  onBookmarkPress={() => handleBookmarkPress(mealWithId)}
                  favorited={isFavorited(id)}
                />
              );
            })()}
          </View>
        )}
        {/* Other Trending Meals */}
        {!categoryLoading && trendingMeals.length > 1 && (
          <View style={styles.gridContainer}>
            {trendingMeals.slice(1).map((meal, index) => {
              const id = (meal as any).id ?? meal.title.replace(/\s+/g, '-').toLowerCase();
              const mealWithId = { ...(meal as any), id } as Meal & { id: string };
              return (
                <View key={index} style={styles.gridItem}>
                  <MealCard
                    meal={mealWithId}
                    onPress={() => handleMealPress(mealWithId)}
                    onBookmarkPress={() => handleBookmarkPress(mealWithId)}
                    favorited={isFavorited(id)}
                  />
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.bottomSpacer} />
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
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MealVista.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: MealVista.muted,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: MealVista.primary,
    gap: 12,
  },
  searchBarInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: MealVista.white,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: MealVista.surface,
    justifyContent: 'center',
  },
  searchBarPlaceholder: {
    fontSize: 16,
    color: MealVista.textSecondary,
  },
  searchBarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: MealVista.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarIcon: {
    fontSize: 24,
    color: MealVista.white,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: MealVista.backgroundTint,
  },
  categoriesScrollView: {
    flexGrow: 0,
  },
  categoriesContainer: {
    paddingEnd: 20,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: MealVista.surface,
    borderWidth: 1,
    borderColor: MealVista.cardBorder,
  },
  categoryPillActive: {
    backgroundColor: MealVista.primary,
    borderColor: MealVista.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: MealVista.textSecondary,
  },
  categoryPillTextActive: {
    color: MealVista.white,
  },
  sectionHeader: {
    backgroundColor: MealVista.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MealVista.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: MealVista.muted,
  },
  recommendedEmptyCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 24,
    backgroundColor: MealVista.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MealVista.cardBorder,
    alignItems: 'center',
  },
  recommendedEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  recommendedEmptySubtitle: {
    fontSize: 13,
    color: MealVista.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  recommendedEmptyCta: {
    fontSize: 14,
    fontWeight: '600',
    color: MealVista.primary,
    marginTop: 12,
  },
  emptyCategoryBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCategoryText: {
    color: MealVista.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyCategoryHint: {
    color: MealVista.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 24,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: MealVista.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MealVista.cardBorder,
    elevation: 2,
    shadowColor: MealVista.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  mealCardLarge: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: MealVista.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingText: {
    color: MealVista.white,
    fontSize: 10,
    fontWeight: '600',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: MealVista.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mealInfo: {
    padding: 12,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  recommendationReason: {
    fontSize: 11,
    color: MealVista.textSecondary,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tagChip: {
    backgroundColor: '#E8E0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 10,
    color: '#5A3D7A',
    fontWeight: '500',
  },
  mealDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: MealVista.textSecondary,
  },
  caloriesText: {
    fontSize: 12,
    color: MealVista.textSecondary,
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
  trendingHeader: {
    backgroundColor: MealVista.primary,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendingHeaderText: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MealVista.white,
  },
  trendingSubtitle: {
    fontSize: 12,
    color: MealVista.muted,
  },
  featuredContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});
