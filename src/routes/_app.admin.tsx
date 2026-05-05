import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Shield, ShieldOff, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import s from "@/components/Admin.module.css";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw redirect({ to: "/auth" });
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
    const [profilesRes, rolesRes, tokensRes, txCountRes, heroRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_tokens").select("*"),
      supabase.from("transcriptions").select("user_id"),
      supabase.from("hero_images").select("*").order("sort_order"),
    ]);
    const adminIds = new Set((rolesRes.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const tokenMap = new Map((tokensRes.data ?? []).map((t) => [t.user_id, t]));
    const counts = new Map<string, number>();
    (txCountRes.data ?? []).forEach((t) => counts.set(t.user_id, (counts.get(t.user_id) ?? 0) + 1));
    const rows: UserRow[] = (profilesRes.data ?? []).map((p) => {
      const t = tokenMap.get(p.user_id);
      return {
        user_id: p.user_id,
        display_name: p.display_name,
        is_admin: adminIds.has(p.user_id),
        credits: t?.credits ?? 0,
        suspended: t?.suspended ?? false,
        feature_live: t?.feature_live ?? true,
        feature_file: t?.feature_file ?? true,
        feature_youtube: t?.feature_youtube ?? true,
        feature_translate: t?.feature_translate ?? true,
        feature_tts: t?.feature_tts ?? true,
        transcript_count: counts.get(p.user_id) ?? 0,
      };
    });
    setUsers(rows);
    setHero((heroRes.data ?? []) as HeroImage[]);
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  if (loading) return <div className={s.loading}>Loading…</div>;

  if (!isAdmin) {
    return (
      <div className={s.denied}>
        <Shield size={48} />
        <h1>Admin access required</h1>
        <p>Your account doesn't have admin privileges.</p>
        <Link to="/dashboard" className={s.linkBtn}>← Back to dashboard</Link>
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
    const { error } = await supabase.from("user_tokens").update(dbPatch).eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((u) => u.map((r) => (r.user_id === userId ? { ...r, ...patch } : r)));
    toast.success("Updated");
  };

  const toggleAdmin = async (row: UserRow) => {
    if (row.is_admin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", row.user_id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin role revoked");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: row.user_id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin role granted");
    }
    setUsers((u) => u.map((r) => (r.user_id === row.user_id ? { ...r, is_admin: !r.is_admin } : r)));
  };

  const deleteTranscriptions = async (userId: string) => {
    if (!confirm("Delete ALL transcriptions for this user?")) return;
    const { error } = await supabase.from("transcriptions").delete().eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("Transcriptions deleted");
    loadAll();
  };

  const addHero = async () => {
    const url = prompt("Image URL (https://...)");
    if (!url) return;
    const caption = prompt("Caption (optional)") ?? "";
    const { error } = await supabase.from("hero_images").insert({
      image_url: url,
      caption: caption || null,
      sort_order: hero.length + 1,
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Image added");
    loadAll();
  };

  const toggleHero = async (h: HeroImage) => {
    const { error } = await supabase.from("hero_images").update({ active: !h.active }).eq("id", h.id);
    if (error) return toast.error(error.message);
    setHero((arr) => arr.map((x) => (x.id === h.id ? { ...x, active: !x.active } : x)));
  };

  const saveHeroCaption = async (id: string, caption: string) => {
    const { error } = await supabase
      .from("hero_images")
      .update({ caption: caption.trim() || null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Caption saved");
  };

  const deleteHero = async (id: string) => {
    if (!confirm("Delete this hero image?")) return;
    const { error } = await supabase.from("hero_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setHero((arr) => arr.filter((x) => x.id !== id));
  };

  return (
    <div className={s.page}>
      <header className={s.topbar}>
        <Link to="/dashboard" className={s.back}>
          <ArrowLeft size={18} /> Dashboard
        </Link>
        <div className={s.brand}>
          <Shield size={20} /> Admin
        </div>
        <button className={s.signout} onClick={() => signOut()}>Sign out</button>
      </header>

      <div className={s.heroBanner}>
        <div>
          <div className={s.eyebrow}>Admin Console</div>
          <h1 className={s.title}>Welcome, {user?.email}</h1>
          <p className={s.subtitle}>Manage users, tokens, feature access, and the landing hero slideshow.</p>
        </div>
        <div className={s.statRow}>
          <div className={s.stat}><div className={s.statLabel}>Users</div><div className={s.statValue}>{users.length}</div></div>
          <div className={s.stat}><div className={s.statLabel}>Admins</div><div className={s.statValue}>{users.filter((u) => u.is_admin).length}</div></div>
          <div className={s.stat}><div className={s.statLabel}>Hero images</div><div className={s.statValue}>{hero.length}</div></div>
        </div>
      </div>

      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === "users" ? s.tabActive : ""}`} onClick={() => setTab("users")}>Users & Tokens</button>
        <button className={`${s.tab} ${tab === "hero" ? s.tabActive : ""}`} onClick={() => setTab("hero")}>Hero Slideshow</button>
      </div>

      {tab === "users" && (
        <div className={s.card}>
          {loadingData && <div className={s.loading}>Loading users…</div>}
          {!loadingData && users.length === 0 && <div className={s.loading}>No users yet.</div>}
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Credits</th>
                  <th>Features (Live/File/YT/Tx/TTS)</th>
                  <th>Status</th>
                  <th>Transcripts</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className={u.suspended ? s.suspendedRow : ""}>
                    <td>
                      <div className={s.userName}>{u.display_name ?? "(no name)"}</div>
                      <div className={s.userId}>{u.user_id.slice(0, 8)}…</div>
                    </td>
                    <td>
                      <button className={u.is_admin ? s.roleAdmin : s.roleUser} onClick={() => toggleAdmin(u)}>
                        {u.is_admin ? "Admin" : "User"}
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
                        {u.suspended ? <><ShieldOff size={14} /> Suspended</> : <>Active</>}
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
              <h3>Hero slideshow images</h3>
              <p className={s.muted}>These appear on the landing page. Auto-rotates every 5 seconds.</p>
            </div>
            <button className={s.primary} onClick={addHero}><Plus size={16} /> Add image</button>
          </div>
          <div className={s.heroGrid}>
            {hero.length === 0 && (
              <div className={s.empty}>
                <ImageIcon size={32} />
                <p>No custom images yet — using built-in defaults.</p>
              </div>
            )}
            {hero.map((h) => (
              <div key={h.id} className={s.heroCard}>
                <div className={s.heroThumb} style={{ backgroundImage: `url(${h.image_url})` }} />
                <div className={s.heroBody}>
                  <label className={s.muted} style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.3rem" }}>
                    Caption
                  </label>
                  <textarea
                    className={s.creditInput}
                    style={{ width: "100%", minHeight: "60px", marginBottom: "0.6rem", resize: "vertical", fontFamily: "inherit", fontSize: "0.85rem" }}
                    defaultValue={h.caption ?? ""}
                    placeholder="Enter slide caption…"
                    onBlur={(e) => {
                      if ((e.target.value.trim() || null) !== (h.caption ?? null)) {
                        saveHeroCaption(h.id, e.target.value);
                        setHero((arr) => arr.map((x) => x.id === h.id ? { ...x, caption: e.target.value.trim() || null } : x));
                      }
                    }}
                  />
                  <div className={s.heroActions}>
                    <button className={h.active ? s.active : s.suspended} onClick={() => toggleHero(h)}>
                      {h.active ? "Active" : "Hidden"}
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
