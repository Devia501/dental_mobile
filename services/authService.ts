import * as SecureStore from "expo-secure-store";
import { apiRequest } from "./api";

export const login = async (email: string, password: string) => {
  const data = await apiRequest(
    "/admin/login",
    "POST",
    { email, password },
    false,
  );

  if (data.success && data.data?.token) {
    const user = data.data.admin;

    // Cek role
    if (user.role !== "rontgen") {
      return { error: "Akun ini tidak memiliki akses ke aplikasi mobile!" };
    }

    await SecureStore.setItemAsync("token", data.data.token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
  }

  return data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  password_confirmation: string,
) => {
  const data = await apiRequest(
    "/admin/register",
    "POST",
    {
      name,
      email,
      password,
      password_confirmation,
      role: "rontgen", // ← otomatis role rontgen saat register dari mobile
    },
    false,
  );

  if (data.token) {
    await SecureStore.setItemAsync("token", data.token);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
  }

  return data;
};

export const logout = async () => {
  try {
    await apiRequest("/admin/logout", "POST");
  } catch (error) {
    console.log("Logout error:", error);
  } finally {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
  }
};

export const getToken = async () => {
  return await SecureStore.getItemAsync("token");
};

export const getUser = async () => {
  const user = await SecureStore.getItemAsync("user");
  return user ? JSON.parse(user) : null;
};
