import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { apiRequest } from "../services/api";

export const useUnreadNotif = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        try {
          const res = await apiRequest(
            "/admin/notifications",
            "GET",
            null,
            true,
          );
          if (res.success) setUnreadCount(res.unread || 0);
        } catch {}
      };
      fetch();
    }, []),
  );

  return unreadCount;
};
