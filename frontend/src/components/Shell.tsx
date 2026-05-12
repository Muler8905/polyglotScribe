import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { 
  Menu, X, LayoutDashboard, Mic, History, 
  Users, BarChart3, Settings, LogOut, Globe 
} from "lucide-react";
import s from "./Shell.module.css";
import { useAuth } from "@/lib/auth-context";
import { listTranscriptions } from "@/serverFns/transcription.functions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface HistoryItem {
  id: string;
  title: string;
  type: "live" | "file" | "youtube";
  source_lang: string | null;
  target_lang: string | null;
  created_at: string;
}

export function Shell({
  children,
  activeId,
  refreshKey,
}: {
  children: ReactNode;
  activeId?: string;
  refreshKey?: number;
}) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const list = useServerFn(listTranscriptions);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    list()
      .then((r) => setItems(((r as { items?: HistoryItem[] })?.items ?? []) as HistoryItem[]))
      .catch(() => setItems([]));
  }, [list, refreshKey]);

  const handleSignOut = async () => {
    await signOut();
    nav({ to: "/auth" });
  };

  const close = () => setOpen(false);

  const navItems = [
    { label: t("nav.dashboard"), icon: LayoutDashboard, to: "/dashboard", search: { mode: undefined } },
    { label: t("nav.transcribe"), icon: Mic, to: "/dashboard", search: { mode: "select" } },
    { label: t("nav.history"), icon: History, to: "/history" },
    { label: t("nav.users"), icon: Users, to: "/admin" },
    { label: t("nav.analytics"), icon: BarChart3, to: "/analytics" },
    { label: t("nav.settings"), icon: Settings, to: "/settings" },
  ];

  return (
    <div className={s.shell}>
      <button className={s.menuBtn} onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <div className={`${s.overlay} ${open ? s.overlayOpen : ""}`} onClick={close} />
      
      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}>
        <div className={s.sidebarContent}>
          <Link to="/dashboard" search={{ mode: undefined }} className={s.brand} onClick={close}>
            <div className={s.brandIcon}>
              <Globe size={24} />
            </div>
            <div className={s.brandName}>
              <span>POLYGLOT</span>
              <span>SCRIBE</span>
            </div>
          </Link>

          <nav className={s.nav}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.label}
                  to={item.to as any}
                  search={(item as any).search}
                  className={`${s.navItem} ${isActive ? s.active : ""}`}
                  onClick={close}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {isActive && <div className={s.activeIndicator} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={s.sidebarFooter}>
          <Link to="/settings" className={s.navItem} onClick={close}>
            <Settings size={20} />
            <span>{t("shell.settings")}</span>
          </Link>
          <button className={s.navItem} onClick={handleSignOut}>
            <LogOut size={20} />
            <span>{t("shell.signout")}</span>
          </button>
          
          <div className={s.userBadge}>
            <div className={s.avatar}>{user?.email?.[0].toUpperCase()}</div>
            <div className={s.userInfo}>
              <div className={s.userEmail}>{user?.email?.split('@')[0]}</div>
              <div className={s.userStatus}>Free Plan</div>
            </div>
          </div>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.topBar}>
          <div className={s.searchBar}>
            <input type="text" placeholder="Search..." />
          </div>
          <div className={s.topActions}>
             <LanguageSwitcher compact />
          </div>
        </div>
        <div className={s.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
