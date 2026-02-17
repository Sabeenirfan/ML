import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "../../contexts/CartContext";

const CheckoutSummaryScreen = () => {
  const router = useRouter();
  const { cartItems, getTotalPrice } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("card");

  const subtotal = getTotalPrice();
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;
  const itemCount = cartItems.length;

  const deliveryInfo = {
    address: "125 Green Street, Sector 15",
    city: "Noida, UP 201301",
    estimatedTime: "Tomorrow, 2-4 PM",
  };

  const handleProceedToPayment = () => {
    router.push("/paymentMethod");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Summary</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={18} color="#5A3D7A" />
            <Text style={styles.cardTitle}>Your Order ({itemCount} items)</Text>
          </View>
          {cartItems.map((item, index) => (
            <View key={item.id}>
              <View style={styles.orderItem}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>Rs. {(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              {index < cartItems.length - 1 && <View style={styles.itemDivider} />}
            </View>
          ))}

          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>Rs. {deliveryFee}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Address:</Text>
            <Text style={styles.infoValue}>{deliveryInfo.address}</Text>
            <Text style={styles.infoValue}>{deliveryInfo.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Delivery:</Text>
            <Text style={styles.infoValue}>{deliveryInfo.estimatedTime}</Text>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setSelectedPayment("card")}
          >
            <View style={styles.radioButton}>
              {selectedPayment === "card" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Ionicons
              name="card-outline"
              size={20}
              color="#5A3D7A"
              style={styles.paymentIcon}
            />
            <Text style={styles.paymentText}>Credit/Debit Card</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToPayment}
        >
          <Text style={styles.proceedButtonText}>
            Proceed to Payment • Rs. {total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5A3D7A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F3F7",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5A3D7A",
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: "#2C1A3F",
    fontWeight: "500",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: "#8B7BA8",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A3F",
    marginLeft: 16,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#F0EDF5",
  },
  summarySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5DFF0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B5B7F",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C1A3F",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5DFF0",
    marginVertical: 10,
  },
  totalRow: {
    marginBottom: 0,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1A3F",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5A3D7A",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A3F",
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B5B7F",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    color: "#2C1A3F",
    lineHeight: 20,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#5A3D7A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#5A3D7A",
  },
  paymentIcon: {
    marginRight: 8,
  },
  paymentText: {
    fontSize: 15,
    color: "#2C1A3F",
    fontWeight: "500",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#6B5B7F",
    marginLeft: 6,
    flex: 1,
  },
  buttonContainer: {
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
  proceedButton: {
    backgroundColor: "#5A3D7A",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default CheckoutSummaryScreen;

