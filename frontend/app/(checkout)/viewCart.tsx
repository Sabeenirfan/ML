import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "../../contexts/CartContext";

const CartScreen: React.FC = () => {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();

  const deliveryFee: number = 0;
  const total: number = getTotalPrice() + deliveryFee;
  const itemCount = getTotalItems();

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    router.push("/checkoutSummary");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => router.push('/home')}
        >
          <Ionicons name="home-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartIconContainer}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items Header */}
        <View style={styles.cartHeader}>
          <Ionicons name="cart-outline" size={18} color="#5A3D7A" />
          <Text style={styles.cartHeaderText}>Cart Items ({itemCount})</Text>
        </View>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={64} color="#8B7BA8" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.shopButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Image
                  source={{
                    uri: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                  }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemHeaderLeft}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.priceText}>Rs {item.price.toFixed(2)}</Text>
                    </View>
                  </View>
                  {item.category && (
                    <Text style={styles.categoryText}>{item.category}</Text>
                  )}
                  {item.freshness && (
                    <Text style={styles.freshnessText}>{item.freshness}</Text>
                  )}
                  {item.isOrganic && (
                    <View style={styles.organicBadge}>
                      <Ionicons name="leaf-outline" size={12} color="#4CAF50" />
                      <Text style={styles.organicText}>Organic</Text>
                    </View>
                  )}
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#5A3D7A" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color="#5A3D7A" />
                    </TouchableOpacity>
                    <Text style={styles.itemTotal}>
                      Rs {(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <View style={styles.summaryHeader}>
                <Ionicons name="receipt-outline" size={18} color="#5A3D7A" />
                <Text style={styles.summaryTitle}>Order Summary</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
                <Text style={styles.summaryValue}>Rs {getTotalPrice().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.deliveryRow}>
                  <Ionicons name="bicycle-outline" size={16} color="#8B7BA8" />
                  <Text style={styles.summaryLabel}>Delivery</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {deliveryFee === 0 ? "FREE" : `Rs ${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>Rs {total.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleProceedToCheckout}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Text style={styles.checkoutPrice}>RS {total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#5A3D7A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    marginLeft: 16,
  },
  headerIcon: {
    padding: 4,
    marginRight: 12,
  },
  cartIconContainer: { position: "relative" },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  scrollView: { flex: 1, backgroundColor: "#F5F3F7" },
  scrollContent: { paddingBottom: 100 },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  cartHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5A3D7A",
    marginLeft: 8,
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 16,
    color: "#8B7BA8",
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#5A3D7A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
  },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemHeaderLeft: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A3F",
    marginBottom: 2,
  },
  priceText: { fontSize: 14, fontWeight: "600", color: "#5A3D7A" },
  categoryText: { fontSize: 13, color: "#6B5B7F", marginBottom: 2 },
  freshnessText: { fontSize: 12, color: "#8B7BA8", marginBottom: 4 },
  organicBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#E8F5E9",
    marginBottom: 8,
  },
  organicText: {
    fontSize: 11,
    color: "#4CAF50",
    marginLeft: 4,
    fontWeight: "500",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F5F3F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5DFF0",
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A3F",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5A3D7A",
    marginLeft: "auto",
  },
  orderSummary: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5A3D7A",
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: "#6B5B7F", marginLeft: 4 },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#2C1A3F" },
  deliveryRow: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: "#E5DFF0", marginVertical: 8 },
  totalRow: { marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#2C1A3F" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#5A3D7A" },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5DFF0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutButton: {
    backgroundColor: "#5A3D7A",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkoutText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  checkoutPrice: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default CartScreen;

