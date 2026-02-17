import React from "react";
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

const PaymentSuccessScreen = () => {
  const router = useRouter();
  const { getTotalPrice, clearCart } = useCart();

  const orderDetails = {
    orderId: `ORD-2024-${Math.floor(Math.random() * 100000)}`,
    amountPaid: getTotalPrice() + 30,
    transactionDate: new Date().toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }),
    estimatedDelivery: "Tomorrow, 2-4 PM",
  };

  const handleViewOrderHistory = () => {
    clearCart(); // Clear cart after successful payment
    router.push("/orderHistory");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/home")}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Successful</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successMessage}>
          Your order has been confirmed and payment processed successfully.
        </Text>

        {/* Order Details Card */}
        <View style={styles.detailsCard}>
          {/* Order ID */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="receipt-outline" size={20} color="#8B7BA8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>{orderDetails.orderId}</Text>
            </View>
          </View>

          {/* Amount Paid */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="card-outline" size={20} color="#8B7BA8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>
                Rs. {orderDetails.amountPaid.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Transaction Date */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#8B7BA8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Transaction Date</Text>
              <Text style={styles.detailValue}>
                {orderDetails.transactionDate}
              </Text>
            </View>
          </View>

          {/* Estimated Delivery */}
          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.truckEmoji}>🚚</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Estimated Delivery</Text>
              <Text style={styles.detailValue}>
                {orderDetails.estimatedDelivery}
              </Text>
            </View>
          </View>
        </View>

        {/* View Order History Button */}
        <TouchableOpacity
          style={styles.orderHistoryButton}
          onPress={handleViewOrderHistory}
        >
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.orderHistoryButtonText}>View Order History</Text>
        </TouchableOpacity>

        {/* Confirmation Note */}
        <View style={styles.confirmationNote}>
          <Ionicons name="mail-outline" size={14} color="#8B7BA8" />
          <Text style={styles.confirmationText}>
            Confirmation email sent to your registered email
          </Text>
        </View>
      </ScrollView>
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
    padding: 24,
    alignItems: "center",
  },
  successIconContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#5A3D7A",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#5A3D7A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C1A3F",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 15,
    color: "#6B5B7F",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  lastDetailRow: {
    marginBottom: 0,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F6FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  truckEmoji: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: "#8B7BA8",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#2C1A3F",
    fontWeight: "600",
    lineHeight: 20,
  },
  orderHistoryButton: {
    width: "100%",
    backgroundColor: "#5A3D7A",
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#5A3D7A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  orderHistoryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  confirmationNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  confirmationText: {
    fontSize: 12,
    color: "#8B7BA8",
    marginLeft: 6,
    textAlign: "center",
  },
});

export default PaymentSuccessScreen;

