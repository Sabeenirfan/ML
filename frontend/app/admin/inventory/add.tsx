import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createInventoryItem } from "../../../lib/authService";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

const UNITS = ["kg", "g", "L", "mL", "piece", "packet", "box", "bottle"];
const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Meat & Protein",
  "Dairy Products",
  "Grains & Pulses",
  "Beverages",
  "Indian Spices",
  "Pakistani Masalas",
  "International Spices",
  "Herbs & Seasonings",
  "Oils & Fats",
  "Condiments & Sauces",
  "Bakery Items",
  "Snacks",
  "Canned Foods",
  "Frozen Foods",
  "Nuts & Seeds"
];

export default function AddIngredient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("0.00");
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter ingredient name");
      return;
    }

    if (parseFloat(quantity) < 0) {
      Alert.alert("Error", "Quantity cannot be negative");
      return;
    }

    try {
      setLoading(true);
      if (!category.trim()) {
        Alert.alert("Error", "Please select a category");
        return;
      }

      const itemData: any = {
        name: name.trim(),
        category: category.trim(),
        stock: parseFloat(quantity) || 0,
        unit: unit,
        price: parseFloat(price) || 0,
        available: available,
        status: available && parseFloat(quantity) > 0 ? "in_stock" : "out_of_stock",
      };

      if (image) {
        itemData.image = image;
      }

      console.log('[AddIngredient] Saving item with data:', itemData);

      const response = await createInventoryItem(itemData);
      console.log("Item created successfully:", response);
      
      // Show success message and navigate back
      Alert.alert(
        "Success",
        "Ingredient saved successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add ingredient"
      );
    } finally {
      setLoading(false);
    }
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
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Ingredient</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>Tap to change image</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Ingredient Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ingredient Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ingredient name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryText}>{category}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {showCategoryPicker && (
              <View style={styles.categoryPicker}>
                <ScrollView style={styles.categoryScrollView} nestedScrollEnabled={true}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        category === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          category === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Quantity & Unit */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Quantity & Unit</Text>
            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.unitButton}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
              >
                <Text style={styles.unitText}>{unit}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {showUnitPicker && (
              <View style={styles.unitPicker}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitOption,
                      unit === u && styles.unitOptionActive,
                    ]}
                    onPress={() => {
                      setUnit(u);
                      setShowUnitPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        unit === u && styles.unitOptionTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Price</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Availability */}
          <View style={styles.fieldContainer}>
            <View style={styles.availabilityRow}>
              <Text style={styles.label}>Availability</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  {available ? "Available" : "Unavailable"}
                </Text>
                <Switch
                  value={available}
                  onValueChange={setAvailable}
                  trackColor={{ false: "#D1D5DB", true: "#3C2253" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Ingredient</Text>
          )}
        </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#3C2253",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageHint: {
    fontSize: 14,
    color: "#6B7280",
  },
  formSection: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantityRow: {
    flexDirection: "row",
    gap: 12,
  },
  quantityInput: {
    flex: 1,
  },
  unitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 100,
  },
  unitText: {
    fontSize: 16,
    color: "#111827",
    marginRight: 8,
  },
  unitPicker: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 8,
  },
  unitOption: {
    padding: 12,
    borderRadius: 8,
  },
  unitOptionActive: {
    backgroundColor: "#F3F4F6",
  },
  unitOptionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  unitOptionTextActive: {
    color: "#3C2253",
    fontWeight: "600",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryText: {
    fontSize: 16,
    color: "#111827",
  },
  categoryPicker: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 200,
    overflow: "hidden",
  },
  categoryScrollView: {
    padding: 8,
  },
  categoryOption: {
    padding: 12,
    borderRadius: 8,
  },
  categoryOptionActive: {
    backgroundColor: "#F3F4F6",
  },
  categoryOptionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  categoryOptionTextActive: {
    color: "#3C2253",
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#3C2253",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

