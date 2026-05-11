import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { Menu, X } from "lucide-react";
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

  return (
    <div className={s.shell}>
      <button className={s.menuBtn} onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className={`${s.overlay} ${open ? s.overlayOpen : ""}`} onClick={close} />
      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}>
        <Link to="/dashboard" className={s.brand} style={{ textDecoration: "none" }} onClick={close}>
          <div className={s.brandMark} />
          <div>Polyglot Scribe</div>
        </Link>
        <div className={s.user}>{user?.email}</div>
        <div style={{ padding: "0.5rem 0" }}><LanguageSwitcher compact /></div>

        <div className={s.historyTitle}>{t("shell.history")}</div>
        <div className={s.historyList}>
          {items.length === 0 && <div className={s.user}>{t("shell.noHistory")}</div>}
          {items.map((it) => (
            <Link
              key={it.id}
              to="/transcription/$id"
              params={{ id: it.id }}
              className={`${s.historyItem} ${activeId === it.id ? s.active : ""}`}
              onClick={close}
            >
              <div className={s.historyItemTitle}>{it.title}</div>
              <div className={s.historyMeta}>
                <span className={s.badge}>{it.type}</span>
                <span>{new Date(it.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>

        <Link to="/settings" className={s.signout} style={{ textDecoration: "none", textAlign: "center" }} onClick={close}>{t("shell.settings")}</Link>
        <button className={s.signout} onClick={handleSignOut}>{t("shell.signout")}</button>
      </aside>
      <main className={s.main}>
        <div className={s.content}>
          {children}
        </div>
        <footer className={s.footer}>
          <div className={s.footerGrid}>
            <div className={s.footerCol}>
              <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "none", fontSize: "1rem", marginBottom: "0.75rem" }}>
                <div className={s.brandMark} style={{ width: "24px", height: "24px" }} />
                Polyglot Scribe
              </h4>
              <p>{t("footer.tagline")}</p>
            </div>
            <div className={s.footerCol}>
              <h4>{t("transcriber.transcript")}</h4>
              <div className={s.footerList}>
                <Link to="/dashboard" className={s.footerLink}>{t("transcriber.tabLive")}</Link>
                <Link to="/dashboard" className={s.footerLink}>{t("transcriber.tabFile")}</Link>
                <Link to="/dashboard" className={s.footerLink}>{t("transcriber.tabYouTube")}</Link>
              </div>
            </div>
            <div className={s.footerCol}>
              <h4>{t("footer.resources")}</h4>
              <div className={s.footerList}>
                <Link to="/docs" className={s.footerLink}>{t("nav.documentation")}</Link>
                <Link to="/support" className={s.footerLink}>{t("nav.support")}</Link>
                <Link to="/settings" className={s.footerLink}>{t("settings.title")}</Link>
              </div>
            </div>
            <div className={s.footerCol}>
              <h4>{t("footer.legal")}</h4>
              <div className={s.footerList}>
                <Link to="/privacy" className={s.footerLink}>{t("nav.privacy")}</Link>
                <Link to="/docs" className={s.footerLink}>{t("footer.terms")}</Link>
              </div>
            </div>
          </div>
          <div className={s.footerBottom}>
            <div>
              © {new Date().getFullYear()} Polyglot Scribe. {t("footer.rights")}
            </div>
            <div style={{ opacity: 0.8 }}>
              {t("footer.made")}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
