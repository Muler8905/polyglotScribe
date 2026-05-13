import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock } from "lucide-react";
import s from "@/components/Auth.module.css";
import { useAuth } from "@/lib/auth-context";
import { lovable } from "@/integrations/lovable";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      if (apiClient.isAuthenticated()) throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Sign in — Polyglot Scribe" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, verifyOtp: verifyOtpCode, resendOtp: resendOtpCode, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPopup, setShowForgotPopup] = useState(false);

  const ADMIN_EMAIL = "mulukenugamo7@gmail.com";

  const redirectAfterLogin = async (userEmail?: string) => {
    // Check if user is admin via API
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/app/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const data = await res.json();
      if ((data?.data?.roles ?? []).includes("admin")) {
        nav({ to: "/admin" });
        return;
      }
    } catch (_) {}
    nav({ to: "/dashboard" });
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      try {
        await signInWithGoogle({ accessToken: tokenResponse.access_token });
        await redirectAfterLogin();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Google sign-in failed");
        setBusy(false);
      }
    },
    onError: () => {
      setErr("Google sign-in failed");
      setBusy(false);
    }
  });


  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        await redirectAfterLogin(email);
      } else {
        await signUp(email, password, name);
        setStage("otp");
        setInfo(t("auth.otpDesc", { email }));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
      if (mode === "signin") {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setShowForgotPopup(true);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await verifyOtpCode(email, otp.trim());
      await redirectAfterLogin(email);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("auth.otpInvalid"));
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setErr(null); setInfo(null); setBusy(true);
    try {
      await resendOtpCode(email);
      setInfo(t("auth.otpResent"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to resend");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Link to="/" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem" }}>
            {t("auth.back")}
          </Link>
          <LanguageSwitcher compact />
        </div>
        <div className={s.brand} style={{ justifyContent: "center" }}>
          <div className={s.brandMark} />
          <span className={s.brandName}>Polyglot Scribe</span>
        </div>

        {stage === "otp" ? (
          <>
            <h1 className={s.title} style={{ textAlign: "center" }}>{t("auth.otpTitle")}</h1>
            <p className={s.subtitle} style={{ textAlign: "center" }}>{t("auth.otpDesc", { email })}</p>
            <form className={s.form} onSubmit={verifyOtp}>
              <div className={s.field}>
                <label className={s.label}>{t("auth.otpLabel")}</label>
                <input
                  className={s.input}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "1.4rem", fontWeight: 600 }}
                />
              </div>
              {err && <div className={s.error}>{err}</div>}
              {info && <div className={s.notice}>{info}</div>}
              <button className={s.submit} type="submit" disabled={busy || otp.length < 6}>
                {busy ? t("auth.wait") : t("auth.otpVerify")}
              </button>
            </form>
            <button className={s.toggle} type="button" onClick={resendOtp} disabled={busy}>
              {t("auth.otpResend")}
            </button>
          </>
        ) : (
          <>
            <h1 className={s.title} style={{ textAlign: "center" }}>
              {mode === "signin" ? t("auth.welcome") : t("auth.create")}
            </h1>
            <p className={s.subtitle} style={{ textAlign: "center" }}>
              {mode === "signin" ? t("auth.subSignin") : t("auth.subSignup")}
            </p>

            <form className={s.form} onSubmit={submit}>
              {mode === "signup" && (
                <div className={s.field}>
                  <label className={s.label}>{t("auth.displayName")}</label>
                  <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className={s.field}>
                <label className={s.label}>{t("auth.email")}</label>
                <input className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className={s.field}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label className={s.label}>{t("auth.password")}</label>
                  {mode === "signin" && (
                    <Link to="/forgot-password" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
                      ForgotPassword
                    </Link>
                  )}
                </div>
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
                {busy ? t("auth.wait") : mode === "signin" ? t("auth.signin") : t("auth.signup")}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "1rem 0", color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              {t("auth.or")}
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className={s.submit}
                style={{
                  background: "var(--background)", color: "var(--foreground)",
                  border: "1px solid var(--border)", boxShadow: "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  gap: "0.6rem", margin: "0 auto", width: "100%",
                }}
                disabled={busy}
                onClick={() => {
                  setErr(null);
                  googleLogin();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.5 34.5 26.9 35.5 24 35.5c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.7 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.5 5.5C40.7 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
                {t("auth.google")}
              </button>
            </div>

            <button className={s.toggle} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setInfo(null); }}>
              {mode === "signin" ? t("auth.toggleToSignup") : t("auth.toggleToSignin")}
            </button>
          </>
        )}
      </div>

      {showForgotPopup && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "50%", 
                background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem"
              }}>
                <Lock size={24} />
              </div>
              <h2 className={s.title}>Having trouble signing in?</h2>
              <p className={s.subtitle}>
                You've had multiple failed login attempts. Would you like to reset your password to regain access?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <Link 
                  to="/forgot-password" 
                  className={s.submit} 
                  style={{ textDecoration: "none", textAlign: "center" }}
                  onClick={() => setShowForgotPopup(false)}
                >
                  Reset Password
                </Link>
                <button 
                  type="button" 
                  className={s.toggle} 
                  onClick={() => {
                    setShowForgotPopup(false);
                    setFailedAttempts(0);
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
