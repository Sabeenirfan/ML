import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="inventory/add" />
      <Stack.Screen name="inventory/edit" />
    </Stack>
  );
}


