import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Trash2, Shield, ShieldOff, Plus,
  Image as ImageIcon, Users, Settings,
  Search, UserPlus, Mail, Key, User as UserIcon,
  Activity, Database, BarChart3, TrendingUp, DollarSign,
  Globe, Zap
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import { Shell } from "@/components/Shell";
import s from "@/components/Admin.module.css";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      if (!apiClient.isAuthenticated()) throw redirect({ to: "/auth" });
    }
  },
  head: () => ({ meta: [{ title: "Admin Panel — Polyglot Scribe" }] }),
  component: AdminPage,
});

interface UserRow {
  user_id: string;
  display_name: string | null;
  email: string;
  is_admin: boolean;
  credits: number;
  suspended: boolean;
  feature_live: boolean;
  feature_file: boolean;
  feature_youtube: boolean;
  feature_translate: boolean;
  feature_tts: boolean;
  transcript_count: number;
  createdAt: string;
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
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"analytics" | "users" | "hero" | "system">("analytics");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hero, setHero] = useState<HeroImage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", displayName: "", credits: 100 });

  const loadAll = async () => {
    setLoadingData(true);
    try {
      const [usersRes, heroRes, statsRes] = await Promise.all([
        apiClient.get("/app/admin/users"),
        apiClient.get("/app/hero-images"),
        apiClient.get("/app/admin/stats"),
      ]);
      setStats(statsRes.data);
      const rows: UserRow[] = (usersRes.data?.users ?? []).map((u: any) => ({
        user_id: u.userId,
        email: u.email,
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
        createdAt: u.createdAt,
      }));
      setUsers(rows);
      setHero(
        (heroRes.data?.items ?? []).map((h: any) => ({
          id: h._id || h.id,
          image_url: h.imageUrl,
          caption: h.caption,
          sort_order: h.sortOrder,
          active: h.active,
        })),
      );
    } catch (err) {
      toast.error(t("admin.failLoad"));
    } finally {
      setLoadingData(false);
    }
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
        <Link to="/dashboard" search={{ mode: undefined }} className={s.linkBtn}>{t("admin.back")}</Link>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      return toast.error(t("admin.failCreate"));
    }
    setCreatingUser(true);
    try {
      const res = await apiClient.post("/app/admin/users", newUser);
      if (!res.success) {
        toast.error(res.message || t("admin.failCreate"));
        return;
      }
      toast.success(t("admin.userCreated"));
      setShowCreateModal(false);
      setNewUser({ email: "", password: "", displayName: "", credits: 100 });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("admin.confirmDeleteUser"))) return;
    const res = await apiClient.delete(`/app/admin/users/${userId}`);
    if (!res.success) return toast.error(res.message || t("admin.failDelete"));
    toast.success(t("admin.userDeleted"));
    setUsers(users.filter(u => u.user_id !== userId));
  };

  const updateToken = async (userId: string, patch: Partial<UserRow>) => {
    const res = await apiClient.patch(`/app/admin/users/${userId}/tokens`, {
      credits: patch.credits,
      suspended: patch.suspended,
      featureLive: patch.feature_live,
      featureFile: patch.feature_file,
      featureYoutube: patch.feature_youtube,
      featureTranslate: patch.feature_translate,
      featureTts: patch.feature_tts,
    });
    if (!res.success) return toast.error(res.message || t("admin.failUpdate"));
    setUsers((u) => u.map((r) => (r.user_id === userId ? { ...r, ...patch } : r)));
    toast.success(t("admin.updated"));
  };

  const toggleAdmin = async (row: UserRow) => {
    const res = await apiClient.post(`/app/admin/users/${row.user_id}/toggle-admin`);
    if (!res.success) return toast.error(res.message || "Failed");
    toast.success(row.is_admin ? t("admin.adminRevoked") : t("admin.adminGranted"));
    setUsers((u) => u.map((r) => (r.user_id === row.user_id ? { ...r, is_admin: !r.is_admin } : r)));
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className={s.container}>
        <header className={s.header}>
          <div className={s.headerInfo}>
            <h1 className={s.title}>{t("admin.title")}</h1>
            <p className={s.subtitle}>{t("admin.subtitle")}</p>
          </div>
          <div className={s.tabs}>
            <button className={`${s.tab} ${tab === "analytics" ? s.tabActive : ""}`} onClick={() => setTab("analytics")}><BarChart3 size={18} /> Analytics</button>
            <button className={`${s.tab} ${tab === "users" ? s.tabActive : ""}`} onClick={() => setTab("users")}><Users size={18} /> {t("admin.tabUsers")}</button>
            <button className={`${s.tab} ${tab === "hero" ? s.tabActive : ""}`} onClick={() => setTab("hero")}><ImageIcon size={18} /> {t("admin.tabHero")}</button>
            <button className={`${s.tab} ${tab === "system" ? s.tabActive : ""}`} onClick={() => setTab("system")}><Settings size={18} /> {t("admin.tabSystem")}</button>
          </div>
        </header>

        {tab === "analytics" && stats && (
          <div className={s.analyticsGrid}>
            <div className={s.statRow}>
              <div className={s.statCard}>
                <div className={s.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Users size={24} /></div>
                <div className={s.statInfo}>
                  <span className={s.statLabel}>Total Users</span>
                  <span className={s.statValue}>{stats.totalUsers}</span>
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><TrendingUp size={24} /></div>
                <div className={s.statInfo}>
                  <span className={s.statLabel}>Transcriptions</span>
                  <span className={s.statValue}>{stats.totalTranscriptions}</span>
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><DollarSign size={24} /></div>
                <div className={s.statInfo}>
                  <span className={s.statLabel}>Total Revenue</span>
                  <span className={s.statValue}>{stats.totalRevenue.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            <div className={s.chartsRow}>
              <div className={s.glassCard} style={{ flex: 2 }}>
                <h3 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>Revenue Analytics (Last 30 Days)</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.analytics}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f59e0b' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={s.glassCard} style={{ flex: 1 }}>
                <h3 className={s.sectionTitle} style={{ marginBottom: '1.5rem' }}>Usage Level</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.analytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" hide />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className={s.glassCard}>
            <div className={s.toolbar}>
              <div className={s.searchBar}>
                <Search size={18} />
                <input placeholder={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className={s.primaryBtn} onClick={() => setShowCreateModal(true)}>
                <UserPlus size={18} /> {t("admin.createUser")}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>{t("admin.thUser")}</th>
                    <th>{t("admin.thRole")}</th>
                    <th>{t("admin.thCredits")}</th>
                    <th>{t("admin.thCaps")}</th>
                    <th>{t("admin.thStatus")}</th>
                    <th>{t("admin.thJoined")}</th>
                    <th>{t("admin.thActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id}>
                      <td>
                        <div className={s.userCell}>
                          <div className={s.avatar}>{u.display_name?.[0] || u.email[0]}</div>
                          <div>
                            <div className={s.userName}>{u.display_name || t("admin.noName")}</div>
                            <div className={s.userEmail}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button className={`${s.badge} ${u.is_admin ? s.badgeAdmin : s.badgeUser}`} onClick={() => toggleAdmin(u)}>
                          {u.is_admin ? t("admin.roleAdmin") : t("admin.roleUser")}
                        </button>
                      </td>
                      <td>
                        <input
                          type="number"
                          className={s.inlineInput}
                          value={u.credits}
                          onChange={(e) => setUsers(users.map(r => r.user_id === u.user_id ? { ...r, credits: parseInt(e.target.value) || 0 } : r))}
                          onBlur={(e) => updateToken(u.user_id, { credits: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[
                            { key: "feature_live", label: "🎙️" },
                            { key: "feature_file", label: "📁" },
                            { key: "feature_youtube", label: "▶️" },
                            { key: "feature_translate", label: "🌍" },
                            { key: "feature_tts", label: "🔊" }
                          ].map((f) => (
                            <button
                              key={f.key}
                              className={`${s.capBtn} ${u[f.key as keyof UserRow] ? s.capOn : s.capOff}`}
                              onClick={() => updateToken(u.user_id, { [f.key]: !u[f.key as keyof UserRow] })}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button className={`${s.statusBtn} ${u.suspended ? s.statusSuspended : s.statusActive}`} onClick={() => updateToken(u.user_id, { suspended: !u.suspended })}>
                          {u.suspended ? t("admin.statusSuspended") : t("admin.statusActive")}
                        </button>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className={s.deleteBtn} onClick={() => handleDeleteUser(u.user_id)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "hero" && (
          <div className={s.container}>
            <div className={s.toolbar}>
              <h2 className={s.sectionTitle}>{t("admin.heroTitle")}</h2>
              <button className={s.primaryBtn} onClick={async () => {
                const url = prompt(t("admin.heroTitle"));
                if (!url) return;
                const res = await apiClient.post("/app/hero-images", { imageUrl: url, active: true, sortOrder: hero.length + 1 });
                if (res.success) { toast.success(t("admin.userCreated")); loadAll(); }
              }}>
                <Plus size={18} /> {t("admin.addHero")}
              </button>
            </div>
            <div className={s.heroGrid}>
              {hero.map(h => (
                <div key={h.id} className={s.heroCard}>
                  <div className={s.heroThumb} style={{ backgroundImage: `url(${h.image_url})` }} />
                  <div style={{ padding: '1rem' }}>
                    <textarea
                      className={s.captionInput}
                      defaultValue={h.caption || ""}
                      onBlur={async (e) => {
                        if (e.target.value !== h.caption) {
                          await apiClient.patch(`/app/hero-images/${h.id}`, { caption: e.target.value });
                          toast.success(t("admin.updated"));
                        }
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                      <button
                        className={`${s.statusBtn} ${h.active ? s.statusActive : s.statusSuspended}`}
                        onClick={async () => {
                          await apiClient.patch(`/app/hero-images/${h.id}`, { active: !h.active });
                          loadAll();
                        }}
                      >
                        {h.active ? t("admin.statusActive") : t("admin.statusHidden")}
                      </button>
                      <button className={s.deleteBtn} onClick={async () => {
                        if (confirm(t("admin.confirmDeleteUser"))) {
                          await apiClient.delete(`/app/hero-images/${h.id}`);
                          loadAll();
                        }
                      }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "system" && (
          <div className={s.mainGrid}>
            <div className={s.glassCard}>
              <h2 className={s.sectionTitle}>{t("admin.systemTitle")}</h2>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Activity size={20} color="#22c55e" /> {t("admin.apiServer")}</div>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{t("admin.healthy")}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Database size={20} color="#22c55e" /> {t("admin.dbCluster")}</div>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{t("admin.connected")}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Globe size={20} color="#3b82f6" /> Region</div>
                  <span style={{ color: 'white', fontWeight: 500 }}>East Africa (Addis Ababa)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Zap size={20} color="#f59e0b" /> Node Version</div>
                  <span style={{ color: 'white', fontWeight: 500 }}>{typeof process !== 'undefined' ? process.version : 'v20.x'}</span>
                </div>
              </div>
            </div>

            <div className={s.glassCard}>
              <h2 className={s.sectionTitle}>Global Settings</h2>
              <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div className={s.fieldGroup}>
                  <label className={s.fieldLabel}>Default New User Credits</label>
                  <div className={s.inputWrap}><Database size={16} /><input type="number" defaultValue="100" /></div>
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.fieldLabel}>Maintenance Mode</label>
                  <button className={s.statusBtn} style={{ width: 'fit-content' }}>Disabled</button>
                </div>
                <button className={s.primaryBtn} onClick={() => toast.success("Settings saved (demo)")}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className={s.modalOverlay}>
            <div className={s.modal}>
              <div className={s.sectionHeader} style={{ marginBottom: '2rem' }}>
                <h2 className={s.sectionTitle}>{t("admin.modalCreateTitle")}</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className={s.inputWrap}><UserIcon size={18} /><input placeholder={t("admin.placeholderName")} value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} /></div>
                <div className={s.inputWrap}><Mail size={18} /><input type="email" placeholder={t("admin.placeholderEmail")} value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                <div className={s.inputWrap}><Key size={18} /><input type="password" placeholder={t("admin.placeholderPwd")} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                <button className={s.primaryBtn} type="submit" disabled={creatingUser}>{creatingUser ? t("admin.btnCreating") : t("admin.createUser")}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
