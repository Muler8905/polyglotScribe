import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import {
  Menu, X, LayoutDashboard, Mic, History,
  Users, BarChart3, Settings, LogOut, Globe, CreditCard,
  Shield, Bell, ChevronDown, User
} from "lucide-react";
import s from "./Shell.module.css";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-admin";
import { listTranscriptions } from "@/serverFns/transcription.functions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const { isAdmin } = useIsAdmin();
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

  const isAdminView = location.pathname.startsWith("/admin");

  const navItems = isAdminView ? [
    { label: "Admin Dashboard", icon: Shield, to: "/admin", search: {} },
    { label: "Users Management", icon: Users, to: "/admin", search: {} },
    { label: "Return to App", icon: LayoutDashboard, to: "/dashboard", search: { mode: undefined } },
  ] : [
    { label: t("nav.dashboard"), icon: LayoutDashboard, to: "/dashboard", search: { mode: undefined } },
    { label: t("nav.transcribe"), icon: Mic, to: "/dashboard", search: { mode: "select" } },
    { label: t("nav.history"), icon: History, to: "/history", search: {} },
    { label: t("nav.analytics"), icon: BarChart3, to: "/analytics", search: {} },
    { label: t("shell.billing"), icon: CreditCard, to: "/pricing", search: {} },
    ...(isAdmin ? [{ label: "Admin Console", icon: Shield, to: "/admin", search: {} }] : [])
  ];

  return (
    <div className={s.shell}>
      <button className={s.menuBtn} onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`${s.overlay} ${open ? s.overlayOpen : ""}`} onClick={close} />

      <aside className={`${s.sidebar} ${isAdminView ? s.sidebarAdmin : ""} ${open ? s.sidebarOpen : ""}`}>
        <div className={s.sidebarContent}>
          <Link to="/dashboard" search={{ mode: undefined }} className={s.brand} onClick={close}>
            <img src="/logo.png" alt="Polyglot Scribe" className={s.logo} />
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

          <Link to="/pricing" search={{}} className={s.userBadge} onClick={close}>
            <div className={s.avatar}>{user?.email?.[0].toUpperCase()}</div>
            <div className={s.userInfo}>
              <div className={s.userEmail}>{user?.email?.split('@')[0]}</div>
              <div className={s.userStatus}>{t("shell.viewPlan")}</div>
            </div>
          </Link>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.topBar}>
          <div className={s.searchBar}>
            <input type="text" placeholder={t("shell.searchPlaceholder")} />
          </div>
          <div className={s.topActions}>
            <button className={s.notificationBtn} aria-label="Notifications">
              <Bell size={20} />
              <div className={s.notificationDot} />
            </button>

            <LanguageSwitcher compact />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={s.profileTrigger}>
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarFallback className="bg-brand-gradient text-white font-bold">
                      {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={s.userName}>
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={16} className={s.chevron} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>{t("shell.account")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t("shell.profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pricing" className="cursor-pointer flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>{t("shell.billing")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("shell.settings")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("shell.signout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className={s.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
