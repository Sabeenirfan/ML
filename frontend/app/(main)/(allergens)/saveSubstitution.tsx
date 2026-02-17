import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../../contexts/CartContext';

interface Substitution {
  id: number;
  image: string;
  name: string;
  tag: string;
  description: string;
  allergyInfo: string;
  lactoseInfo: string;
  action: string;
  isSeparator?: boolean;
}

export default function SaveSubstitution() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealTitle = params.mealTitle as string || "Recipe";
  const [selectedSubstitutions, setSelectedSubstitutions] = useState<number[]>([]);
  const { addToCart, cartItems, getTotalItems } = useCart();

  const substitutions: Substitution[] = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
      name: "Almond Milk",
      tag: "High in Vitamin E",
      description: "Creamy, nutty alternative perfect for cereals and baking",
      allergyInfo: "dairy-free",
      lactoseInfo: "lactose-free",
      action: "Replace",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400",
      name: "Oat Milk",
      tag: "High in Fiber",
      description: "Smooth and naturally sweet with fiber benefits",
      allergyInfo: "dairy-free",
      lactoseInfo: "lactose-free",
      action: "Replace",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1569288063643-5d29ad64df09?w=400",
      name: "Replace Gluten (Wheat Flour)",
      tag: "",
      description: "",
      allergyInfo: "dairy-free",
      lactoseInfo: "",
      action: "",
      isSeparator: true,
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400",
      name: "Rice Flour",
      tag: "Low in Gluten",
      description: "Light, neutral flavor ideal for gluten-free baking",
      allergyInfo: "gluten-free",
      lactoseInfo: "wheat-free",
      action: "Replace",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1612783064162-0a1796ed4bfa?w=400",
      name: "Coconut Flour",
      tag: "High in Protein & Fiber",
      description: "Low-carb, high-fiber flour with subtle coconut taste",
      allergyInfo: "gluten-free",
      lactoseInfo: "coconut-free",
      action: "Replace",
    },
  ];

  const handleToggleSubstitution = (id: number) => {
    if (substitutions.find((s) => s.id === id)?.isSeparator) return;
    setSelectedSubstitutions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplySubstitutions = () => {
    if (selectedSubstitutions.length === 0) {
      Alert.alert("No Selection", "Please select at least one substitution");
      return;
    }

    Alert.alert(
      "Success",
      "Substitutions are successfully added.",
      [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to Recipe Details
            router.back();
          },
        },
      ]
    );
  };

  const handleAddToCart = () => {
    if (selectedSubstitutions.length === 0) {
      Alert.alert('No Selection', 'Please select at least one substitution');
      return;
    }

    // Add selected substitutions to cart (avoid duplicates)
    let added = 0;
    selectedSubstitutions.forEach((id) => {
      const substitution = substitutions.find((s) => s.id === id);
      if (substitution) {
        const itemId = `sub-${substitution.id}`;
        const exists = cartItems.some((c) => c.id === itemId);
        if (!exists) {
          addToCart({ id: itemId, name: substitution.name, price: 0, image: substitution.image });
          added += 1;
        }
      }
    });

    Alert.alert('Added', added > 0 ? `${added} substitution(s) added to your cart` : 'Selected substitution(s) already in cart', [
      { text: 'OK', onPress: () => router.push('/viewCart') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Allergens Substitutions</Text>
          <Text style={styles.headerSubtitle}>
            Replace allergens with safe, healthy alternatives
          </Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/viewCart')}>
          <Feather name="shopping-cart" size={20} color="#fff" />
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
        contentContainerStyle={styles.scrollContent}
      >
        {/* Alert Box */}
        <View style={styles.alertBox}>
          <View style={styles.alertHeader}>
            <Feather name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.alertTitle}>2 Allergens Found</Text>
          </View>
          <Text style={styles.alertText}>
            We've found 4 safe alternatives to help you enjoy this recipe
          </Text>
        </View>

        {/* Replace Dairy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionEmoji}>🥛</Text>
            </View>
            <Text style={styles.sectionTitle}>Replace Dairy (Milk)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Safe alternatives below</Text>

          {/* Substitution Cards */}
          {substitutions
            .filter((s) => !s.isSeparator && s.id <= 2)
            .map((substitution) => {
              const isSelected = selectedSubstitutions.includes(substitution.id);
              return (
                <TouchableOpacity
                  key={substitution.id}
                  style={[
                    styles.substitutionCard,
                    isSelected && styles.substitutionCardSelected,
                  ]}
                  onPress={() => handleToggleSubstitution(substitution.id)}
                >
                  <Image
                    source={{ uri: substitution.image }}
                    style={styles.substitutionImage}
                  />
                  <View style={styles.substitutionInfo}>
                    <View style={styles.substitutionHeader}>
                      <Text style={styles.substitutionName}>
                        {substitution.name}
                      </Text>
                      {substitution.tag && (
                        <View style={styles.tagBadge}>
                          <Feather name="zap" size={10} color="#DC2626" />
                          <Text style={styles.tagText}>{substitution.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.substitutionDescription}>
                      {substitution.description}
                    </Text>
                    <View style={styles.badgesRow}>
                      <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>
                          {substitution.allergyInfo}
                        </Text>
                      </View>
                      <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>
                          {substitution.lactoseInfo}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Feather name="check" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Replace Gluten Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionEmoji}>🌾</Text>
            </View>
            <Text style={styles.sectionTitle}>Replace Gluten (Wheat Flour)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Safe alternatives below</Text>

          {/* Substitution Cards */}
          {substitutions
            .filter((s) => !s.isSeparator && s.id >= 4)
            .map((substitution) => {
              const isSelected = selectedSubstitutions.includes(substitution.id);
              return (
                <TouchableOpacity
                  key={substitution.id}
                  style={[
                    styles.substitutionCard,
                    isSelected && styles.substitutionCardSelected,
                  ]}
                  onPress={() => handleToggleSubstitution(substitution.id)}
                >
                  <Image
                    source={{ uri: substitution.image }}
                    style={styles.substitutionImage}
                  />
                  <View style={styles.substitutionInfo}>
                    <View style={styles.substitutionHeader}>
                      <Text style={styles.substitutionName}>
                        {substitution.name}
                      </Text>
                      {substitution.tag && (
                        <View style={styles.tagBadge}>
                          <Feather name="zap" size={10} color="#DC2626" />
                          <Text style={styles.tagText}>{substitution.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.substitutionDescription}>
                      {substitution.description}
                    </Text>
                    <View style={styles.badgesRow}>
                      <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>
                          {substitution.allergyInfo}
                        </Text>
                      </View>
                      <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>
                          {substitution.lactoseInfo}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Feather name="check" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Apply Substitutions Button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApplySubstitutions}
        >
          <Text style={styles.applyButtonText}>Apply Substitutions</Text>
        </TouchableOpacity>

        {/* Add to Cart Button (adds selected substitutions to cart) */}
        <TouchableOpacity
          style={[styles.applyButton, { marginTop: 12 }]}
          onPress={handleAddToCart}
        >
          <Text style={styles.applyButtonText}>Add to Cart ({selectedSubstitutions.length})</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#3C2253",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  cartButton: {
    padding: 6,
    marginRight: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#E9D5FF",
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  alertBox: {
    backgroundColor: "#FEE2E2",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
  },
  alertText: {
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 18,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#DC2626",
    paddingHorizontal: 16,
    marginBottom: 12,
    fontWeight: "500",
  },
  substitutionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  substitutionCardSelected: {
    borderColor: "#3C2253",
    backgroundColor: "#F0EFFF",
  },
  substitutionImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  substitutionInfo: {
    flex: 1,
  },
  substitutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
    flexWrap: "wrap",
  },
  substitutionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#DC2626",
  },
  substitutionDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  infoBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  infoBadgeText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "600",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3C2253",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#3C2253",
  },
  applyButton: {
    backgroundColor: "#3C2253",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 8,
  },
});

