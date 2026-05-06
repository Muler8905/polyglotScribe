import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Sparkles, Coins, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { initiateChapaPayment, initiateEbirrPayment, verifyChapaPayment } from "@/server/chapa.functions";
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
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [history, setHistory] = useState<PaymentRow[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [method, setMethod] = useState<"chapa" | "ebirr">("chapa");
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

  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  const openPlan = (p: Plan) => {
    if (!user) {
      toast.error(t("pricing.signinFirst"));
      return;
    }
    setMethod("chapa");
    setPendingPlan(p);
  };

  const buy = async () => {
    if (!user || !pendingPlan) return;
    const slug = pendingPlan.slug;
    setLoadingPlan(slug);
    try {
      const res = await initiate({ data: { planSlug: slug, paymentMethod: method } });
      window.location.href = res.checkout_url;
    } catch (e) {
      toast.error((e as Error).message);
      setLoadingPlan(null);
    }
  };

  const featuresFor = (p: Plan): string[] => {
    if (p.slug === "starter")
      return [
        t("pricing.feat.credits", { count: p.credits }),
        t("pricing.feat.all3"),
        t("pricing.feat.all4"),
        t("pricing.feat.email"),
      ];
    if (p.slug === "pro")
      return [
        t("pricing.feat.credits", { count: p.credits }),
        t("pricing.feat.everyStarter"),
        t("pricing.feat.priority"),
        t("pricing.feat.diariz"),
        t("pricing.feat.prioritySupport"),
      ];
    return [
      t("pricing.feat.credits", { count: p.credits }),
      t("pricing.feat.everyPro"),
      t("pricing.feat.highest"),
      t("pricing.feat.bulk"),
      t("pricing.feat.dedicated"),
    ];
  };

  const lowCredits = credits !== null && credits < 10;

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <Link to="/dashboard" className={s.back}>
          <ArrowLeft size={16} /> {t("pricing.back")}
        </Link>
        {credits !== null && (
          <span className={`${s.balance} ${lowCredits ? s.balanceLow : ""}`}>
            <Coins size={14} /> {t("pricing.balance", { count: credits })}
          </span>
        )}
      </div>

      <header className={s.header}>
        <div className={s.eyebrow}>{t("pricing.eyebrow")}</div>
        <h1 className={s.title}>{t("pricing.title")}</h1>
        <p className={s.subtitle}>{t("pricing.subtitle")}</p>
      </header>


      <div className={s.grid}>
        {plans.map((p) => (
          <div key={p.id} className={`${s.card} ${p.highlight ? s.cardHighlight : ""}`}>
            {p.highlight && <div className={s.popular}>{t("pricing.popular")}</div>}
            <h3 className={s.planName}>{p.name}</h3>
            <p className={s.planDesc}>{p.description}</p>
            <div className={s.priceRow}>
              <span className={s.price}>{p.price_etb.toLocaleString()}</span>
              <span className={s.currency}>ETB</span>
            </div>
            <div className={s.creditLine}>
              <span className={s.creditCount}>{p.credits.toLocaleString()}</span> {t("pricing.credits")}
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
              onClick={() => openPlan(p)}
              disabled={loadingPlan === p.slug}
            >
              {loadingPlan === p.slug ? t("pricing.redirecting") : (
                <>
                  <Sparkles size={16} /> {t("pricing.get", { name: p.name })}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <p className={s.note}>{t("pricing.note")}</p>

      {history.length > 0 && (
        <div className={s.history}>
          <h2 className={s.historyTitle}>{t("pricing.historyTitle")}</h2>
          <table className={s.historyTable}>
            <thead>
              <tr>
                <th>{t("pricing.thDate")}</th>
                <th>{t("pricing.thPlan")}</th>
                <th>{t("pricing.thAmount")}</th>
                <th>{t("pricing.thCredits")}</th>
                <th>{t("pricing.thStatus")}</th>
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

      {pendingPlan && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => loadingPlan === null && setPendingPlan(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)", color: "var(--foreground)",
              borderRadius: "16px", padding: "1.75rem", maxWidth: "420px", width: "100%",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 50px -10px rgba(0,0,0,0.4)",
            }}
          >
            <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.2rem", fontWeight: 700 }}>
              {t("pricing.choosePayment", { defaultValue: "Choose payment method" })}
            </h3>
            <p style={{ margin: "0 0 1.25rem", color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
              {pendingPlan.name} — {pendingPlan.price_etb.toLocaleString()} ETB
            </p>

            <div role="radiogroup" style={{ display: "grid", gap: "0.6rem", marginBottom: "1.25rem" }}>
              {(["chapa", "ebirr"] as const).map((m) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethod(m)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.7rem",
                      padding: "0.85rem 1rem", borderRadius: "12px",
                      border: active ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "color-mix(in oklab, var(--primary) 12%, transparent)" : "var(--background)",
                      color: "var(--foreground)",
                      cursor: "pointer", textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    {m === "ebirr" ? <Smartphone size={18} /> : <Coins size={18} />}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{m === "chapa" ? t("pricing.methodChapa") : t("pricing.methodEbirr")}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--muted-foreground)" }}>
                        {m === "chapa"
                          ? t("pricing.methodChapaDesc", { defaultValue: "Cards, bank transfer, mobile wallets" })
                          : t("pricing.methodEbirrDesc", { defaultValue: "Pay with Telebirr / e-Birr wallet" })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPendingPlan(null)}
                disabled={loadingPlan !== null}
                style={{
                  padding: "0.65rem 1.1rem", borderRadius: "9px",
                  border: "1px solid var(--border)", background: "var(--background)",
                  color: "var(--foreground)", cursor: "pointer", fontWeight: 500,
                }}
              >
                {t("pricing.cancel", { defaultValue: "Cancel" })}
              </button>
              <button
                type="button"
                onClick={buy}
                disabled={loadingPlan !== null}
                className={s.cta}
                style={{ minWidth: "140px" }}
              >
                {loadingPlan ? t("pricing.redirecting") : (
                  <>
                    <Sparkles size={16} /> {t("pricing.continue", { defaultValue: "Continue" })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
