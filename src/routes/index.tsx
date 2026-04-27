import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import s from "@/components/Landing.module.css";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Polyglot Scribe — Real-time speech & YouTube transcription" },
      { name: "description", content: "Live mic transcription, audio file transcription, and YouTube captions with side-by-side translation across English, Amharic, Afaan Oromo, and Somali." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className={s.hero}>
      <nav className={s.nav}>
        <div className={s.brand}>
          <div className={s.brandMark} />
          <span>Polyglot Scribe</span>
        </div>
        <div className={s.navLinks}>
          <Link to="/auth" className={`${s.linkBtn} ${s.linkGhost}`}>Sign in</Link>
          <Link to="/auth" className={`${s.linkBtn} ${s.linkPrimary}`}>Get started</Link>
        </div>
      </nav>
      <div className={s.center}>
        <div className={s.inner}>
          <span className={s.kicker}>Live · File · YouTube · 4 Languages</span>
          <h1 className={s.title}>
            Transcribe anything you hear, then <span className={s.gradient}>translate it instantly</span>.
          </h1>
          <p className={s.subtitle}>
            Real-time microphone transcription, audio-file transcription, and YouTube caption extraction —
            with side-by-side translation across English, Amharic, Afaan Oromo, and Somali, plus natural text-to-speech playback.
          </p>
          <Link to="/auth" className={s.cta}>Start transcribing →</Link>

          <div className={s.features}>
            <div className={s.feat}>
              <div className={s.featTitle}>🎙️ Live transcription</div>
              <div className={s.featDesc}>Speak into your mic and watch words appear in real time, then translate with one click.</div>
            </div>
            <div className={s.feat}>
              <div className={s.featTitle}>📁 Audio files</div>
              <div className={s.featDesc}>Drop an MP3, WAV, M4A, or video — we transcribe the entire track at studio accuracy.</div>
            </div>
            <div className={s.feat}>
              <div className={s.featTitle}>▶️ YouTube URLs</div>
              <div className={s.featDesc}>Paste a YouTube link to pull its captions, then translate and listen in any of 4 languages.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
