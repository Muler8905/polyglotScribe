import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Trash2, Shield, ShieldOff, Plus, 
  Image as ImageIcon, Users, Settings, 
  Search, UserPlus, Mail, Key, User as UserIcon,
  Activity, Database
} from "lucide-react";
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
  const [tab, setTab] = useState<"users" | "hero" | "system">("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hero, setHero] = useState<HeroImage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", displayName: "", credits: 100 });

  const loadAll = async () => {
    setLoadingData(true);
    try {
      const [usersRes, heroRes] = await Promise.all([
        apiClient.get("/app/admin/users"),
        apiClient.get("/app/hero-images"),
      ]);
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
      toast.error("Failed to load admin data");
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
      return toast.error("Please fill in all required fields");
    }
    setCreatingUser(true);
    try {
      const res = await apiClient.post("/app/admin/users", newUser);
      if (!res.success) {
        toast.error(res.message || "Failed to create user");
        return;
      }
      toast.success("User created successfully");
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
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    const res = await apiClient.delete(`/app/admin/users/${userId}`);
    if (!res.success) return toast.error(res.message || "Failed to delete user");
    toast.success("User deleted");
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
    if (!res.success) return toast.error(res.message || "Failed to update");
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
            <h1 className={s.title}>Admin Panel</h1>
            <p className={s.subtitle}>Manage users, system assets, and global configurations.</p>
          </div>
          <div className={s.tabs}>
            <button className={`${s.tab} ${tab === "users" ? s.tabActive : ""}`} onClick={() => setTab("users")}><Users size={18} /> {t("admin.tabUsers")}</button>
            <button className={`${s.tab} ${tab === "hero" ? s.tabActive : ""}`} onClick={() => setTab("hero")}><ImageIcon size={18} /> {t("admin.tabHero")}</button>
            <button className={`${s.tab} ${tab === "system" ? s.tabActive : ""}`} onClick={() => setTab("system")}><Settings size={18} /> System</button>
          </div>
        </header>

        {tab === "users" && (
          <div className={s.glassCard}>
            <div className={s.toolbar}>
              <div className={s.searchBar}>
                <Search size={18} />
                <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className={s.primaryBtn} onClick={() => setShowCreateModal(true)}>
                <UserPlus size={18} /> Create User
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Credits</th>
                    <th>Capabilities</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id}>
                      <td>
                        <div className={s.userCell}>
                          <div className={s.avatar}>{u.display_name?.[0] || u.email[0]}</div>
                          <div>
                            <div className={s.userName}>{u.display_name || "No Name"}</div>
                            <div className={s.userEmail}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button className={`${s.badge} ${u.is_admin ? s.badgeAdmin : s.badgeUser}`} onClick={() => toggleAdmin(u)}>
                          {u.is_admin ? "Admin" : "User"}
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
                          {u.suspended ? "Suspended" : "Active"}
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
               <h2 className={s.sectionTitle}>Slideshow Assets</h2>
               <button className={s.primaryBtn} onClick={async () => {
                  const url = prompt("Enter Image URL");
                  if (!url) return;
                  const res = await apiClient.post("/app/hero-images", { imageUrl: url, active: true, sortOrder: hero.length + 1 });
                  if (res.success) { toast.success("Added"); loadAll(); }
               }}>
                 <Plus size={18} /> Add Hero Image
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
                             toast.success("Updated");
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
                          {h.active ? "Active" : "Hidden"}
                        </button>
                        <button className={s.deleteBtn} onClick={async () => {
                           if (confirm("Delete?")) {
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
              <h2 className={s.sectionTitle}>System Health</h2>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Activity size={20} color="#22c55e" /> API Server</div>
                   <span style={{ color: '#22c55e', fontWeight: 600 }}>Healthy</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Database size={20} color="#22c55e" /> MongoDB Cluster</div>
                   <span style={{ color: '#22c55e', fontWeight: 600 }}>Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className={s.modalOverlay}>
            <div className={s.modal}>
              <div className={s.sectionHeader} style={{ marginBottom: '2rem' }}>
                <h2 className={s.sectionTitle}>Create New User</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div className={s.inputWrap}><UserIcon size={18} /><input placeholder="Full Name" value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} /></div>
                 <div className={s.inputWrap}><Mail size={18} /><input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                 <div className={s.inputWrap}><Key size={18} /><input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                 <button className={s.primaryBtn} type="submit" disabled={creatingUser}>{creatingUser ? "Creating..." : "Create User"}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
