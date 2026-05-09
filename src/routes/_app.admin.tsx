import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Shield, ShieldOff, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import s from "@/components/Admin.module.css";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      if (!apiClient.isAuthenticated()) throw redirect({ to: "/auth" });
    }
  },
  head: () => ({ meta: [{ title: "Admin Dashboard — Polyglot Scribe" }] }),
  component: AdminPage,
});

interface UserRow {
  user_id: string;
  display_name: string | null;
  email?: string;
  is_admin: boolean;
  credits: number;
  suspended: boolean;
  feature_live: boolean;
  feature_file: boolean;
  feature_youtube: boolean;
  feature_translate: boolean;
  feature_tts: boolean;
  transcript_count: number;
}

interface HeroImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  active: boolean;
}

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"users" | "hero">("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hero, setHero] = useState<HeroImage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadAll = async () => {
    setLoadingData(true);
    const [usersRes, heroRes] = await Promise.all([
      apiClient.get("/app/admin/users"),
      apiClient.get("/app/hero-images"),
    ]);
    const rows: UserRow[] = (usersRes.data?.users ?? []).map((u: any) => ({
      user_id: u.userId,
      display_name: u.displayName,
      is_admin: u.isAdmin,
      credits: u.credits,
      suspended: u.suspended,
      feature_live: u.featureLive,
      feature_file: u.featureFile,
      feature_youtube: u.featureYoutube,
      feature_translate: u.featureTranslate,
      feature_tts: u.featureTts,
      transcript_count: u.transcriptCount,
    }));
    setUsers(rows);
    setHero(
      (heroRes.data?.items ?? []).map((h: any) => ({
        id: h._id,
        image_url: h.imageUrl,
        caption: h.caption,
        sort_order: h.sortOrder,
        active: h.active,
      })),
    );
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  if (loading) return <div className={s.loading}>{t("admin.loading")}</div>;

  if (!isAdmin) {
    return (
      <div className={s.denied}>
        <Shield size={48} />
        <h1>{t("admin.denied")}</h1>
        <p>{t("admin.deniedDesc")}</p>
        <Link to="/dashboard" className={s.linkBtn}>{t("admin.back")}</Link>
      </div>
    );
  }

  const updateToken = async (userId: string, patch: Partial<UserRow>) => {
    const dbPatch: {
      credits?: number;
      suspended?: boolean;
      feature_live?: boolean;
      feature_file?: boolean;
      feature_youtube?: boolean;
      feature_translate?: boolean;
      feature_tts?: boolean;
    } = {};
    if (patch.credits !== undefined) dbPatch.credits = patch.credits;
    if (patch.suspended !== undefined) dbPatch.suspended = patch.suspended;
    if (patch.feature_live !== undefined) dbPatch.feature_live = patch.feature_live;
    if (patch.feature_file !== undefined) dbPatch.feature_file = patch.feature_file;
    if (patch.feature_youtube !== undefined) dbPatch.feature_youtube = patch.feature_youtube;
    if (patch.feature_translate !== undefined) dbPatch.feature_translate = patch.feature_translate;
    if (patch.feature_tts !== undefined) dbPatch.feature_tts = patch.feature_tts;
    const response = await apiClient.patch(`/app/admin/users/${userId}/tokens`, {
      credits: dbPatch.credits,
      suspended: dbPatch.suspended,
      featureLive: dbPatch.feature_live,
      featureFile: dbPatch.feature_file,
      featureYoutube: dbPatch.feature_youtube,
      featureTranslate: dbPatch.feature_translate,
      featureTts: dbPatch.feature_tts,
    });
    if (!response.success) {
      toast.error(response.message || "Failed to update");
      return;
    }
    setUsers((u) => u.map((r) => (r.user_id === userId ? { ...r, ...patch } : r)));
    toast.success(t("admin.updated"));
  };

  const toggleAdmin = async (row: UserRow) => {
    if (row.is_admin) {
      const response = await apiClient.post(`/app/admin/users/${row.user_id}/toggle-admin`);
      if (!response.success) return toast.error(response.message || "Failed");
      toast.success(t("admin.adminRevoked"));
    } else {
      const response = await apiClient.post(`/app/admin/users/${row.user_id}/toggle-admin`);
      if (!response.success) return toast.error(response.message || "Failed");
      toast.success(t("admin.adminGranted"));
    }
    setUsers((u) => u.map((r) => (r.user_id === row.user_id ? { ...r, is_admin: !r.is_admin } : r)));
  };

  const deleteTranscriptions = async (userId: string) => {
    if (!confirm(t("admin.deleteAllConfirm"))) return;
    const response = await apiClient.delete(`/app/admin/users/${userId}/transcriptions`);
    if (!response.success) return toast.error(response.message || "Failed");
    toast.success(t("admin.transcriptsDeleted"));
    loadAll();
  };

  const addHero = async () => {
    const url = prompt(t("admin.promptUrl"));
    if (!url) return;
    const caption = prompt(t("admin.promptCaption")) ?? "";
    const { success, message } = await apiClient.post("/app/hero-images", {
      imageUrl: url,
      caption: caption || null,
      sortOrder: hero.length + 1,
      active: true,
    });
    if (!success) return toast.error(message || "Failed");
    toast.success(t("admin.imageAdded"));
    loadAll();
  };

  const toggleHero = async (h: HeroImage) => {
    const response = await apiClient.patch(`/app/hero-images/${h.id}`, { active: !h.active });
    if (!response.success) return toast.error(response.message || "Failed");
    setHero((arr) => arr.map((x) => (x.id === h.id ? { ...x, active: !x.active } : x)));
  };

  const saveHeroCaption = async (id: string, caption: string) => {
    const response = await apiClient.patch(`/app/hero-images/${id}`, { caption: caption.trim() || null });
    if (!response.success) return toast.error(response.message || "Failed");
    toast.success(t("admin.captionSaved"));
  };

  const deleteHero = async (id: string) => {
    if (!confirm(t("admin.confirmHeroDelete"))) return;
    const response = await apiClient.delete(`/app/hero-images/${id}`);
    if (!response.success) return toast.error(response.message || "Failed");
    setHero((arr) => arr.filter((x) => x.id !== id));
  };

  return (
    <div className={s.page}>
      <header className={s.topbar}>
        <Link to="/dashboard" className={s.back}>
          <ArrowLeft size={18} /> {t("admin.dashboard")}
        </Link>
        <div className={s.brand}>
          <Shield size={20} /> {t("admin.title")}
        </div>
        <button className={s.signout} onClick={() => signOut()}>{t("admin.signout")}</button>
      </header>

      <div className={s.heroBanner}>
        <div>
          <div className={s.eyebrow}>{t("admin.eyebrow")}</div>
          <h1 className={s.title}>{t("admin.welcome", { email: user?.email })}</h1>
          <p className={s.subtitle}>{t("admin.subtitle")}</p>
        </div>
        <div className={s.statRow}>
          <div className={s.stat}><div className={s.statLabel}>{t("admin.users")}</div><div className={s.statValue}>{users.length}</div></div>
          <div className={s.stat}><div className={s.statLabel}>{t("admin.admins")}</div><div className={s.statValue}>{users.filter((u) => u.is_admin).length}</div></div>
          <div className={s.stat}><div className={s.statLabel}>{t("admin.heroImages")}</div><div className={s.statValue}>{hero.length}</div></div>
        </div>
      </div>

      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === "users" ? s.tabActive : ""}`} onClick={() => setTab("users")}>{t("admin.tabUsers")}</button>
        <button className={`${s.tab} ${tab === "hero" ? s.tabActive : ""}`} onClick={() => setTab("hero")}>{t("admin.tabHero")}</button>
      </div>

      {tab === "users" && (
        <div className={s.card}>
          {loadingData && <div className={s.loading}>{t("admin.loadingUsers")}</div>}
          {!loadingData && users.length === 0 && <div className={s.loading}>{t("admin.noUsers")}</div>}
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t("admin.thUser")}</th>
                  <th>{t("admin.thRole")}</th>
                  <th>{t("admin.thCredits")}</th>
                  <th>{t("admin.thFeatures")}</th>
                  <th>{t("admin.thStatus")}</th>
                  <th>{t("admin.thTranscripts")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className={u.suspended ? s.suspendedRow : ""}>
                    <td>
                      <div className={s.userName}>{u.display_name ?? t("admin.noName")}</div>
                      <div className={s.userId}>{u.user_id.slice(0, 8)}…</div>
                    </td>
                    <td>
                      <button className={u.is_admin ? s.roleAdmin : s.roleUser} onClick={() => toggleAdmin(u)}>
                        {u.is_admin ? t("admin.roleAdmin") : t("admin.roleUser")}
                      </button>
                    </td>
                    <td>
                      <input
                        type="number"
                        className={s.creditInput}
                        value={u.credits}
                        onChange={(e) => setUsers((arr) => arr.map((r) => r.user_id === u.user_id ? { ...r, credits: parseInt(e.target.value) || 0 } : r))}
                        onBlur={(e) => updateToken(u.user_id, { credits: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td>
                      <div className={s.flagRow}>
                        {(["feature_live", "feature_file", "feature_youtube", "feature_translate", "feature_tts"] as const).map((f, i) => (
                          <button
                            key={f}
                            className={`${s.flag} ${u[f] ? s.flagOn : s.flagOff}`}
                            onClick={() => updateToken(u.user_id, { [f]: !u[f] })}
                            title={f}
                          >
                            {["L", "F", "Y", "T", "S"][i]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className={u.suspended ? s.suspended : s.active}
                        onClick={() => updateToken(u.user_id, { suspended: !u.suspended })}
                      >
                        {u.suspended ? <><ShieldOff size={14} /> {t("admin.suspended")}</> : <>{t("admin.active")}</>}
                      </button>
                    </td>
                    <td>{u.transcript_count}</td>
                    <td>
                      <button className={s.danger} onClick={() => deleteTranscriptions(u.user_id)} title="Delete user's transcriptions">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "hero" && (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div>
              <h3>{t("admin.heroTitle")}</h3>
              <p className={s.muted}>{t("admin.heroDesc")}</p>
            </div>
            <button className={s.primary} onClick={addHero}><Plus size={16} /> {t("admin.addImage")}</button>
          </div>
          <div className={s.heroGrid}>
            {hero.length === 0 && (
              <div className={s.empty}>
                <ImageIcon size={32} />
                <p>{t("admin.noHeroImages")}</p>
              </div>
            )}
            {hero.map((h) => (
              <div key={h.id} className={s.heroCard}>
                <div className={s.heroThumb} style={{ backgroundImage: `url(${h.image_url})` }} />
                <div className={s.heroBody}>
                  <label className={s.muted} style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.3rem" }}>
                    {t("admin.caption")}
                  </label>
                  <textarea
                    className={s.creditInput}
                    style={{ width: "100%", minHeight: "60px", marginBottom: "0.6rem", resize: "vertical", fontFamily: "inherit", fontSize: "0.85rem" }}
                    defaultValue={h.caption ?? ""}
                    placeholder={t("admin.captionPlaceholder")}
                    onBlur={(e) => {
                      if ((e.target.value.trim() || null) !== (h.caption ?? null)) {
                        saveHeroCaption(h.id, e.target.value);
                        setHero((arr) => arr.map((x) => x.id === h.id ? { ...x, caption: e.target.value.trim() || null } : x));
                      }
                    }}
                  />
                  <div className={s.heroActions}>
                    <button className={h.active ? s.active : s.suspended} onClick={() => toggleHero(h)}>
                      {h.active ? t("admin.active") : t("admin.hidden")}
                    </button>
                    <button className={s.danger} onClick={() => deleteHero(h.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
