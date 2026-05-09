import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    apiClient
      .get("/app/profile")
      .then((res) => {
        setIsAdmin((res.data?.roles ?? []).includes("admin"));
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => setChecking(false));
  }, [user, loading]);

  return { isAdmin, loading: loading || checking };
}
