import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, BookOpen } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Polyglot Scribe" },
      { name: "description", content: "Get help using Polyglot Scribe. Reach our team by email or browse the documentation." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const cards = [
    { icon: Mail, title: "Email support", desc: "Reach the team — typical reply within 24 hours.", action: "support@polyglotscribe.app", href: "mailto:support@polyglotscribe.app" },
    { icon: BookOpen, title: "Documentation", desc: "Step-by-step guides for live, file, and YouTube transcription.", action: "Read the docs", href: "/docs" },
    { icon: MessageCircle, title: "Feedback", desc: "Tell us what's missing or what we can improve.", action: "feedback@polyglotscribe.app", href: "mailto:feedback@polyglotscribe.app" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link to="/" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem" }}>← Back to home</Link>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "1rem 0 0.5rem" }}>Support</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2.5rem", maxWidth: 600 }}>
          We're here to help. Pick the channel that works best for you.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {cards.map(({ icon: Icon, title, desc, action, href }) => (
            <a key={title} href={href} style={{
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16,
              padding: "1.5rem", textDecoration: "none", color: "var(--foreground)", display: "block",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-elegant)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-foreground)", marginBottom: "0.85rem" }}>
                <Icon size={20} />
              </div>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{title}</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", lineHeight: 1.55, marginBottom: "0.85rem" }}>{desc}</div>
              <div style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.9rem" }}>{action} →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
