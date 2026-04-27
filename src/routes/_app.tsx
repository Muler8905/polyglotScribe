import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw redirect({ to: "/auth" });
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
