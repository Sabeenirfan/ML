import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getInventory, InventoryItem, deleteInventoryItem } from "../../lib/authService";

export default function InventoryManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading inventory... Category:", selectedCategory, "Search:", searchQuery);
      const response = await getInventory(
        selectedCategory === "all" ? undefined : selectedCategory,
        searchQuery || undefined
      );
      console.log("Inventory loaded:", response.items?.length || 0, "items");
      setInventoryItems(response.items || []);
      setCategories(response.categories || []);
    } catch (err: any) {
      console.error("Failed to load inventory:", err);
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  // Load inventory when screen comes into focus (after add/edit/delete)
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - reloading inventory");
      loadInventory();
    }, [loadInventory])
  );

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadInventory();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "#10B981";
      case "low_stock":
        return "#F59E0B";
      case "out_of_stock":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_stock":
        return "Available";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  const handleEdit = (item: InventoryItem) => {
    router.push({
      pathname: "/admin/inventory/edit",
      params: { id: item._id || item.id || "" },
    });
  };

  const handleDelete = (item: InventoryItem) => {
    const itemId = item._id || item.id;
    
    console.log("=== DELETE FUNCTION CALLED ===");
    console.log("Item object:", JSON.stringify(item, null, 2));
    console.log("Item ID extracted:", itemId);
    console.log("Item _id:", item._id);
    console.log("Item id:", item.id);
    
    if (!itemId) {
      console.error("ERROR: No ID found!");
      Alert.alert("Error", "Item ID is missing. Cannot delete item.");
      return;
    }

    console.log("Showing delete confirmation for:", item.name, "ID:", itemId);

    Alert.alert(
      "Delete Ingredient",
      `Are you sure you want to delete "${item.name}"?\\n\\nID: ${itemId}\\n\\nThis action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("User cancelled delete");
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("=== DELETE CONFIRMED ===");
              console.log("Deleting item with ID:", itemId);
              console.log("Calling API: DELETE /api/admin/inventory/" + itemId);
              
              setLoading(true);
              
              const result = await deleteInventoryItem(itemId);
              console.log("Delete API SUCCESS:", result);
              
              // Update UI immediately
              setInventoryItems((prevItems) => prevItems.filter((i) => (i._id || i.id) !== itemId));
              
              await loadInventory();
              
              Alert.alert("Success", "Ingredient deleted successfully");
            } catch (error: any) {
              console.error("=== DELETE ERROR ===");
              console.error("Error:", error);
              console.error("Response:", error.response?.data);
              
              Alert.alert("Delete Failed", error.response?.data?.message || error.message || "Failed to delete");
              await loadInventory();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            console.log("Back button pressed - navigating to dashboard");
            router.push("/admin/dashboard");
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Inventory</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.bulkUploadButton}
            onPress={() => router.push("/admin/inventory/bulkUpload")}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push("/admin/inventory/add")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === "all" && styles.categoryChipActive,
              ]}
              onPress={() => handleCategorySelect("all")}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === "all" && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Items Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {inventoryItems.length} {selectedCategory !== "all" ? `${selectedCategory} ` : ""}
            item{inventoryItems.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3C2253" />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadInventory}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Inventory List */
          <View style={styles.inventoryContainer}>
            {inventoryItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No items match your search"
                    : selectedCategory !== "all"
                    ? `No items in ${selectedCategory}`
                    : "No items found"}
                </Text>
              </View>
            ) : (
              inventoryItems.map((item) => {
                const itemId = item._id || item.id || '';
                return (
                <View 
                  key={itemId} 
                  style={styles.itemCard}
                >
                  <View style={styles.itemInfo}>
                    <View style={styles.itemImageContainer}>
                      {item.image ? (
                        <Image 
                          source={{ uri: item.image }} 
                          style={styles.itemImage}
                          onError={(e) => console.log("Image load error for", item.name, ":", e.nativeEvent.error)}
                          onLoad={() => console.log("Image loaded successfully for", item.name)}
                        />
                      ) : (
                        <View style={styles.itemImagePlaceholder}>
                          <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>
                        {item.stock} {item.unit}
                      </Text>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status ?? "active") === "#10B981" ? "#D1FAE5" : getStatusColor(item.status ?? "active") === "#F59E0B" ? "#FEF3C7" : "#FEE2E2" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(item.status ?? "active") },
                            ]}
                          >
                            {getStatusText(item.status ?? "active")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => {
                        console.log("Edit button pressed for:", item.name);
                        handleEdit(item);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil-outline" size={20} color="#3C2253" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        console.log("=== DELETE BUTTON PRESSED ===");
                        console.log("Item:", item.name);
                        console.log("Item _id:", item._id);
                        console.log("Item id:", item.id);
                        const itemId = item._id || item.id;
                        console.log("Using itemId:", itemId);
                        
                        if (!itemId) {
                          Alert.alert("Error", "Item ID is missing. Cannot delete this item.");
                          console.error("ERROR: No ID found for item:", JSON.stringify(item, null, 2));
                          return;
                        }
                        
                        console.log("Calling handleDelete function...");
                        handleDelete(item);
                      }}
                      activeOpacity={0.6}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <Ionicons name="trash-outline" size={24} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
                );
              })
            )}
          </View>
        )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulkUploadButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  addButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 12,
  },
  inventoryContainer: {
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#3C2253",
    borderColor: "#3C2253",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  countContainer: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#3C2253",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 8,
  },
});

