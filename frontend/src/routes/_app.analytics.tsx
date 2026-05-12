import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Shell } from "@/components/Shell";
import { UsageChart } from "@/components/UsageChart";
import { LanguageChart } from "@/components/LanguageChart";
import s from "@/components/Dashboard.module.css";
import { BarChart3, TrendingUp, Clock, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Polyglot Scribe" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useTranslation();

  const stats = [
    { label: "Total Transcribed", value: "128.5 hrs", icon: Clock, trend: "+12%" },
    { label: "Translation Usage", value: "45.2 hrs", icon: Zap, trend: "+8%" },
    { label: "Avg. Accuracy", value: "98.4%", icon: TrendingUp, trend: "+0.5%" },
  ];

  return (
    <Shell>
      <div className={s.container}>
        <header className={s.header}>
          <h1 className={s.welcomeTitle}>System Analytics</h1>
          <p className={s.welcomeSubtitle}>Detailed insights into your transcription and translation performance.</p>
        </header>

        <div className={s.quickActions}>
          {stats.map(stat => (
            <div key={stat.label} className={s.glassCard} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div className={s.cardIcon} style={{ background: 'rgba(255,255,255,0.03)' }}><stat.icon size={24} /></div>
              <div>
                <div className={s.statLabel}>{stat.label}</div>
                <div className={s.statValue}>{stat.value} <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 500 }}>{stat.trend}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className={s.mainGrid}>
          <div className={s.glassCard}>
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>Usage Trends (Last 30 Days)</h2>
            </div>
            <UsageChart />
          </div>

          <div className={s.glassCard}>
            <h2 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>Language Distribution</h2>
            <LanguageChart />
          </div>
        </div>

        <div className={s.glassCard}>
          <h2 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>Advanced Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              <p>Your transcription volume has increased by 15% this month. English remains your most transcribed language (42%), followed by Spanish (25%).</p>
              <p style={{ marginTop: '1rem' }}>Recommendation: You might want to upgrade to a higher tier to save more on long-form file transcriptions.</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
