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

type OrderStatus = "Delivered" | "Processing" | "Cancelled" | "Pending";

interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  statusColor: string;
  items: number;
  amount: number;
  deliveryDate: string;
  products: string[];
  trackable?: boolean;
}

interface Stats {
  totalOrders: number;
  delivered: number;
  totalSpent: number;
}

const OrderHistoryScreen: React.FC = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<string>("All Orders");

  const tabs: string[] = ["All Orders", "Delivered", "Processing", "Pending"];

  const stats: Stats = {
    totalOrders: 7,
    delivered: 4,
    totalSpent: 9025,
  };

  const orders: Order[] = [
    {
      id: "ORD-2024-12547",
      date: "October 2, 2025",
      status: "Delivered",
      statusColor: "#4CAF50",
      items: 8,
      amount: 1395,
      deliveryDate: "Delivered on October 3, 2025",
      products: ["Bananas", "Fresh Milk", "Whole Wheat Bread", "+5 more"],
    },
    {
      id: "ORD-2024-12546",
      date: "September 28, 2025",
      status: "Processing",
      statusColor: "#FF9800",
      items: 5,
      amount: 850,
      deliveryDate: "Expected delivery: October 4, 2025",
      products: ["Apples", "Chicken Breast", "Brown Rice"],
      trackable: true,
    },
    {
      id: "ORD-2024-12545",
      date: "September 25, 2025",
      status: "Delivered",
      statusColor: "#4CAF50",
      items: 12,
      amount: 2150,
      deliveryDate: "Delivered on September 26, 2025",
      products: ["Salmon Fillet", "Avocados", "Quinoa", "+9 more"],
    },
    {
      id: "ORD-2024-12544",
      date: "September 20, 2025",
      status: "Cancelled",
      statusColor: "#F44336",
      items: 4,
      amount: 650,
      deliveryDate: "Order was cancelled",
      products: ["Pasta", "Tomato Sauce", "Mozzarella", "+1 more"],
    },
  ];

  const getStatusIcon = (
    status: OrderStatus
  ): React.ComponentProps<typeof Ionicons>["name"] => {
    switch (status) {
      case "Delivered":
        return "checkmark-circle";
      case "Processing":
        return "time";
      case "Cancelled":
        return "close-circle";
      default:
        return "alert-circle";
    }
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
        <Text style={styles.headerTitle}>Order History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.delivered}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Rs. {stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Orders List */}
        {orders.map((order) => (
          <TouchableOpacity key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderLeft}>
                <Ionicons name="receipt-outline" size={16} color="#8B7BA8" />
                <Text style={styles.orderId}>{order.id}</Text>
              </View>
              <Text style={styles.orderAmount}>Rs. {order.amount}</Text>
            </View>
            <View style={styles.orderMeta}>
              <View style={styles.orderMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="#8B7BA8" />
                <Text style={styles.orderMetaText}>{order.date}</Text>
              </View>
              <View style={styles.orderMetaItem}>
                <Text style={styles.itemCount}>{order.items} items</Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <Ionicons
                name={getStatusIcon(order.status)}
                size={16}
                color={order.statusColor}
              />
              <Text style={[styles.statusText, { color: order.statusColor }]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.deliveryDate}>{order.deliveryDate}</Text>
            <View style={styles.productsContainer}>
              {order.products.map((product, index) => (
                <View key={index} style={styles.productTag}>
                  <Text style={styles.productText}>{product}</Text>
                </View>
              ))}
            </View>
            {order.trackable && (
              <TouchableOpacity style={styles.trackButton}>
                <Text style={styles.trackButtonText}>Track Order →</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.viewDetailsButton}>
              <Ionicons name="chevron-forward" size={20} color="#8B7BA8" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#5A3D7A" },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, color: "#fff", fontWeight: "600" },
  tabsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DFF0",
  },
  tabsContent: { paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  tabActive: { backgroundColor: "#5A3D7A" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#6B5B7F" },
  tabTextActive: { color: "#fff" },
  scrollView: { flex: 1, backgroundColor: "#F5F3F7" },
  scrollContent: { padding: 16 },
  statsCard: {
    flexDirection: "row",
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
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C1A3F",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#8B7BA8" },
  statDivider: { width: 1, backgroundColor: "#E5DFF0", marginHorizontal: 8 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    position: "relative",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderHeaderLeft: { flexDirection: "row", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: "600", color: "#2C1A3F", marginLeft: 6 },
  orderAmount: { fontSize: 16, fontWeight: "700", color: "#5A3D7A" },
  orderMeta: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  orderMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  orderMetaText: { fontSize: 13, color: "#8B7BA8", marginLeft: 4 },
  itemCount: { fontSize: 13, color: "#8B7BA8" },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: { fontSize: 14, fontWeight: "600", marginLeft: 6 },
  deliveryDate: { fontSize: 13, color: "#6B5B7F", marginBottom: 12 },
  productsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  productTag: {
    backgroundColor: "#F8F6FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  productText: { fontSize: 12, color: "#5A3D7A", fontWeight: "500" },
  trackButton: { alignSelf: "flex-start", marginTop: 4 },
  trackButtonText: { fontSize: 13, fontWeight: "600", color: "#5A3D7A" },
  viewDetailsButton: { position: "absolute", top: 16, right: 16 },
});

export default OrderHistoryScreen;

