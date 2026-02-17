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

export default function Micronutrients() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealTitle = params.mealTitle as string || 'Creamy Pumpkin Soup';
  
  // Parse micros from params
  let microsData: any = {};
  try {
    microsData = params.micros ? JSON.parse(params.micros as string) : {};
  } catch (e) {
    console.error('Error parsing micros:', e);
  }

  // Daily recommended values
  const dailyValues: { [key: string]: number } = {
    vitaminA: 900, // IU
    vitaminC: 90, // mg
    calcium: 1000, // mg
    iron: 18, // mg
    vitaminD: 600, // IU
    potassium: 3500, // mg
    magnesium: 400, // mg
    zinc: 11, // mg
  };

  const micronutrients = [
    { 
      name: 'Vitamin A', 
      value: microsData.vitaminA || 850, 
      unit: 'IU', 
      dailyValue: dailyValues.vitaminA, 
      percentage: Math.round(((microsData.vitaminA || 850) / dailyValues.vitaminA) * 100) 
    },
    { 
      name: 'Vitamin C', 
      value: microsData.vitaminC || 45, 
      unit: 'mg', 
      dailyValue: dailyValues.vitaminC, 
      percentage: Math.round(((microsData.vitaminC || 45) / dailyValues.vitaminC) * 100) 
    },
    { 
      name: 'Calcium', 
      value: microsData.calcium || 200, 
      unit: 'mg', 
      dailyValue: dailyValues.calcium, 
      percentage: Math.round(((microsData.calcium || 200) / dailyValues.calcium) * 100) 
    },
    { 
      name: 'Iron', 
      value: microsData.iron || 3.5, 
      unit: 'mg', 
      dailyValue: dailyValues.iron, 
      percentage: Math.round(((microsData.iron || 3.5) / dailyValues.iron) * 100) 
    },
    { 
      name: 'Vitamin D', 
      value: microsData.vitaminD || 120, 
      unit: 'IU', 
      dailyValue: dailyValues.vitaminD, 
      percentage: Math.round(((microsData.vitaminD || 120) / dailyValues.vitaminD) * 100) 
    },
    { 
      name: 'Potassium', 
      value: microsData.potassium || 350, 
      unit: 'mg', 
      dailyValue: dailyValues.potassium, 
      percentage: Math.round(((microsData.potassium || 350) / dailyValues.potassium) * 100) 
    },
    { 
      name: 'Magnesium', 
      value: microsData.magnesium || 50, 
      unit: 'mg', 
      dailyValue: dailyValues.magnesium, 
      percentage: Math.round(((microsData.magnesium || 50) / dailyValues.magnesium) * 100) 
    },
    { 
      name: 'Zinc', 
      value: microsData.zinc || 2.5, 
      unit: 'mg', 
      dailyValue: dailyValues.zinc, 
      percentage: Math.round(((microsData.zinc || 2.5) / dailyValues.zinc) * 100) 
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
        <Text style={styles.headerTitle}>Micronutrients</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.recipeTitle}>{mealTitle}</Text>
          <Text style={styles.subtitle}>Vitamins and minerals breakdown</Text>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Feather name="info" size={16} color="#3C2253" />
            <Text style={styles.infoBannerText}>
              Values shown as percentage of daily recommended intake
            </Text>
          </View>

          {/* Micronutrient List */}
          <View style={styles.nutrientsList}>
            {micronutrients.map((nutrient, index) => (
              <View key={index} style={styles.nutrientCard}>
                <View style={styles.nutrientHeader}>
                  <Text style={styles.nutrientName}>{nutrient.name}</Text>
                  <View style={styles.nutrientValues}>
                    <Text style={styles.nutrientValue}>
                      {nutrient.value} {nutrient.unit}
                    </Text>
                    <Text style={styles.nutrientPercentage}>
                      {nutrient.percentage}% DV
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(nutrient.percentage, 100)}%`,
                        backgroundColor: nutrient.percentage >= 100 ? '#10B981' : '#3B82F6',
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
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
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#3C2253',
  },
  nutrientsList: {
    gap: 12,
  },
  nutrientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  nutrientValues: {
    alignItems: 'flex-end',
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  nutrientPercentage: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
