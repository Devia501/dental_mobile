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

    // PENTING: Map data dari database ke key 'avatar' yang dipakai di UI profile.tsx
    // Kita gunakan profile_image_url (jika API mengirim URL lengkap)
    // atau profile_image (sesuai nama kolom DB kamu)
    const userToSave = {
      ...user,
      avatar: user.profile_image_url || user.profile_image || null,
    };

    await SecureStore.setItemAsync("token", data.data.token);
    // Simpan user yang sudah memiliki key 'avatar'
    await SecureStore.setItemAsync("user", JSON.stringify(userToSave));
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
    },
    false,
  );

  return data;
};

export const changeEmail = async (
  current_password: string,
  new_email: string,
) => {
  return await apiRequest(
    "/admin/change-email",
    "PUT",
    { current_password, new_email },
    true,
  );
};

export const changePassword = async (
  current_password: string,
  new_password: string,
  new_password_confirmation: string,
) => {
  return await apiRequest(
    "/admin/change-password",
    "PUT",
    { current_password, new_password, new_password_confirmation },
    true,
  );
};

export const updateProfileImage = async (imageUri: string) => {
  const formData = new FormData();
  const user = await getUser();

  formData.append("_method", "PUT");
  formData.append("name", user?.name || "");
  formData.append("email", user?.email || "");

  const filename = imageUri.split("/").pop();
  const match = /\.(\w+)$/.exec(filename || "");
  const type = match ? `image/${match[1]}` : `image`;

  // SESUAIKAN DENGAN DATABASE (Kolom profile_image)
  formData.append("profile_image", {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  return await apiRequest("/admin/profile", "POST", formData, true);
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
