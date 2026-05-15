import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard,
  ChevronLeft
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { verifyChapaPayment } from "@/serverFns/chapa.functions";
import s from "@/components/Pricing.module.css";

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    tx_ref: (search.tx_ref as string) ?? "",
  }),
  head: () => ({ meta: [{ title: "Payment — Polyglot Scribe" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { tx_ref } = useSearch({ from: "/payment/success" });
  const verify = useServerFn(verifyChapaPayment);
  const [state, setState] = useState<"checking" | "success" | "failed" | "pending">("checking");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (!tx_ref) {
      setState("failed");
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await verify({ data: { tx_ref } });
        if (cancelled) return;
        if (res.status === "success") {
          setCredits(res.credits_awarded);
          setState("success");
          return;
        }
        if (res.status === "failed") {
          setState("failed");
          return;
        }
        if (attempts < 10) setTimeout(poll, 2500);
        else setState("pending");
      } catch (err) {
        console.error("Verification error:", err);
        if (!cancelled) setState("failed");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [tx_ref, verify]);

  return (
    <div className={s.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={s.successBox}>
        {state === "checking" && (
          <>
            <Loader2 size={48} className={s.successIcon} style={{ animation: "spin 1s linear infinite" }} />
            <h1>Confirming your payment…</h1>
            <p>Please wait while we verify the transaction with Chapa.</p>
          </>
        )}
        {state === "success" && (
          <>
            <div className={s.successIconWrapper}>
              <CheckCircle2 size={64} className={s.successIcon} />
            </div>
            <h1 className={s.successTitle}>Payment Successful! 🎉</h1>
            <p className={s.successMessage}>
              We've successfully processed your payment. 
              <strong>{credits.toLocaleString()} credits</strong> have been added to your account.
            </p>
            <div className={s.successActions}>
              <Link to="/dashboard" className={s.cta}>
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}
        {state === "pending" && (
          <>
            <Loader2 size={48} className={s.successIcon} />
            <h1>Payment is processing</h1>
            <p>This can take a moment. Your credits will appear once Chapa confirms the payment.</p>
            <Link to="/dashboard" className={s.ctaSecondary}>
              Back to dashboard
            </Link>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle size={56} style={{ color: "oklch(0.55 0.18 25)", marginBottom: "1rem" }} />
            <h1>Payment not completed</h1>
            <p>The transaction was cancelled or failed. You can try again any time.</p>
            <Link to="/pricing" className={s.cta}>
              Try again
            </Link>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .${s.successIconWrapper} {
          background: oklch(0.95 0.05 150);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .${s.successTitle} {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--foreground);
        }
        .${s.successMessage} {
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto 2rem !important;
        }
        .${s.successActions} {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}
