import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Transcriber } from "@/components/Transcriber";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import s from "@/components/Dashboard.module.css";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Polyglot Scribe" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Shell refreshKey={refreshKey}>
      <header className={s.hero}>
        <div className={s.heroText}>
          <div className={s.eyebrow}>Dashboard</div>
          <h1 className={s.title}>
            {greeting}, <span className={s.name}>{displayName}</span> 👋
          </h1>
          <p className={s.subtitle}>
            Transcribe and translate speech across English, Amharic, Afaan Oromo, and Somali.
          </p>
        </div>
        <div className={s.statRow}>
          <div className={s.stat}>
            <div className={s.statLabel}>Languages</div>
            <div className={s.statValue}>4</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>Modes</div>
            <div className={s.statValue}>Live · File · YouTube</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>Engine</div>
            <div className={s.statValue}>Scribe v2 Realtime</div>
          </div>
        </div>
      </header>

      <Transcriber onSaved={() => setRefreshKey((k) => k + 1)} />
    </Shell>
  );
}
