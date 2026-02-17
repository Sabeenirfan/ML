import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "../../../contexts/CartContext";
import { postAllergenAlternatives } from "../../../lib/api";

function parseIngredientsParam(param: unknown): string[] {
  if (Array.isArray(param)) {
    return param.map((i) => (typeof i === "string" ? i : String(i)));
  }
  if (typeof param === "string") {
    try {
      const parsed = JSON.parse(param);
      return Array.isArray(parsed)
        ? parsed.map((i: unknown) => (typeof i === "string" ? i : String(i)))
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function SeeAllergens() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getTotalItems } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAllergens, setApiAllergens] = useState<{ ingredient: string; allergenType: string }[]>([]);
  const [apiAlternatives, setApiAlternatives] = useState<{ original: string; alternative: string; allergen: string }[]>([]);

  const mealTitle = (params.mealTitle as string) || "Recipe";
  const mealImage = (params.mealImage as string) || "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800";
  const ingredientsList = useMemo(() => parseIngredientsParam(params.ingredients), [params.ingredients]);

  useEffect(() => {
    let cancelled = false;
    if (!mealTitle || ingredientsList.length === 0) {
      setLoading(false);
      setApiAllergens([]);
      setApiAlternatives([]);
      return;
    }
    setLoading(true);
    setError(null);
    postAllergenAlternatives(mealTitle, ingredientsList)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setApiAllergens(res.allergens || []);
          setApiAlternatives(res.alternatives || []);
          setError(null);
        } else {
          setError(res.message || "Could not load alternatives.");
          setApiAllergens([]);
          setApiAlternatives([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load alternatives.");
        setApiAllergens([]);
        setApiAlternatives([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mealTitle, ingredientsList.length]);

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
        <Text style={styles.headerTitle}>Recipe Allergens</Text>
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
        {/* Recipe Card */}
        <View style={styles.recipeCard}>
          <Image source={{ uri: mealImage }} style={styles.recipeImage} />
        </View>

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{mealTitle}</Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3C2253" />
            <Text style={styles.loadingText}>Loading allergen info…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Detected Allergens */}
            <View style={styles.allergenAlert}>
              <View style={styles.allergenAlertHeader}>
                <Feather name="alert-triangle" size={18} color="#DC2626" />
                <Text style={styles.allergenAlertText}>Detected Allergens</Text>
              </View>
            </View>
            <View style={styles.allergensList}>
              {apiAllergens.length === 0 ? (
                <Text style={styles.emptyText}>No common allergens detected in this recipe.</Text>
              ) : (
                apiAllergens.map((a, idx) => (
                  <View key={`${a.ingredient}-${idx}`} style={styles.allergenCard}>
                    <View style={styles.allergenIconContainer}>
                      <Feather name="alert-circle" size={24} color="#BE123C" />
                    </View>
                    <View style={styles.allergenContent}>
                      <Text style={styles.allergenName}>{a.ingredient}</Text>
                      <Text style={styles.allergenDescription}>{a.allergenType}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* AI-suggested replacements */}
            {apiAlternatives.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>AI-suggested replacements</Text>
                <View style={styles.allergensList}>
                  {apiAlternatives.map((alt, idx) => (
                    <View key={`${alt.original}-${idx}`} style={styles.altCard}>
                      <Text style={styles.altText}>
                        Instead of <Text style={styles.altBold}>{alt.original}</Text> you can use <Text style={styles.altBold}>{alt.alternative}</Text>
                        {alt.allergen ? ` (${alt.allergen})` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {!loading && !error && ingredientsList.length === 0 && (
          <Text style={styles.emptyText}>No ingredients were provided for this recipe.</Text>
        )}

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
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    marginLeft: 16,
  },
  headerSpacer: {
    width: 32,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  recipeCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  recipeImage: {
    width: "100%",
    height: 180,
  },
  recipeInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  recipeDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  allergenAlert: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
    padding: 12,
    borderRadius: 8,
  },
  allergenAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  allergenAlertText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#991B1B",
  },
  allergensList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  allergenCard: {
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  allergenIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
  },
  allergenEmoji: {
    fontSize: 24,
  },
  allergenContent: {
    flex: 1,
  },
  allergenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  allergenName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#BE123C",
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },
  allergenDescription: {
    fontSize: 13,
    color: "#9F1239",
    lineHeight: 18,
  },
  loadingBox: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
  },
  emptyText: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  altCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  altText: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
  },
  altBold: {
    fontWeight: "600",
  },
  ingredientsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  ingredientCardSelected: {
    borderColor: "#3C2253",
    backgroundColor: "#F0EFFF",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3C2253",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#3C2253",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  ingredientCategory: {
    fontSize: 13,
    color: "#6B7280",
  },
  ingredientPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C2253",
  },
  addToCartButton: {
    backgroundColor: "#3C2253",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addToCartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  substitutionsButton: {
    backgroundColor: "#3C2253",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  substitutionsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 8,
  },
});

