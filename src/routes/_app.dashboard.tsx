import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Sparkles, Coins, Lock } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Transcriber } from "@/components/Transcriber";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import s from "@/components/Dashboard.module.css";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Polyglot Scribe" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [credits, setCredits] = useState<number | null>(null);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dashboard.morning") : hour < 18 ? t("dashboard.afternoon") : t("dashboard.evening");

  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/app/profile")
      .then((r) => setCredits(r.data?.tokens?.credits ?? 0))
      .catch((e) => {
        setCredits(0);
        toast.error(e instanceof Error ? e.message : "Failed to load profile");
      });
  }, [user, refreshKey]);

  const outOfCredits = credits !== null && credits <= 0;
  const lowCredits = credits !== null && credits > 0 && credits < 10;

  return (
    <Shell refreshKey={refreshKey}>
      <header className={s.hero}>
        <div className={s.heroText}>
          <div className={s.eyebrow}>{t("dashboard.title")}</div>
          <h1 className={s.title}>
            {greeting}, <span className={s.name}>{displayName}</span> 👋
          </h1>
          <p className={s.subtitle}>{t("dashboard.subtitle")}</p>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
            <Link to="/pricing" className={s.adminLink}>
              <Sparkles size={14} /> {t("dashboard.upgrade")}
            </Link>
            {credits !== null && (
              <span className={s.adminLink} style={{ background: lowCredits || outOfCredits ? "color-mix(in oklab, oklch(0.7 0.18 25) 30%, transparent)" : undefined }}>
                <Coins size={14} /> {t("dashboard.credits", { count: credits })}
              </span>
            )}
            {isAdmin && (
              <Link to="/admin" className={s.adminLink}>
                <Shield size={14} /> {t("dashboard.adminConsole")}
              </Link>
            )}
          </div>
        </div>
        <div className={s.statRow}>
          <div className={s.stat}>
            <div className={s.statLabel}>{t("dashboard.languages")}</div>
            <div className={s.statValue}>4</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>{t("dashboard.modes")}</div>
            <div className={s.statValue}>{t("dashboard.modesValue")}</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>{t("dashboard.engine")}</div>
            <div className={s.statValue}>{t("dashboard.engineValue")}</div>
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
          <h2 style={{ margin: 0 }}>{t("dashboard.outOfCredits")}</h2>
          <p style={{ margin: 0, color: "var(--muted-foreground)", maxWidth: "44ch" }}>
            {t("dashboard.outOfCreditsDesc")}
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
            <Sparkles size={16} /> {t("settings.viewPlans")}
          </Link>
        </div>
      ) : (
        <Transcriber onSaved={() => setRefreshKey((k) => k + 1)} />
      )}
    </Shell>
  );
}
