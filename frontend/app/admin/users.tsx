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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getAllUsers, User, deleteUser, getProfile, AuthUser } from "../../lib/authService";
import { MealVista } from "../../constants/theme";

export default function UserManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load users when screen comes into focus (after delete)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadUsers();
      }
    }, [])
  );

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const profileResponse = await getProfile();
      setCurrentUser(profileResponse.user);
    } catch (err) {
      console.error("Failed to load current user:", err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();
      setUsers(response.users || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // Filter users by email only (as requested)
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async (user: User) => {
    const userId = user._id || user.id || '';
    const currentUserId = currentUser?.id || '';
    
    // Prevent admin from deleting themselves
    if (userId === currentUserId) {
      Alert.alert("Cannot Delete", "You cannot delete your own account.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }

    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.name} (${user.email})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('Deleting user with ID:', userId);
              await deleteUser(userId);
              await loadUsers();
              Alert.alert("Success", "User deleted successfully");
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert("Error", error.response?.data?.message || error.message || "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MealVista.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={MealVista.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.placeholder} />
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
            placeholder="Search by email..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Users Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            Total Users: {users.length} {searchQuery && `(${filteredUsers.length} filtered)`}
          </Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={MealVista.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Users List */
          <View style={styles.usersContainer}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No users match your search" : "No users found"}
                </Text>
              </View>
            ) : (
              filteredUsers.map((user) => (
                <View key={user._id || user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.userBadges}>
                        <View
                          style={[
                            styles.badge,
                            (user.role === "admin" || user.isAdmin) ? styles.badgeAdmin : styles.badgeUser,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              (user.role === "admin" || user.isAdmin) ? styles.badgeTextAdmin : styles.badgeTextUser,
                            ]}
                          >
                            {(user.role === "admin" || user.isAdmin) ? "ADMIN" : "USER"}
                          </Text>
                        </View>
                        {user.createdAt && (
                          <Text style={styles.dateText}>
                            Joined: {formatDate(user.createdAt)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(user)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={22} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
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
    backgroundColor: MealVista.primary,
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
  placeholder: {
    width: 40,
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
  usersContainer: {
    gap: 12,
  },
  userCard: {
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MealVista.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAdmin: {
    backgroundColor: "#FEE2E2",
  },
  badgeUser: {
    backgroundColor: "#DBEAFE",
  },
  badgeActive: {
    backgroundColor: "#D1FAE5",
  },
  badgeInactive: {
    backgroundColor: "#F3F4F6",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  badgeTextAdmin: {
    color: "#DC2626",
  },
  badgeTextUser: {
    color: "#2563EB",
  },
  badgeTextActive: {
    color: "#059669",
  },
  badgeTextInactive: {
    color: "#6B7280",
  },
  actionButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
    minHeight: 40,
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
    backgroundColor: MealVista.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 8,
  },
});

