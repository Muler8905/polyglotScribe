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
      { title: "Polyglot Scribe — Live, File & YouTube Transcription with Translation" },
      {
        name: "description",
        content:
          "Real-time microphone transcription, audio file transcription, and YouTube caption extraction with side-by-side translation across English, Amharic, Afaan Oromo, and Somali. Includes natural text-to-speech playback.",
      },
      { property: "og:title", content: "Polyglot Scribe — Speech, File & YouTube Transcription" },
      { property: "og:description", content: "Transcribe and translate any voice, audio file, or YouTube video in 4 languages." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className={s.page}>
      <header className={s.nav}>
        <Link to="/" className={s.brand}>
          <div className={s.brandMark} />
          <span>Polyglot Scribe</span>
        </Link>
        <nav className={s.navLinks}>
          <a href="#features" className={s.navLink}>Features</a>
          <a href="#how" className={s.navLink}>How it works</a>
          <a href="#cases" className={s.navLink}>Use cases</a>
          <Link to="/auth" className={`${s.linkBtn} ${s.linkGhost}`}>Sign in</Link>
          <Link to="/auth" className={`${s.linkBtn} ${s.linkPrimary}`}>Get started</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.kicker}>
            <span className={s.dot} />
            Live · Audio File · YouTube · 4 Languages
          </span>
          <h1 className={s.title}>
            Transcribe anything you hear,
            <br />
            then <span className={s.gradient}>translate it instantly</span>.
          </h1>
          <p className={s.subtitle}>
            Real-time microphone transcription, audio-file transcription, and YouTube caption extraction —
            with side-by-side translation across English, Amharic, Afaan Oromo, and Somali, plus natural
            text-to-speech playback.
          </p>
          <div className={s.ctaRow}>
            <Link to="/auth" className={s.cta}>Start free →</Link>
            <a href="#features" className={s.ctaSecondary}>See how it works</a>
          </div>
          <div className={s.languages}>
            <span className={s.langBadge}>🇬🇧 English</span>
            <span className={s.langBadge}>🇪🇹 Amharic (አማርኛ)</span>
            <span className={s.langBadge}>🇪🇹 Afaan Oromo</span>
            <span className={s.langBadge}>🇸🇴 Somali (Soomaali)</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={s.section}>
        <h2 className={s.sectionTitle}>Three ways to transcribe</h2>
        <p className={s.sectionSubtitle}>
          Whether it's a live meeting, an uploaded recording, or a YouTube video — Polyglot Scribe handles it.
        </p>
        <div className={s.features}>
          <div className={s.feat}>
            <div className={s.featIcon}>🎙️</div>
            <div className={s.featTitle}>Live transcription</div>
            <div className={s.featDesc}>
              Speak into your microphone and watch words appear in real time with ultra-low latency.
              Perfect for meetings, lectures, interviews, and dictation.
            </div>
          </div>
          <div className={s.feat}>
            <div className={s.featIcon}>📁</div>
            <div className={s.featTitle}>Audio & video files</div>
            <div className={s.featDesc}>
              Drop an MP3, WAV, M4A, MP4, or any audio/video file. Get an accurate transcript
              powered by ElevenLabs Scribe v2.
            </div>
          </div>
          <div className={s.feat}>
            <div className={s.featIcon}>▶️</div>
            <div className={s.featTitle}>YouTube videos</div>
            <div className={s.featDesc}>
              Paste any YouTube URL to instantly pull its captions. Then translate them and
              listen back in your preferred language.
            </div>
          </div>
          <div className={s.feat}>
            <div className={s.featIcon}>🌍</div>
            <div className={s.featTitle}>Side-by-side translation</div>
            <div className={s.featDesc}>
              Translate any transcript between English, Amharic, Afaan Oromo, and Somali — view
              the original and translation side-by-side.
            </div>
          </div>
          <div className={s.feat}>
            <div className={s.featIcon}>🔊</div>
            <div className={s.featTitle}>Natural text-to-speech</div>
            <div className={s.featDesc}>
              Listen to any transcript or translation in a natural human voice powered by ElevenLabs
              multilingual TTS.
            </div>
          </div>
          <div className={s.feat}>
            <div className={s.featIcon}>📚</div>
            <div className={s.featTitle}>Saved history</div>
            <div className={s.featDesc}>
              Every transcription is securely saved to your account. Revisit, copy, download, or
              re-translate anything from your history.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className={s.section} style={{ paddingTop: 0 }}>
        <h2 className={s.sectionTitle}>How it works</h2>
        <p className={s.sectionSubtitle}>From sound to translated text in four simple steps.</p>
        <div className={s.steps}>
          <div className={s.step}>
            <div className={s.stepNum}>1</div>
            <div className={s.stepTitle}>Sign up</div>
            <div className={s.stepDesc}>Create a free account with your email — takes less than a minute.</div>
          </div>
          <div className={s.step}>
            <div className={s.stepNum}>2</div>
            <div className={s.stepTitle}>Pick your source</div>
            <div className={s.stepDesc}>Record live, upload an audio/video file, or paste a YouTube URL.</div>
          </div>
          <div className={s.step}>
            <div className={s.stepNum}>3</div>
            <div className={s.stepTitle}>Translate</div>
            <div className={s.stepDesc}>Choose a target language and get an accurate translation in seconds.</div>
          </div>
          <div className={s.step}>
            <div className={s.stepNum}>4</div>
            <div className={s.stepTitle}>Listen, copy or save</div>
            <div className={s.stepDesc}>Play with TTS, copy, download as text, or revisit anytime in your history.</div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="cases" className={s.section} style={{ paddingTop: 0 }}>
        <h2 className={s.sectionTitle}>Built for everyone</h2>
        <p className={s.sectionSubtitle}>Scribe works for journalists, students, podcasters, businesses, and beyond.</p>
        <div className={s.cases}>
          <div className={s.case}>
            <div className={s.caseEmoji}>📰</div>
            <div className={s.caseText}>
              <div className={s.caseTitle}>Journalists & researchers</div>
              <div className={s.caseDesc}>Transcribe interviews, then translate quotes for multilingual audiences.</div>
            </div>
          </div>
          <div className={s.case}>
            <div className={s.caseEmoji}>🎓</div>
            <div className={s.caseText}>
              <div className={s.caseTitle}>Students & teachers</div>
              <div className={s.caseDesc}>Capture lectures live or transcribe educational YouTube videos in your language.</div>
            </div>
          </div>
          <div className={s.case}>
            <div className={s.caseEmoji}>🎙️</div>
            <div className={s.caseText}>
              <div className={s.caseTitle}>Podcasters & creators</div>
              <div className={s.caseDesc}>Generate accurate show notes and translated subtitles to grow your audience.</div>
            </div>
          </div>
          <div className={s.case}>
            <div className={s.caseEmoji}>💼</div>
            <div className={s.caseText}>
              <div className={s.caseTitle}>Teams & businesses</div>
              <div className={s.caseDesc}>Document meetings live and share them across multilingual teams in Ethiopia and beyond.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaSection}>
        <div className={s.ctaSectionInner}>
          <h2 className={s.ctaSectionTitle}>Ready to start transcribing?</h2>
          <p className={s.ctaSectionDesc}>
            Create your free account and turn voice into text and translation in seconds.
          </p>
          <Link to="/auth" className={s.ctaWhite}>Get started — it's free</Link>
        </div>
      </section>

      <footer className={s.footer}>
        © {new Date().getFullYear()} Polyglot Scribe · Live, file, and YouTube transcription with translation.
      </footer>
    </div>
  );
}
