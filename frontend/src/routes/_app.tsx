import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Shell } from "@/components/Shell";
import { AnimatePresence, motion } from "framer-motion";

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
  const matches = useRouterState({ select: (s) => s.matches });
  const match = matches[matches.length - 1];
  const pathname = match ? match.pathname : "/";

  if (loading) return null;
  if (!user) return null;

  return (
    <Shell>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}
