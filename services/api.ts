import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "../constants/config";

export const apiRequest = async (
  endpoint: string,
  method: string = "GET",
  body: any = null, // Ganti object menjadi any agar bisa terima FormData
  useToken: boolean = true,
) => {
  const token = useToken ? await SecureStore.getItemAsync("token") : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // PENTING: Jika body BUKAN FormData, baru tambahkan Content-Type JSON
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    method,
    headers,
    // Jika FormData, kirim body langsung. Jika object biasa, stringify.
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  });

  return response.json();
};
