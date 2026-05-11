import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import s from "@/components/Auth.module.css";
import { apiClient } from "@/lib/api-client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — Polyglot Scribe" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.post("/auth/forgot-password", { email });
      if (!res.success) throw new Error(res.message || "Failed to send reset link");
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

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

        {!sent ? (
          <>
            <h1 className={s.title} style={{ textAlign: "center" }}>Forgot Password?</h1>
            <p className={s.subtitle} style={{ textAlign: "center" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form className={s.form} onSubmit={handleSubmit}>
              <div className={s.field}>
                <label className={s.label}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
                  <input
                    className={s.input}
                    style={{ paddingLeft: "3rem" }}
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className={s.error}>{error}</div>}

              <button className={s.submit} type="submit" disabled={busy}>
                {busy ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(34, 197, 94, 0.1)", color: "rgb(34, 197, 94)", marginBottom: "1.5rem" }}>
              <CheckCircle2 size={48} />
            </div>
            <h1 className={s.title}>Check your email</h1>
            <p className={s.subtitle}>
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <button className={s.submit} onClick={() => setSent(false)} style={{ marginTop: "1rem", background: "var(--muted)", color: "var(--foreground)" }}>
              Resend Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
