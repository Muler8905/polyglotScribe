import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
    { label: t("analytics.statTotal"), value: "128.5 hrs", icon: Clock, trend: "+12%" },
    { label: t("analytics.statTranslation"), value: "45.2 hrs", icon: Zap, trend: "+8%" },
    { label: t("analytics.statAccuracy"), value: "98.4%", icon: TrendingUp, trend: "+0.5%" },
  ];

  return (
    <>
      <div className={s.container}>
        <header className={s.header}>
          <h1 className={s.welcomeTitle}>{t("analytics.title")}</h1>
          <p className={s.welcomeSubtitle}>{t("analytics.subtitle")}</p>
        </header>

        <div className={s.quickActions}>
          {stats.map(stat => (
            <div key={stat.label} className={s.glassCard} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div className={stat.label === t("analytics.statTotal") ? s.cardIcon : s.cardIcon} style={{ background: 'rgba(255,255,255,0.03)' }}><stat.icon size={24} /></div>
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
              <h2 className={s.sectionTitle}>{t("analytics.usageTrends")}</h2>
            </div>
            <UsageChart />
          </div>

          <div className={s.glassCard}>
            <h2 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>{t("analytics.langDist")}</h2>
            <LanguageChart />
          </div>
        </div>

        <div className={s.glassCard}>
          <h2 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>{t("analytics.insightsTitle")}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              <p>{t("analytics.insightsDesc")}</p>
              <p style={{ marginTop: '1rem' }}>{t("analytics.insightsRec")}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
