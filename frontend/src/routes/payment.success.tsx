import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import s from "@/components/Pricing.module.css";

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    tx_ref: (search.tx_ref as string) ?? "",
  }),
  head: () => ({ meta: [{ title: "Payment Successful — Polyglot Scribe" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { tx_ref } = useSearch({ from: "/payment/success" });
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
        const res = await apiClient.post('/billing/payments/verify', { txRef: tx_ref });
        
        if (cancelled) return;
        
        if (res.success && res.data?.status === "success") {
          setCredits(res.data.creditsAwarded || 0);
          setState("success");
          return;
        }
        
        if (res.data?.status === "failed") {
          setState("failed");
          return;
        }
        
        if (attempts < 12) {
          setTimeout(poll, 2500);
        } else {
          setState("pending");
        }
      } catch (err) {
        console.error("Verification error:", err);
        if (!cancelled) setState("failed");
      }
    };
    
    poll();
    return () => { cancelled = true; };
  }, [tx_ref]);

  return (
    <div className={s.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={s.successBox}>
        {state === "checking" && (
          <>
            <Loader2 size={48} className={s.successIcon} style={{ animation: "spin 1s linear infinite" }} />
            <h1>Confirming your payment...</h1>
            <p>Please wait while we verify the transaction with Chapa.</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 size={56} className={s.successIcon} />
            <h1>Payment successful! 🎉</h1>
            <p>{credits.toLocaleString()} credits have been added to your account.</p>
            <Link to="/dashboard" className={s.cta} style={{ textDecoration: "none", display: "inline-flex" }}>
              Go to dashboard
            </Link>
          </>
        )}
        {state === "pending" && (
          <>
            <Loader2 size={48} className={s.successIcon} />
            <h1>Payment is processing</h1>
            <p>This can take a moment. Your credits will appear once Chapa confirms the payment.</p>
            <Link to="/dashboard" className={s.cta} style={{ textDecoration: "none", display: "inline-flex" }}>
              Back to dashboard
            </Link>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle size={56} style={{ color: "oklch(0.55 0.18 25)", marginBottom: "1rem" }} />
            <h1>Payment not completed</h1>
            <p>The transaction was cancelled or failed. You can try again any time.</p>
            <Link to="/pricing" className={s.cta} style={{ textDecoration: "none", display: "inline-flex" }}>
              Try again
            </Link>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
