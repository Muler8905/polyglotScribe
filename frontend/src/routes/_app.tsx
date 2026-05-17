import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      if (!apiClient.isAuthenticated()) throw redirect({ to: "/auth" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) return null;
  return <Outlet />;
}
