import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "var(--icon-btn-size)",
        height: "var(--icon-btn-size)",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--foreground)",
        cursor: "pointer",
        transition: "transform 0.2s, background 0.2s",
      }}
    >
      {theme === "dark" ? <Sun style={{ width: "var(--icon-btn-svg)", height: "var(--icon-btn-svg)" }} /> : <Moon style={{ width: "var(--icon-btn-svg)", height: "var(--icon-btn-svg)" }} />}
    </button>
  );
}
