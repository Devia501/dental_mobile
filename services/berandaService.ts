import { apiRequest } from "./api";

export const getDashboard = async () => {
  return await apiRequest("/admin/dashboard", "GET", null, true);
};

export const getPasienHariIni = async () => {
  const today = new Date().toISOString().split("T")[0];
  return await apiRequest(
    `/admin/reservations?date=${today}&status=validated`,
    "GET",
    null,
    true,
  );
};

export const getReservationStats = async () => {
  return await apiRequest(
    "/admin/dashboard/reservation-stats",
    "GET",
    null,
    true,
  );
};
