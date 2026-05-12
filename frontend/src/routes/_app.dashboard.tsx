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
          <h1 className={s.welcomeTitle}>Welcome back, {displayName}!</h1>
          <p className={s.welcomeSubtitle}>Overview of transcringual transcription and translation app.</p>
        </header>

        {activeMode && activeMode !== 'select' ? (
          <div className={s.glassCard}>
            <div className={s.sectionHeader}>
               <h2 className={s.sectionTitle}>{activeMode === 'live' ? 'Live Recording' : activeMode === 'file' ? 'File Upload' : 'YouTube Link'}</h2>
               <button onClick={() => setActiveMode(null)} className={s.cardBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>Back to Dashboard</button>
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
                  <div className={s.cardTitle}>Live Transcription</div>
                  <div className={s.cardDesc}>Start real-time recording</div>
                </div>
                <button className={s.cardBtn} onClick={() => setActiveMode('live')}>
                  <Play size={16} fill="currentColor" /> Start Recording
                </button>
              </div>

              <div className={s.actionCard}>
                <div className={s.cardIcon}><UploadCloud size={24} /></div>
                <div>
                  <div className={s.cardTitle}>File Upload</div>
                  <div className={s.cardDesc}>Supports MP3, WAV, MP4</div>
                </div>
                <button className={s.cardBtn} onClick={() => setActiveMode('file')}>
                  Upload Audio/Video
                </button>
              </div>

              <div className={s.actionCard}>
                <div className={s.cardIcon}><Youtube size={24} /></div>
                <div>
                  <div className={s.cardTitle}>YouTube Link</div>
                  <div className={s.cardDesc}>Transcribe from URL</div>
                </div>
                <button className={s.cardBtn} onClick={() => setActiveMode('youtube')}>
                  Fetch Video
                </button>
              </div>
            </div>

            <div className={s.mainGrid}>
              <div className={s.glassCard}>
                <div className={s.sectionHeader}>
                  <h2 className={s.sectionTitle}>Transcription & Translation Usage</h2>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className={s.statsGrid} style={{ marginBottom: 0 }}>
                      <div className={s.statItem}>
                        <span className={s.statValue} style={{ fontSize: '1rem' }}>14.5k min</span>
                        <span className={s.statLabel} style={{ fontSize: '0.7rem' }}>Transcribed</span>
                      </div>
                    </div>
                    <Link to="/analytics" className={s.cardBtn} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)', fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Details</Link>
                  </div>
                </div>
                <UsageChart />
              </div>

              <div className={s.glassCard}>
                <h2 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>Language Overview</h2>
                <LanguageChart />
              </div>
            </div>

            <div className={s.glassCard}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>Recent Transcription Activity</h2>
                <Link to="/history" className={s.cardBtn} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)' }}>View All</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className={s.activityTable}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Language</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.title}</td>
                        <td>{item.source_lang}/{item.target_lang || 'None'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                        <td><span className={s.statusBadge}>Completed</span></td>
                        <td style={{ color: 'var(--muted-foreground)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)' }}>
                          No recent activity found.
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
