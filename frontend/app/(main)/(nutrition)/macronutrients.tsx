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

export default function Macronutrients() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealTitle = params.mealTitle as string || 'Creamy Pumpkin Soup';
  
  // Parse macros from params
  let macrosData: any = {};
  try {
    macrosData = params.macros ? JSON.parse(params.macros as string) : {};
  } catch (e) {
    console.error('Error parsing macros:', e);
  }

  const handleViewMicronutrients = () => {
    router.push({
      pathname: '/micronutrients',
      params: {
        mealTitle: mealTitle,
        micros: params.micros as string || '{}',
      },
    });
  };

  // Calculate total calories from macros
  const totalCalories = (macrosData.protein || 0) * 4 + (macrosData.carbs || 0) * 4 + (macrosData.fat || 0) * 9;
  const proteinCalories = (macrosData.protein || 0) * 4;
  const carbsCalories = (macrosData.carbs || 0) * 4;
  const fatCalories = (macrosData.fat || 0) * 9;
  const fiberCalories = (macrosData.fiber || 0) * 2;

  const macronutrients = [
    { 
      name: 'Protein', 
      value: macrosData.protein || 8, 
      unit: 'g', 
      color: '#3B82F6', 
      percentage: totalCalories > 0 ? Math.round((proteinCalories / totalCalories) * 100) : 11 
    },
    { 
      name: 'Carbohydrates', 
      value: macrosData.carbs || 42, 
      unit: 'g', 
      color: '#10B981', 
      percentage: totalCalories > 0 ? Math.round((carbsCalories / totalCalories) * 100) : 58 
    },
    { 
      name: 'Fat', 
      value: macrosData.fat || 12, 
      unit: 'g', 
      color: '#F59E0B', 
      percentage: totalCalories > 0 ? Math.round((fatCalories / totalCalories) * 100) : 37 
    },
    { 
      name: 'Fiber', 
      value: macrosData.fiber || 5, 
      unit: 'g', 
      color: '#8B5CF6', 
      percentage: totalCalories > 0 ? Math.round((fiberCalories / totalCalories) * 100) : 7 
    },
  ];

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
        <Text style={styles.headerTitle}>Macronutrients</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.recipeTitle}>{mealTitle}</Text>
          <Text style={styles.subtitle}>Detailed macronutrient breakdown</Text>

          {/* Macronutrient Cards */}
          <View style={styles.macrosList}>
            {macronutrients.map((macro, index) => (
              <View key={index} style={styles.macroCard}>
                <View style={styles.macroHeader}>
                  <View style={[styles.macroColorIndicator, { backgroundColor: macro.color }]} />
                  <View style={styles.macroInfo}>
                    <Text style={styles.macroName}>{macro.name}</Text>
                    <Text style={styles.macroPercentage}>{macro.percentage}% of calories</Text>
                  </View>
                  <View style={styles.macroValueContainer}>
                    <Text style={styles.macroValue}>{macro.value}</Text>
                    <Text style={styles.macroUnit}>{macro.unit}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${macro.percentage}%`,
                        backgroundColor: macro.color,
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewMicronutrients}
            activeOpacity={0.8}
          >
            <Feather name="layers" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>View Micronutrients</Text>
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
  macrosList: {
    gap: 16,
    marginBottom: 24,
  },
  macroCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  macroInfo: {
    flex: 1,
  },
  macroName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  macroPercentage: {
    fontSize: 12,
    color: '#666',
  },
  macroValueContainer: {
    alignItems: 'flex-end',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  macroUnit: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
