import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "../constants/config";

export const apiRequest = async (
  endpoint: string,
  method: string = "GET",
  body: object | null = null,
  useToken: boolean = true,
) => {
  const token = useToken ? await SecureStore.getItemAsync("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  return response.json();
};
