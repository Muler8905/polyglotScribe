import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import s from "@/components/Auth.module.css";
import { useAuth } from "@/lib/auth-context";

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
        <button className={s.toggle} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setInfo(null); }}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
