import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Sparkles, Coins, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { initiateChapaPayment } from "@/server/chapa.functions";
import s from "@/components/Pricing.module.css";

export const Route = createFileRoute("/_app/pricing")({
  head: () => ({ meta: [{ title: "Upgrade — Polyglot Scribe" }] }),
  component: PricingPage,
});

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_etb: number;
  credits: number;
  highlight: boolean;
  sort_order: number;
}

interface PaymentRow {
  id: string;
  tx_ref: string;
  amount_etb: number;
  credits_awarded: number;
  status: string;
  created_at: string;
  plan: { name: string } | null;
}

function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [history, setHistory] = useState<PaymentRow[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const initiate = useServerFn(initiateChapaPayment);

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data ?? []) as Plan[]));

    if (user) {
      supabase
        .from("user_tokens")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setCredits(data?.credits ?? 0));
      supabase
        .from("subscription_payments")
        .select("id, tx_ref, amount_etb, credits_awarded, status, created_at, plan:subscription_plans(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => setHistory((data ?? []) as unknown as PaymentRow[]));
    }
  }, [user]);

  const buy = async (slug: string) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoadingPlan(slug);
    try {
      const res = await initiate({ data: { planSlug: slug } });
      window.location.href = res.checkout_url;
    } catch (e) {
      toast.error((e as Error).message);
      setLoadingPlan(null);
    }
  };

  const featuresFor = (p: Plan): string[] => {
    if (p.slug === "starter")
      return [
        `${p.credits} credits`,
        "Live, File & YouTube transcription",
        "All 4 languages",
        "Email support",
      ];
    if (p.slug === "pro")
      return [
        `${p.credits} credits`,
        "Everything in Starter",
        "Priority transcription queue",
        "Speaker diarization",
        "Priority support",
      ];
    return [
      `${p.credits} credits`,
      "Everything in Pro",
      "Highest priority processing",
      "Bulk file uploads",
      "Dedicated support",
    ];
  };

  const lowCredits = credits !== null && credits < 10;

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <Link to="/dashboard" className={s.back}>
          <ArrowLeft size={16} /> Dashboard
        </Link>
        {credits !== null && (
          <span className={`${s.balance} ${lowCredits ? s.balanceLow : ""}`}>
            <Coins size={14} /> {credits} credits left
          </span>
        )}
      </div>

      <header className={s.header}>
        <div className={s.eyebrow}>Pricing</div>
        <h1 className={s.title}>Upgrade your plan</h1>
        <p className={s.subtitle}>
          Pay securely in Ethiopian Birr via Chapa (Telebirr, CBE Birr, Cards). Credits never expire.
        </p>
      </header>

      <div className={s.grid}>
        {plans.map((p) => (
          <div key={p.id} className={`${s.card} ${p.highlight ? s.cardHighlight : ""}`}>
            {p.highlight && <div className={s.popular}>Most Popular</div>}
            <h3 className={s.planName}>{p.name}</h3>
            <p className={s.planDesc}>{p.description}</p>
            <div className={s.priceRow}>
              <span className={s.price}>{p.price_etb.toLocaleString()}</span>
              <span className={s.currency}>ETB</span>
            </div>
            <div className={s.creditLine}>
              <span className={s.creditCount}>{p.credits.toLocaleString()}</span> credits
            </div>
            <ul className={s.featureList}>
              {featuresFor(p).map((f) => (
                <li key={f} className={s.featureItem}>
                  <Check size={16} className={s.featureIcon} /> {f}
                </li>
              ))}
            </ul>
            <button
              className={s.cta}
              onClick={() => buy(p.slug)}
              disabled={loadingPlan === p.slug}
            >
              {loadingPlan === p.slug ? "Redirecting…" : (
                <>
                  <Sparkles size={16} /> Get {p.name}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <p className={s.note}>
        Secure payments powered by Chapa · Refunds processed within 7 business days
      </p>

      {history.length > 0 && (
        <div className={s.history}>
          <h2 className={s.historyTitle}>Payment history</h2>
          <table className={s.historyTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Credits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td>{h.plan?.name ?? "—"}</td>
                  <td>{h.amount_etb} ETB</td>
                  <td>{h.credits_awarded || "—"}</td>
                  <td>
                    <span
                      className={`${s.statusBadge} ${
                        h.status === "success" ? s.statusSuccess :
                        h.status === "pending" ? s.statusPending : s.statusFailed
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
