import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { User, Lock, CreditCard, Settings as SettingsIcon } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import s from "@/components/Dashboard.module.css";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Polyglot Scribe" }] }),
  component: SettingsPage,
});

type Tab = "profile" | "account" | "billing" | "preferences";

function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("profile");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiClient.get("/app/profile").then((res) => {
      if (!res.success) return;
      setDisplayName(res.data?.profile?.displayName ?? "");
      setAvatarUrl(res.data?.profile?.avatarUrl ?? "");
      setCredits(res.data?.tokens?.credits ?? 0);
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const response = await apiClient.put("/app/profile", { displayName, avatarUrl: avatarUrl || null });
    setSavingProfile(false);
    if (!response.success) toast.error(response.message || t("settings.failUpdate"));
    else toast.success(t("settings.profileUpdated"));
  };

  const changePassword = async () => {
    if (pwd.length < 6) return toast.error(t("settings.passwordTooShort"));
    if (pwd !== pwd2) return toast.error(t("settings.passwordMismatch"));
    setSavingPwd(true);
    const response = await apiClient.put("/app/password", { password: pwd });
    setSavingPwd(false);
    if (!response.success) toast.error(response.message || t("settings.failPassword"));
    else { toast.success(t("settings.passwordUpdated")); setPwd(""); setPwd2(""); }
  };

  const card: React.CSSProperties = {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
    padding: "1.5rem",
  };
  const input: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.8rem", borderRadius: 9,
    border: "1px solid var(--input)", background: "var(--background)",
    color: "var(--foreground)", fontSize: "0.95rem",
  };
  const btn: React.CSSProperties = {
    padding: "0.6rem 1.2rem", borderRadius: 9, border: "none",
    background: "var(--gradient-primary)", color: "var(--primary-foreground)",
    fontWeight: 600, cursor: "pointer",
  };
  const label: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 500, marginBottom: "0.3rem", display: "block" };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: t("settings.tabProfile"), icon: <User size={16} /> },
    { id: "account", label: t("settings.tabAccount"), icon: <Lock size={16} /> },
    { id: "billing", label: t("settings.tabBilling"), icon: <CreditCard size={16} /> },
    { id: "preferences", label: t("settings.tabPreferences"), icon: <SettingsIcon size={16} /> },
  ];

  const sectionHeader = (title: string, desc: string) => (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: 0 }}>{title}</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "0.88rem", margin: "0.25rem 0 0" }}>{desc}</p>
    </div>
  );

  return (
    <>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>{t("settings.title")}</h1>

        <div className={s.settingsGrid}>
          <nav className={s.settingsNav}>
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.65rem 0.85rem", borderRadius: 9, border: "none",
                  background: tab === tb.id ? "var(--muted)" : "transparent",
                  color: "var(--foreground)", fontSize: "0.92rem",
                  fontWeight: tab === tb.id ? 600 : 500, cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {tb.icon} {tb.label}
              </button>
            ))}
          </nav>

          <div style={{ minWidth: 0 }}>
            {tab === "profile" && (
              <div style={card}>
                {sectionHeader(t("settings.profileHeading"), t("settings.profileDesc"))}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1.6rem" }}>
                      {(displayName || user?.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{displayName || t("settings.unnamed")}</div>
                    <div style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>{user?.email}</div>
                  </div>
                </div>
                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={label}>{t("settings.displayName")}</label>
                  <input style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={label}>{t("settings.avatarUrl")}</label>
                  <input style={input} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
                </div>
                <button style={btn} onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? t("settings.saving") : t("settings.saveProfile")}
                </button>
              </div>
            )}

            {tab === "account" && (
              <div style={card}>
                {sectionHeader(t("settings.accountHeading"), t("settings.accountDesc"))}
                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={label}>{t("settings.newPassword")}</label>
                  <input style={input} type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={label}>{t("settings.confirmPassword")}</label>
                  <input style={input} type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
                </div>
                <button style={btn} onClick={changePassword} disabled={savingPwd}>
                  {savingPwd ? t("settings.updating") : t("settings.updatePassword")}
                </button>
              </div>
            )}

            {tab === "billing" && (
              <div style={card}>
                {sectionHeader(t("settings.creditsHeading"), "")}
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", marginBottom: "1.25rem" }}>
                  <Trans
                    i18nKey="settings.creditsDesc"
                    values={{ credits: credits ?? "…" }}
                    components={[<strong style={{ color: "var(--foreground)" }} />]}
                  />
                </p>
                <Link to="/pricing" style={{ ...btn, display: "inline-block", textDecoration: "none" }}>
                  {t("settings.viewPlans")}
                </Link>
              </div>
            )}

            {tab === "preferences" && (
              <div style={card}>
                {sectionHeader(t("settings.prefsHeading"), t("settings.prefsDesc"))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t("settings.language")}</div>
                  </div>
                  <LanguageSwitcher />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 0" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t("settings.theme")}</div>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
