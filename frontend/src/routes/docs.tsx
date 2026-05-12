import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Polyglot Scribe" },
      { name: "description", content: "Learn how to use Polyglot Scribe for live, file, and YouTube transcription with multilingual translation." },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  const sections = [
    {
      title: "Getting started",
      body: "Create a free account from the Sign in page. Once signed in, you'll land on the Dashboard where you can pick between Live, File, and YouTube transcription.",
    },
    {
      title: "Live transcription",
      body: "Click the Live tab and allow microphone access. Speak normally — words appear in real time. Stop recording to save the transcript to your history.",
    },
    {
      title: "Audio & video files",
      body: "Drop an MP3, WAV, M4A, MP4 (or any common audio/video format) into the File tab. Files are processed by ElevenLabs Scribe v2 for accurate, multi-language transcripts.",
    },
    {
      title: "YouTube videos",
      body: "Paste any YouTube URL. We extract the audio and transcribe the spoken content directly — captions are not required. Supports videos up to 30 minutes.",
    },
    {
      title: "Translation",
      body: "Open any saved transcription and pick a target language: English, Amharic, Afaan Oromo, or Somali. View the original and translated text side-by-side.",
    },
    {
      title: "Text-to-speech",
      body: "Click the play icon next to any transcript or translation to hear it spoken with a natural voice powered by ElevenLabs multilingual TTS.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link to="/" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem" }}>← Back to home</Link>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "1rem 0 0.5rem" }}>Documentation</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2.5rem", maxWidth: 600 }}>
          Everything you need to know to get the most out of Polyglot Scribe.
        </p>

        {sections.map((s) => (
          <section key={s.title} style={{ marginBottom: "1.75rem", padding: "1.5rem", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.6rem" }}>{s.title}</h2>
            <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>{s.body}</p>
          </section>
        ))}

        <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--accent)", borderRadius: 14, textAlign: "center" }}>
          Still stuck? <Link to="/support" style={{ color: "var(--primary)", fontWeight: 600 }}>Contact support →</Link>
        </div>
      </div>
    </div>
  );
}
