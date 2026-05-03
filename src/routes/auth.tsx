import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import s from "@/components/Auth.module.css";
import { useAuth } from "@/lib/auth-context";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Sign in — Polyglot Scribe" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        nav({ to: "/dashboard" });
      } else {
        await signUp(email, password, name);
        setInfo("Account created! You can now sign in (check your email if confirmation is enabled).");
        setMode("signin");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <Link to="/" style={{ display: "inline-block", color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "1rem" }}>
          ← Back to home
        </Link>
        <div className={s.brand}>
          <div className={s.brandMark} />
          <span className={s.brandName}>Polyglot Scribe</span>
        </div>
        <h1 className={s.title}>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className={s.subtitle}>
          {mode === "signin" ? "Sign in to access your transcription history." : "Start transcribing in seconds."}
        </p>

        <form className={s.form} onSubmit={submit}>
          {mode === "signup" && (
            <div className={s.field}>
              <label className={s.label}>Display name</label>
              <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          {err && <div className={s.error}>{err}</div>}
          {info && <div className={s.notice}>{info}</div>}
          <button className={s.submit} type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "1rem 0", color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          OR
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          type="button"
          className={s.submit}
          style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)", boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
          disabled={busy}
          onClick={async () => {
            setErr(null); setBusy(true);
            try {
              const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard` });
              if (r.error) throw r.error;
              if (!r.redirected) nav({ to: "/dashboard" });
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Google sign-in failed");
              setBusy(false);
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.5 34.5 26.9 35.5 24 35.5c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.7 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.5 5.5C40.7 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
          Continue with Google
        </button>

        <button className={s.toggle} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setInfo(null); }}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
