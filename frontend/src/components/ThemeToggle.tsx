import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
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
        width: compact ? 28 : 38,
        height: compact ? 28 : 38,
        borderRadius: compact ? 8 : 10,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--foreground)",
        cursor: "pointer",
        transition: "transform 0.2s, background 0.2s",
      }}
    >
      {theme === "dark" ? <Sun size={compact ? 16 : 18} /> : <Moon size={compact ? 16 : 18} />}
    </button>
  );
}
