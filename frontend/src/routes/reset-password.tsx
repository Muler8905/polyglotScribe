import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import s from "@/components/Auth.module.css";
import { apiClient } from "@/lib/api-client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Reset Password — Polyglot Scribe" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const nav = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    setError(null);
    
    try {
      const res = await apiClient.post("/auth/reset-password", { 
        token, 
        newPassword: password 
      });
      
      if (!res.success) throw new Error(res.message || "Failed to reset password");
      
      setSuccess(true);
      setTimeout(() => {
        nav({ to: "/auth" });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. The link might be expired.");
    } finally {
      setBusy(false);
    }
  };

  if (!token && !success) {
    return (
      <div className={s.wrap}>
        <div className={s.card}>
          <div className={s.brand} style={{ justifyContent: "center" }}>
            <div className={s.brandMark} />
            <span className={s.brandName}>Polyglot Scribe</span>
          </div>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <h1 className={s.title}>Invalid Link</h1>
            <p className={s.subtitle}>
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className={s.submit} style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Link to="/auth" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ArrowLeft size={16} /> {t("auth.backToSignin") || "Back to Sign In"}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <div className={s.brand} style={{ justifyContent: "center" }}>
          <div className={s.brandMark} />
          <span className={s.brandName}>Polyglot Scribe</span>
        </div>

        {!success ? (
          <>
            <h1 className={s.title} style={{ textAlign: "center" }}>Reset Password</h1>
            <p className={s.subtitle} style={{ textAlign: "center" }}>
              Please enter your new password below.
            </p>

            <form className={s.form} onSubmit={handleSubmit}>
              <div className={s.field}>
                <label className={s.label}>New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
                  <input
                    className={s.input}
                    style={{ paddingLeft: "3rem", paddingRight: "3rem" }}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
                  <input
                    className={s.input}
                    style={{ paddingLeft: "3rem" }}
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && <div className={s.error}>{error}</div>}

              <button className={s.submit} type="submit" disabled={busy}>
                {busy ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(34, 197, 94, 0.1)", color: "rgb(34, 197, 94)", marginBottom: "1.5rem" }}>
              <CheckCircle2 size={48} />
            </div>
            <h1 className={s.title}>Password Reset Successful</h1>
            <p className={s.subtitle}>
              Your password has been reset successfully. You will be redirected to the login page in a few seconds...
            </p>
            <Link to="/auth" className={s.submit} style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: "1rem" }}>
              Go to Login Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
