import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield, Sparkles, Coins, Lock, Mic,
  UploadCloud, Youtube, Play, ArrowUpRight
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { Transcriber } from "@/components/Transcriber";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import s from "@/components/Dashboard.module.css";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { UsageChart } from "@/components/UsageChart";
import { LanguageChart } from "@/components/LanguageChart";
import { useServerFn } from "@tanstack/react-start";
import { listTranscriptions } from "@/serverFns/transcription.functions";

export const Route = createFileRoute("/_app/dashboard")({
  validateSearch: (search: Record<string, unknown>): { mode?: string } => ({
    mode: search.mode as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Dashboard — Polyglot Scribe" }] }),
  component: Dashboard,
});

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  source_lang: string;
  target_lang: string;
  created_at: string;
}

function Dashboard() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [credits, setCredits] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const listFn = useServerFn(listTranscriptions);
  const { mode } = Route.useSearch();
  const [activeMode, setActiveMode] = useState<string | null>(mode || null);

  useEffect(() => {
    if (mode) setActiveMode(mode);
  }, [mode]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Alex";

  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/app/profile")
      .then((r) => setCredits(r.data?.tokens?.credits ?? 0))
      .catch((e) => {
        setCredits(0);
        console.error(e);
      });

    listFn()
      .then((r: any) => setHistory(r.items?.slice(0, 5) || []))
      .catch(console.error);
  }, [user, refreshKey]);

  return (
    <Shell refreshKey={refreshKey}>
      <div className={s.container}>
        <header className={s.header}>
          <div className={s.headerInfo}>
            <h1 className={s.welcomeTitle}>{t("dashboard.welcomeUser", { name: displayName })}</h1>
            <p className={s.welcomeSubtitle}>{t("dashboard.overviewDesc")}</p>
          </div>
          {isAdmin && (
            <Link to="/admin" className={s.cardBtn} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--brand-gradient)', color: 'white', border: 'none' }}>
              <Shield size={18} /> Admin Console
            </Link>
          )}
        </header>

        {activeMode && activeMode !== 'select' ? (
          <div className={s.glassCard}>
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>
                {activeMode === 'live' ? t("dashboard.liveTitle") : activeMode === 'file' ? t("dashboard.fileTitle") : t("dashboard.ytTitle")}
              </h2>
              <button onClick={() => setActiveMode(null)} className={s.cardBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                {t("dashboard.backBtn")}
              </button>
            </div>
            <Transcriber initialTab={activeMode as any} onSaved={() => {
              setRefreshKey(k => k + 1);
              setActiveMode(null);
            }} />
          </div>
        ) : (
          <>
            <div className={s.quickActions}>
              <div className={s.actionCard}>
                <div className={s.cardIcon}><Mic size={24} /></div>
                <div>
                  <div className={s.cardTitle}>{t("dashboard.liveTitle")}</div>
                  <div className={s.cardDesc}>{t("dashboard.liveDesc")}</div>
                </div>
                <button className={s.cardBtn} onClick={() => setActiveMode('live')}>
                  <Play size={16} fill="currentColor" /> {t("dashboard.liveBtn")}
                </button>
              </div>

              <div className={s.actionCard}>
                <div className={s.cardIcon}><UploadCloud size={24} /></div>
                <div>
                  <div className={s.cardTitle}>{t("dashboard.fileTitle")}</div>
                  <div className={s.cardDesc}>{t("dashboard.fileDesc")}</div>
                </div>
                <button className={s.cardBtn} onClick={() => setActiveMode('file')}>
                  {t("dashboard.fileBtn")}
                </button>
              </div>

              <div className={s.actionCard}>
                <div className={s.cardIcon}><Youtube size={24} /></div>
                <div>
                  <div className={s.cardTitle}>{t("dashboard.ytTitle")}</div>
                  <div className={s.cardDesc}>{t("dashboard.ytDesc")}</div>
                </div>
                <button className={s.cardBtn} onClick={() => setActiveMode('youtube')}>
                  {t("dashboard.ytBtn")}
                </button>
              </div>
            </div>

            <div className={s.mainGrid}>
              <div className={s.glassCard}>
                <div className={s.sectionHeader}>
                  <h2 className={s.sectionTitle}>{t("dashboard.usageTitle")}</h2>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className={s.statsGrid} style={{ marginBottom: 0 }}>
                      <div className={s.statItem}>
                        <span className={s.statValue} style={{ fontSize: '1rem' }}>14.5k min</span>
                        <span className={s.statLabel} style={{ fontSize: '0.7rem' }}>{t("dashboard.usageTranscribed")}</span>
                      </div>
                    </div>
                    <Link to="/analytics" className={s.cardBtn} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)', fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>{t("dashboard.usageDetails")}</Link>
                  </div>
                </div>
                <UsageChart />
              </div>

              <div className={s.glassCard}>
                <h2 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>{t("dashboard.languages")}</h2>
                <LanguageChart />
              </div>
            </div>

            <div className={s.glassCard}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>{t("dashboard.recentTitle")}</h2>
                <Link to="/history" className={s.cardBtn} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)' }}>{t("dashboard.recentViewAll")}</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className={s.activityTable}>
                  <thead>
                    <tr>
                      <th>{t("dashboard.recentThTitle")}</th>
                      <th>{t("dashboard.recentThLanguage")}</th>
                      <th>{t("dashboard.recentThType")}</th>
                      <th>{t("dashboard.recentThStatus")}</th>
                      <th>{t("dashboard.recentThDate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.title}</td>
                        <td>{item.source_lang}/{item.target_lang || 'None'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                        <td><span className={s.statusBadge}>{t("dashboard.recentCompleted")}</span></td>
                        <td style={{ color: 'var(--muted-foreground)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)' }}>
                          {t("dashboard.recentEmpty")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
