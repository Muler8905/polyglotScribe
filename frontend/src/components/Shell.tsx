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
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSignOut = async () => {
    setShowSignOutDialog(true);
  };

  const confirmSignOut = async () => {
    await signOut();
    nav({ to: "/" });
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
            <span className={s.brandName}>PolyglotScribe</span>
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
            <div className={`${s.mobileNavLanguageSwitcher} ${isAdminView ? s.adminNavLanguageSwitcher : ''}`}>
              <LanguageSwitcher variant="navItem" className={s.navItem} />
            </div>
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
          {/* Left zone — spacer so search stays centered */}
          <div className={s.topBarLeft} />

          {/* Center zone — search bar */}
          <div className={s.topBarCenter}>
            <div className={s.searchBar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={s.searchIcon}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" placeholder={t("shell.searchPlaceholder")} />
            </div>
          </div>

          {/* Right zone — notification + language + profile */}
          <div className={s.topActions}>
            <NotificationBell />

            {!isAdminView && (
              <div className={s.desktopLanguageSwitcher}>
                <LanguageSwitcher compact />
              </div>
            )}

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
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.signOutTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auth.signOutDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSignOut} className="bg-red-600 hover:bg-red-700 text-white">
              {t("auth.signOutAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
