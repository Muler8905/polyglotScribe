import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Sparkles, Coins, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { initiateChapaPayment, initiateEbirrPayment, verifyChapaPayment, verifyEbirrPayment, deletePaymentHistory } from "@/serverFns/chapa.functions";
import s from "@/components/Pricing.module.css";
import { apiClient } from "@/lib/api-client";

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
  const [phone, setPhone] = useState("");
  const [ebirrStatus, setEbirrStatus] = useState<null | { tx_ref: string; message: string; state: "waiting" | "success" | "failed" }>(null);
  const initiate = useServerFn(initiateChapaPayment);
  const initiateEbirr = useServerFn(initiateEbirrPayment);
  const verify = useServerFn(verifyChapaPayment);
  const verifyEbirr = useServerFn(verifyEbirrPayment);
  const deleteHistory = useServerFn(deletePaymentHistory);

  useEffect(() => {
    apiClient.get("/billing/plans").then((res) => {
      const data = res.data?.plans ?? [];
      setPlans(
        data.map((p: any) => ({
          id: p._id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          price_etb: p.priceEtb,
          credits: p.credits,
          highlight: p.highlight,
          sort_order: p.sortOrder,
        })),
      );
    });

    if (user) {
      apiClient.get("/app/profile").then((r) => setCredits(r.data?.tokens?.credits ?? 0));
      apiClient.get("/billing/payments").then((r) => {
        const items = (r.data?.items ?? []).map((h: any) => ({
          id: h._id,
          tx_ref: h.txRef,
          amount_etb: h.amountEtb,
          credits_awarded: h.creditsAwarded,
          status: h.status,
          created_at: h.createdAt,
          plan: h.planId ? { name: h.planId.name } : null,
        }));
        setHistory(items);
      });
    }
  }, [user]);

  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  const openPlan = (p: Plan) => {
    if (!user) {
      toast.error(t("pricing.signinFirst"));
      return;
    }
    setMethod("chapa");
    setPhone("");
    setEbirrStatus(null);
    setPendingPlan(p);
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm(t("pricing.confirmDelete"))) return;
    try {
      await deleteHistory({ data: { id } });
      setHistory(h => h.filter(item => item.id !== id));
      toast.success(t("pricing.deleteSuccess"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const buy = async () => {
    if (!user || !pendingPlan) return;
    const slug = pendingPlan.slug;
    setLoadingPlan(slug);
    try {
      if (method === "ebirr") {
        if (!/^(09|07)\d{8}$/.test(phone.trim())) {
          toast.error(t("pricing.phoneInvalid"));
          setLoadingPlan(null);
          return;
        }
        const res = await initiateEbirr({ data: { planSlug: slug, mobile: phone.trim(), type: "ebirr" } });
        setEbirrStatus({ tx_ref: res.tx_ref, message: res.message, state: "waiting" });
        // Poll verify
        let attempts = 0;
        const poll = async () => {
          attempts++;
          try {
            const v = await verifyEbirr({ data: { tx_ref: res.tx_ref } });
            if (v.status === "success") {
              setEbirrStatus({ tx_ref: res.tx_ref, message: t("pricing.ebirrSuccess"), state: "success" });
              setCredits((c) => (c ?? 0) + v.credits_awarded);
              return;
            }
            if (v.status === "failed") {
              setEbirrStatus({ tx_ref: res.tx_ref, message: t("pricing.ebirrFailed"), state: "failed" });
              return;
            }
            if (attempts < 60) setTimeout(poll, 3000);
          } catch {
            if (attempts < 60) setTimeout(poll, 3000);
          }
        };
        setTimeout(poll, 3000);
        setLoadingPlan(null);
      } else {
        const res = await initiate({ data: { planSlug: slug } });
        if (res?.checkout_url) {
          window.location.href = res.checkout_url;
        } else {
          const debugInfo = res?.debug_url ? ` (Target: ${res.debug_url})` : "";
          throw new Error(`Chapa URL missing${debugInfo}. Please check your backend configuration.`);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred while initiating payment.");
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
          <div style={{ overflowX: 'auto' }}>
            <table className={s.historyTable}>
              <thead>
                <tr>
                  <th>{t("pricing.thDate")}</th>
                  <th>{t("pricing.thPlan")}</th>
                  <th>{t("pricing.thAmount")}</th>
                  <th>{t("pricing.thCredits")}</th>
                  <th>{t("pricing.thStatus")}</th>
                  <th></th>
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
                    <td>
                      <button 
                        onClick={() => handleDeleteHistory(h.id)}
                        style={{ 
                          background: "none", border: "none", color: "var(--muted-foreground)",
                          cursor: "pointer", padding: "4px", borderRadius: "4px"
                        }}
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              {t("pricing.choosePayment")}
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
                          ? t("pricing.methodChapaDesc")
                          : t("pricing.methodEbirrDesc")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {method === "ebirr" && !ebirrStatus && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  {t("pricing.phoneLabel")}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="09xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  style={{
                    width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px",
                    border: "1px solid var(--border)", background: "var(--background)",
                    color: "var(--foreground)", fontSize: "0.95rem", fontWeight: 500,
                  }}
                />
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                  {t("pricing.phoneHint")}
                </p>
              </div>
            )}

            {ebirrStatus && (
              <div
                style={{
                  marginBottom: "1.25rem", padding: "0.9rem 1rem", borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: ebirrStatus.state === "success"
                    ? "color-mix(in oklab, oklch(0.6 0.15 150) 14%, transparent)"
                    : ebirrStatus.state === "failed"
                    ? "color-mix(in oklab, oklch(0.6 0.18 25) 14%, transparent)"
                    : "color-mix(in oklab, var(--primary) 10%, transparent)",
                  fontSize: "0.9rem",
                }}
              >
                <strong style={{ display: "block", marginBottom: "0.3rem" }}>
                  {ebirrStatus.state === "success"
                    ? t("pricing.ebirrSuccessTitle")
                    : ebirrStatus.state === "failed"
                    ? t("pricing.ebirrFailedTitle")
                    : t("pricing.ebirrWaitingTitle")}
                </strong>
                <span>{ebirrStatus.message}</span>
              </div>
            )}

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
                {ebirrStatus?.state === "success"
                  ? t("pricing.close")
                  : t("pricing.cancel")}
              </button>
              {ebirrStatus?.state !== "success" && (
                <button
                  type="button"
                  onClick={buy}
                  disabled={loadingPlan !== null || ebirrStatus?.state === "waiting"}
                  className={s.cta}
                  style={{ minWidth: "140px" }}
                >
                  {loadingPlan || ebirrStatus?.state === "waiting"
                    ? t("pricing.redirecting")
                    : (
                      <>
                        <Sparkles size={16} /> {t("pricing.continue")}
                      </>
                    )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
