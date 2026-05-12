import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ArrowLeft, Trash2, Shield, ShieldOff, Plus, 
  Image as ImageIcon, Users, Settings, BarChart3, 
  Search, MoreHorizontal, UserPlus, Mail, Key, User as UserIcon,
  Menu, X
} from "lucide-react";
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
  const { user: currentUser, signOut } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"users" | "hero" | "system">("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hero, setHero] = useState<HeroImage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <Link to="/dashboard" className={s.linkBtn}>{t("admin.back")}</Link>
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
    if (!confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
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
    <div className={s.adminLayout}>
      <div className={`${s.sidebarOverlay} ${mobileMenuOpen ? s.overlayVisible : ""}`} onClick={() => setMobileMenuOpen(false)} />
      
      <aside className={`${s.sidebar} ${mobileMenuOpen ? s.sidebarOpen : ""}`}>
        <div className={s.sidebarBrand}>
          <div className={s.logoIcon}><Shield size={22} /></div>
          <span>Admin Panel</span>
          <button className={s.mobileClose} onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className={s.sidebarNav}>
          <button className={`${s.navItem} ${tab === "users" ? s.navActive : ""}`} onClick={() => { setTab("users"); setMobileMenuOpen(false); }}>
            <Users size={18} /> {t("admin.tabUsers")}
          </button>
          <button className={`${s.navItem} ${tab === "hero" ? s.navActive : ""}`} onClick={() => { setTab("hero"); setMobileMenuOpen(false); }}>
            <ImageIcon size={18} /> {t("admin.tabHero")}
          </button>
          <button className={`${s.navItem} ${tab === "system" ? s.navActive : ""}`} onClick={() => { setTab("system"); setMobileMenuOpen(false); }}>
            <Settings size={18} /> System Settings
          </button>
        </nav>

        <div className={s.sidebarFooter}>
          <Link to="/dashboard" className={s.navItem}><ArrowLeft size={18} /> {t("admin.dashboard")}</Link>
          <button onClick={() => signOut()} className={s.navItem} style={{ color: "var(--destructive)" }}>
            <ShieldOff size={18} /> {t("admin.signout")}
          </button>
        </div>
      </aside>

      <main className={s.mainContent}>
        <header className={s.contentHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button className={s.menuToggle} onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className={s.contentTitle}>
                {tab === "users" && t("admin.tabUsers")}
                {tab === "hero" && t("admin.tabHero")}
                {tab === "system" && "System Control"}
              </h1>
              <p className={s.contentSubtitle}>
                {tab === "users" && `Managing ${users.length} registered users`}
                {tab === "hero" && `Managing ${hero.length} slideshow images`}
                {tab === "system" && "Global system configurations and health"}
              </p>
            </div>
          </div>
          {tab === "users" && (
            <button className={s.primaryBtn} onClick={() => setShowCreateModal(true)}>
              <UserPlus size={18} /> <span className={s.btnText}>Create User</span>
            </button>
          )}
        </header>


        {tab === "users" && (
          <>
            <div className={s.toolbar}>
              <div className={s.searchBar}>
                <Search size={18} />
                <input 
                  placeholder="Search users by email or name..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className={s.tableCard}>
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
                      <td className={s.userCell}>
                        <div className={s.avatar}>{u.display_name?.[0] || u.email[0]}</div>
                        <div>
                          <div className={s.userName}>{u.display_name || "No Name"}</div>
                          <div className={s.userEmail}>{u.email}</div>
                        </div>
                      </td>
                      <td>
                        <button 
                          className={`${s.badge} ${u.is_admin ? s.badgeAdmin : s.badgeUser}`}
                          onClick={() => toggleAdmin(u)}
                        >
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
                        <div className={s.capabilityRow}>
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
                              title={f.key}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          className={`${s.statusBtn} ${u.suspended ? s.statusSuspended : s.statusActive}`}
                          onClick={() => updateToken(u.user_id, { suspended: !u.suspended })}
                        >
                          {u.suspended ? "Suspended" : "Active"}
                        </button>
                      </td>
                      <td className={s.dateCell}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={s.actions}>
                          <button className={s.deleteBtn} onClick={() => handleDeleteUser(u.user_id)} title="Delete User">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* MODAL: CREATE USER */}
        {showCreateModal && (
          <div className={s.modalOverlay}>
            <div className={s.modal}>
              <div className={s.modalHeader}>
                <h2>Create New User</h2>
                <button onClick={() => setShowCreateModal(false)}><Plus style={{ transform: "rotate(45deg)" }} /></button>
              </div>
              <form onSubmit={handleCreateUser} className={s.modalForm}>
                <div className={s.formField}>
                  <label>Display Name</label>
                  <div className={s.inputWrap}><UserIcon size={16} /><input required value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} placeholder="Full Name" /></div>
                </div>
                <div className={s.formField}>
                  <label>Email Address</label>
                  <div className={s.inputWrap}><Mail size={16} /><input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@example.com" /></div>
                </div>
                <div className={s.formField}>
                  <label>Password</label>
                  <div className={s.inputWrap}><Key size={16} /><input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" /></div>
                </div>
                <div className={s.formField}>
                  <label>Initial Credits</label>
                  <div className={s.inputWrap}><BarChart3 size={16} /><input type="number" value={newUser.credits} onChange={e => setNewUser({...newUser, credits: parseInt(e.target.value) || 0})} /></div>
                </div>
                <div className={s.modalActions}>
                  <button type="button" className={s.cancelBtn} onClick={() => setShowCreateModal(false)} disabled={creatingUser}>Cancel</button>
                  <button type="submit" className={s.submitBtn} disabled={creatingUser}>
                    {creatingUser ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HERO IMAGES TAB */}
        {tab === "hero" && (
          <div className={s.heroSection}>
            <div className={s.sectionHeader}>
              <button className={s.primaryBtn} onClick={async () => {
                const url = prompt(t("admin.promptUrl"));
                if (!url) return;
                const caption = prompt(t("admin.promptCaption")) ?? "";
                const res = await apiClient.post("/app/hero-images", {
                  imageUrl: url,
                  caption: caption || null,
                  sortOrder: hero.length + 1,
                  active: true,
                });
                if (res.success) { toast.success("Image added"); loadAll(); }
              }}>
                <Plus size={18} /> Add Hero Image
              </button>
            </div>

            <div className={s.heroGrid}>
              {hero.length === 0 && (
                <div className={s.emptyState}>
                  <ImageIcon size={48} />
                  <p>No hero images found. Add one to start the slideshow.</p>
                </div>
              )}
              {hero.map((h) => (
                <div key={h.id} className={s.heroCard}>
                  <div className={s.heroThumb} style={{ backgroundImage: `url(${h.image_url})` }}>
                    <div className={s.heroBadge}>{h.active ? "Active" : "Hidden"}</div>
                  </div>
                  <div className={s.heroBody}>
                    <textarea
                      className={s.captionInput}
                      defaultValue={h.caption ?? ""}
                      placeholder="Enter image caption..."
                      onBlur={async (e) => {
                        const val = e.target.value.trim() || null;
                        if (val !== h.caption) {
                          const res = await apiClient.patch(`/app/hero-images/${h.id}`, { caption: val });
                          if (res.success) toast.success("Caption updated");
                        }
                      }}
                    />
                    <div className={s.heroFooter}>
                      <button 
                        className={`${s.statusBtn} ${h.active ? s.statusActive : s.statusSuspended}`}
                        onClick={async () => {
                          const res = await apiClient.patch(`/app/hero-images/${h.id}`, { active: !h.active });
                          if (res.success) setHero(hero.map(x => x.id === h.id ? {...x, active: !x.active} : x));
                        }}
                      >
                        {h.active ? "Visible" : "Hidden"}
                      </button>
                      <button className={s.deleteBtn} onClick={async () => {
                        if (!confirm("Delete this hero image?")) return;
                        const res = await apiClient.delete(`/app/hero-images/${h.id}`);
                        if (res.success) setHero(hero.filter(x => x.id !== h.id));
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {tab === "system" && (
          <div className={s.systemGrid}>
            <div className={s.card}>
              <h3>Server Status</h3>
              <div className={s.statusItem}>
                <span>API Status</span>
                <span className={s.statusActive}>Operational</span>
              </div>
              <div className={s.statusItem}>
                <span>Database</span>
                <span className={s.statusActive}>Connected</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

