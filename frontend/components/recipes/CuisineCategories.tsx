import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const categories: Category[] = [
  { id: 'italian', name: 'Italian', icon: '🇮🇹', color: '#E8472B', description: 'Classic pasta & more' },
  { id: 'pakistani', name: 'Pakistani', icon: '🇵🇰', color: '#1F4788', description: 'Spicy & flavorful' },
  { id: 'indian', name: 'Indian', icon: '🇮🇳', color: '#FF9933', description: 'Aromatic curries' },
  { id: 'chinese', name: 'Chinese', icon: '🇨🇳', color: '#DE2910', description: 'Bold & savory' },
  { id: 'mexican', name: 'Mexican', icon: '🇲🇽', color: '#CE1126', description: 'Fresh & vibrant' },
];

interface CuisineCategoriesProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CuisineCategories: React.FC<CuisineCategoriesProps> = ({ onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore Cuisines</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
            style={[styles.categoryCard, { backgroundColor: category.color }]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.emoji}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDesc}>{category.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, marginLeft: 16 },
  scrollView: { paddingHorizontal: 16 },
  contentContainer: { gap: 12 },
  categoryCard: {
    borderRadius: 16, padding: 16, minWidth: 140, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  cardContent: { alignItems: 'center', gap: 8 },
  emoji: { fontSize: 32 },
  categoryName: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  categoryDesc: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' },
});
