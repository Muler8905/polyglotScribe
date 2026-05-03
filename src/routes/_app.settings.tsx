import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Polyglot Scribe" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setAvatarUrl(data?.avatar_url ?? "");
      });
    supabase.from("user_tokens").select("credits").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setCredits(data?.credits ?? 0));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, display_name: displayName, avatar_url: avatarUrl || null }, { onConflict: "user_id" });
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (pwd.length < 6) return toast.error("Password must be at least 6 characters");
    if (pwd !== pwd2) return toast.error("Passwords do not match");
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setPwd(""); setPwd2(""); }
  };

  const card: React.CSSProperties = {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
    padding: "1.5rem", marginBottom: "1.25rem",
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

  return (
    <Shell>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Settings</h1>

      <div style={card}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Profile</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1.5rem" }}>
              {(displayName || user?.email || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600 }}>{displayName || "Unnamed"}</div>
            <div style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>{user?.email}</div>
          </div>
        </div>
        <div style={{ marginBottom: "0.85rem" }}>
          <label style={label}>Display name</label>
          <input style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={label}>Avatar URL (optional)</label>
          <input style={input} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </div>
        <button style={btn} onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Credits</h2>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", marginBottom: "1rem" }}>
          You have <strong style={{ color: "var(--foreground)" }}>{credits ?? "…"}</strong> credits remaining.
          New accounts start with 60 free credits. Each transcription minute, translation, or TTS request uses credits.
          Top up anytime from the Pricing page.
        </p>
        <Link to="/pricing" style={{ ...btn, display: "inline-block", textDecoration: "none" }}>View plans</Link>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Change password</h2>
        <div style={{ marginBottom: "0.85rem" }}>
          <label style={label}>New password</label>
          <input style={input} type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={label}>Confirm new password</label>
          <input style={input} type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        </div>
        <button style={btn} onClick={changePassword} disabled={savingPwd}>
          {savingPwd ? "Updating…" : "Update password"}
        </button>
      </div>
    </Shell>
  );
}
