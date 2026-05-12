import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Polyglot Scribe" },
      { name: "description", content: "Learn how Polyglot Scribe collects, uses, and protects your data when transcribing and translating audio." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link to="/" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem" }}>← Back to home</Link>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "1rem 0 0.5rem" }}>Privacy Policy</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>Last updated: April 28, 2026</p>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.6rem" }}>1. What we collect</h2>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            We collect your email address (for authentication), audio you submit for transcription, and the resulting text and translations.
            We do not sell your data. Audio uploads are processed and discarded after transcription completes.
          </p>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.6rem" }}>2. How we use it</h2>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            Your transcripts and translations are saved to your private history so you can revisit them. Only you can read your own data —
            row-level security ensures other users cannot access your records.
          </p>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.6rem" }}>3. Third-party processors</h2>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            Transcription is powered by ElevenLabs Scribe; translation by Lovable AI Gateway. Audio and text are sent to these processors
            solely to fulfill your request and are subject to their privacy policies.
          </p>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.6rem" }}>4. Your rights</h2>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            You can delete any transcription from your history at any time. To delete your account or request a full data export,
            contact us at support@polyglotscribe.app.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.6rem" }}>5. Contact</h2>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            Questions about this policy? Visit our <Link to="/support" style={{ color: "var(--primary)" }}>support page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
