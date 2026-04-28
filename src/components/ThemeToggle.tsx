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
        width: 38,
        height: 38,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--foreground)",
        cursor: "pointer",
        transition: "transform 0.2s, background 0.2s",
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
