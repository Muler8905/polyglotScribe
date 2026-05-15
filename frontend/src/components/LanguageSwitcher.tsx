import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false, variant = "default", className = "" }: { compact?: boolean; variant?: "default" | "navItem"; className?: string }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.language")}
        style={
          variant === "navItem" ? {
            display: "flex", width: "100%", alignItems: "center", gap: "0.75rem",
            padding: "0.85rem 1rem", borderRadius: "12px", border: "none",
            fontSize: "0.95rem", fontWeight: 500, cursor: "pointer",
            textAlign: "left"
          } : {
            display: "inline-flex", alignItems: "center", gap: compact ? "0.25rem" : "0.4rem",
            padding: compact ? "0.3rem 0.5rem" : "var(--lang-btn-pad)",
            borderRadius: 9, border: "1px solid var(--border)",
            background: "var(--background)", color: "var(--foreground)",
            fontSize: "var(--lang-text-size)", fontWeight: 500, cursor: "pointer",
          }
        }
        className={`${variant === "navItem" ? "navItemHover" : ""} ${className}`.trim()}
      >
        <Globe style={variant === "navItem" ? { width: 20, height: 20 } : { width: "var(--lang-globe-size)", height: "var(--lang-globe-size)", display: compact ? "none" : "block" }} />
        {variant === "navItem" ? (
          <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
             {t("common.language")}
             <span style={{ fontSize: "0.75rem", background: "var(--muted)", padding: "2px 6px", borderRadius: 4, marginLeft: "auto" }}>
               {current.code.toUpperCase()}
             </span>
          </span>
        ) : (
          <span>{current.flag} {compact ? current.code.toUpperCase() : current.native}</span>
        )}
        <ChevronDown 
          style={{ 
            width: variant === "navItem" ? 16 : "calc(var(--lang-globe-size) - 2px)", 
            height: variant === "navItem" ? 16 : "calc(var(--lang-globe-size) - 2px)",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none"
          }} 
        />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", 
            ...(variant === "navItem" ? { left: 0, right: 0, top: "100%" } : { right: 0, top: "calc(100% + 6px)" }),
            minWidth: variant === "navItem" ? "100%" : 180, background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: 10,
            boxShadow: "var(--shadow-card, 0 8px 24px rgba(0,0,0,0.12))",
            padding: 4, zIndex: 100,
          }}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              style={{
                display: "flex", width: "100%", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.7rem", borderRadius: 7, border: "none",
                background: l.code === current.code ? "var(--muted)" : "transparent",
                color: "var(--foreground)", textAlign: "left", cursor: "pointer",
                fontSize: "0.9rem", fontWeight: l.code === current.code ? 600 : 400,
              }}
            >
              <span style={{ fontSize: "1rem" }}>{l.flag}</span>
              <span style={{ flex: 1 }}>{l.native}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
