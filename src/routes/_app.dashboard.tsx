import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Sparkles, Coins, Lock } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Transcriber } from "@/components/Transcriber";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import { supabase } from "@/integrations/supabase/client";
import s from "@/components/Dashboard.module.css";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Polyglot Scribe" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [credits, setCredits] = useState<number | null>(null);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_tokens")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCredits(data?.credits ?? 0));
  }, [user, refreshKey]);

  const outOfCredits = credits !== null && credits <= 0;
  const lowCredits = credits !== null && credits > 0 && credits < 10;

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
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
            <Link to="/pricing" className={s.adminLink}>
              <Sparkles size={14} /> Upgrade plan
            </Link>
            {credits !== null && (
              <span className={s.adminLink} style={{ background: lowCredits || outOfCredits ? "color-mix(in oklab, oklch(0.7 0.18 25) 30%, transparent)" : undefined }}>
                <Coins size={14} /> {credits} credits
              </span>
            )}
            {isAdmin && (
              <Link to="/admin" className={s.adminLink}>
                <Shield size={14} /> Admin Console
              </Link>
            )}
          </div>
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

      {outOfCredits ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "3rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Lock size={48} style={{ color: "var(--primary)" }} />
          <h2 style={{ margin: 0 }}>You're out of credits</h2>
          <p style={{ margin: 0, color: "var(--muted-foreground)", maxWidth: "44ch" }}>
            Upgrade to a paid plan to keep transcribing and translating. Plans start at 500 ETB.
          </p>
          <Link
            to="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "10px",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            <Sparkles size={16} /> View plans
          </Link>
        </div>
      ) : (
        <Transcriber onSaved={() => setRefreshKey((k) => k + 1)} />
      )}
    </Shell>
  );
}
