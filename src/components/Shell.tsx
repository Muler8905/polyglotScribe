import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { Menu, X } from "lucide-react";
import s from "./Shell.module.css";
import { useAuth } from "@/lib/auth-context";
import { listTranscriptions } from "@/server/transcription.functions";
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

  useEffect(() => {
    list()
      .then((r) => setItems(((r as { items?: HistoryItem[] })?.items ?? []) as HistoryItem[]))
      .catch(() => setItems([]));
  }, [list, refreshKey]);

  const handleSignOut = async () => {
    await signOut();
    nav({ to: "/auth" });
  };

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link to="/dashboard" className={s.brand} style={{ textDecoration: "none" }}>
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
            >
              <div className={s.historyItemTitle}>{it.title}</div>
              <div className={s.historyMeta}>
                <span className={s.badge}>{it.type}</span>
                <span>{new Date(it.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>

        <Link to="/settings" className={s.signout} style={{ textDecoration: "none", textAlign: "center" }}>{t("shell.settings")}</Link>
        <button className={s.signout} onClick={handleSignOut}>{t("shell.signout")}</button>
      </aside>
      <main className={s.main}>{children}</main>
    </div>
  );
}
