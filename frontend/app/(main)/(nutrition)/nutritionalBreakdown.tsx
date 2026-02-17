import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function NutritionalBreakdown() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealTitle = params.mealTitle as string || 'Creamy Pumpkin Soup';
  const handleViewMacronutrients = () => {
    router.push({ pathname: '/macronutrients', params: { mealTitle } });
  };

  // If macros were passed via params, use them; otherwise fall back to defaults
  const passedMacros = params.macros ? JSON.parse(params.macros as string) : null;
  const nutritionData = passedMacros
    ? {
        calories: Number(params.mealCalories) || Math.round((passedMacros.protein || 0) * 4 + (passedMacros.carbs || 0) * 4 + (passedMacros.fat || 0) * 9),
        protein: passedMacros.protein || 0,
        carbs: passedMacros.carbs || 0,
        fat: passedMacros.fat || 0,
        fiber: passedMacros.fiber || 0,
        sugar: 0,
      }
    : {
        calories: 290,
        protein: 8,
        carbs: 42,
        fat: 12,
        fiber: 5,
        sugar: 8,
      };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutritional Breakdown</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.recipeTitle}>{mealTitle}</Text>
          <Text style={styles.subtitle}>Complete nutritional information</Text>

          {/* Main Nutrition Card */}
          <View style={styles.nutritionCard}>
            <View style={styles.caloriesSection}>
              <Text style={styles.caloriesValue}>{nutritionData.calories}</Text>
              <Text style={styles.caloriesLabel}>Calories</Text>
            </View>

            <View style={styles.macrosGrid}>
              <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{nutritionData.protein}</Text>
                <Text style={styles.macroUnit}>g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{nutritionData.carbs}</Text>
                <Text style={styles.macroUnit}>g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{nutritionData.fat}</Text>
                <Text style={styles.macroUnit}>g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Additional Nutrients */}
          <View style={styles.additionalSection}>
            <Text style={styles.sectionTitle}>Additional Nutrients</Text>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientLabel}>Fiber</Text>
              <Text style={styles.nutrientValue}>{nutritionData.fiber}g</Text>
            </View>
            <View style={[styles.nutrientRow, styles.lastNutrientRow]}>
              <Text style={styles.nutrientLabel}>Sugar</Text>
              <Text style={styles.nutrientValue}>{nutritionData.sugar}g</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewMacronutrients}
            activeOpacity={0.8}
          >
            <Feather name="pie-chart" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>View Macronutrients</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3C2253',
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
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 20,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  nutritionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  caloriesValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#3C2253',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  macroValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  macroUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  additionalSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastNutrientRow: {
    borderBottomWidth: 0,
  },
  nutrientLabel: {
    fontSize: 15,
    color: '#666',
  },
  nutrientValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3C2253',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
