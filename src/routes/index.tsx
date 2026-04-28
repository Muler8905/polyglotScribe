import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import s from "@/components/Landing.module.css";
import { ThemeToggle } from "@/components/ThemeToggle";

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
          "Real-time microphone transcription, audio file transcription, and YouTube audio transcription with side-by-side translation across English, Amharic, Afaan Oromo, and Somali.",
      },
      { property: "og:title", content: "Polyglot Scribe — Speech, File & YouTube Transcription" },
      { property: "og:description", content: "Transcribe and translate any voice, audio file, or YouTube video in 4 languages." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

// Morpho-style spring motion: soft, bouncy, organic
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.94, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.08,
      type: "spring",
      stiffness: 120,
      damping: 14,
      mass: 0.8,
    },
  }),
};

const features = [
  { icon: "🎙️", title: "Live transcription", desc: "Speak into your microphone and watch words appear in real time with ultra-low latency. Perfect for meetings, lectures, interviews, and dictation." },
  { icon: "📁", title: "Audio & video files", desc: "Drop an MP3, WAV, M4A, MP4, or any audio/video file. Get an accurate transcript powered by ElevenLabs Scribe v2." },
  { icon: "▶️", title: "YouTube videos", desc: "Paste any YouTube URL — we transcribe the spoken audio directly, no captions required. Translate and listen back in your preferred language." },
  { icon: "🌍", title: "Side-by-side translation", desc: "Translate any transcript between English, Amharic, Afaan Oromo, and Somali — view the original and translation side-by-side." },
  { icon: "🔊", title: "Natural text-to-speech", desc: "Listen to any transcript or translation in a natural human voice powered by ElevenLabs multilingual TTS." },
  { icon: "📚", title: "Saved history", desc: "Every transcription is securely saved to your account. Revisit, copy, download, or re-translate anything from your history." },
];

const steps = [
  { n: 1, title: "Sign up", desc: "Create a free account with your email — takes less than a minute." },
  { n: 2, title: "Pick your source", desc: "Record live, upload an audio/video file, or paste a YouTube URL." },
  { n: 3, title: "Translate", desc: "Choose a target language and get an accurate translation in seconds." },
  { n: 4, title: "Listen, copy or save", desc: "Play with TTS, copy, download as text, or revisit anytime in your history." },
];

const cases = [
  { emoji: "📰", title: "Journalists & researchers", desc: "Transcribe interviews, then translate quotes for multilingual audiences." },
  { emoji: "🎓", title: "Students & teachers", desc: "Capture lectures live or transcribe educational YouTube videos in your language." },
  { emoji: "🎙️", title: "Podcasters & creators", desc: "Generate accurate show notes and translated subtitles to grow your audience." },
  { emoji: "💼", title: "Teams & businesses", desc: "Document meetings live and share them across multilingual teams in Ethiopia and beyond." },
];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link to="/docs" className={s.navLink}>Docs</Link>
          <Link to="/support" className={s.navLink}>Support</Link>
          <ThemeToggle />
          <Link to="/auth" className={`${s.linkBtn} ${s.linkGhost}`}>Sign in</Link>
          <Link to="/auth" className={`${s.linkBtn} ${s.linkPrimary}`}>Get started</Link>
        </nav>
        <div className={s.navMobileTools}>
          <ThemeToggle />
          <button
            className={s.menuBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`${s.mobileMenu} ${menuOpen ? s.open : ""}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#cases" onClick={() => setMenuOpen(false)}>Use cases</a>
        <Link to="/docs" onClick={() => setMenuOpen(false)}>Documentation</Link>
        <Link to="/support" onClick={() => setMenuOpen(false)}>Support</Link>
        <Link to="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link>
        <Link to="/auth" onClick={() => setMenuOpen(false)} className={`${s.linkBtn} ${s.linkPrimary}`} style={{ textAlign: "center", marginTop: "0.5rem" }}>Get started</Link>
      </div>

      {/* HERO */}
      <section className={s.hero}>
        <motion.div
          className={s.heroInner}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 16 }}
        >
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
            Real-time microphone transcription, audio-file transcription, and YouTube audio transcription —
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
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className={s.section}>
        <h2 className={s.sectionTitle}>Three ways to transcribe</h2>
        <p className={s.sectionSubtitle}>
          Whether it's a live meeting, an uploaded recording, or a YouTube video — Polyglot Scribe handles it.
        </p>
        <div className={s.features}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={s.feat}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ y: -6, scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 18 } }}
            >
              <div className={s.featIcon}>{f.icon}</div>
              <div className={s.featTitle}>{f.title}</div>
              <div className={s.featDesc}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className={s.section} style={{ paddingTop: 0 }}>
        <h2 className={s.sectionTitle}>How it works</h2>
        <p className={s.sectionSubtitle}>From sound to translated text in four simple steps.</p>
        <div className={s.steps}>
          {steps.map((st, i) => (
            <motion.div
              key={st.n}
              className={s.step}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ y: -4, scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 18 } }}
            >
              <div className={s.stepNum}>{st.n}</div>
              <div className={s.stepTitle}>{st.title}</div>
              <div className={s.stepDesc}>{st.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section id="cases" className={s.section} style={{ paddingTop: 0 }}>
        <h2 className={s.sectionTitle}>Built for everyone</h2>
        <p className={s.sectionSubtitle}>Scribe works for journalists, students, podcasters, businesses, and beyond.</p>
        <div className={s.cases}>
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              className={s.case}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ y: -4, scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 18 } }}
            >
              <div className={s.caseEmoji}>{c.emoji}</div>
              <div className={s.caseText}>
                <div className={s.caseTitle}>{c.title}</div>
                <div className={s.caseDesc}>{c.desc}</div>
              </div>
            </motion.div>
          ))}
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

      {/* FOOTER */}
      <footer className={s.footerWrap}>
        <div className={s.footerInner}>
          <div className={s.footerGrid}>
            <div className={s.footerCol}>
              <Link to="/" className={s.footerBrand}>
                <div className={s.brandMark} />
                <span>Polyglot Scribe</span>
              </Link>
              <p className={s.footerTagline}>
                Live, file, and YouTube transcription with multilingual translation across English, Amharic, Afaan Oromo, and Somali.
              </p>
            </div>
            <div className={s.footerCol}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#cases">Use cases</a>
              <Link to="/auth">Sign in</Link>
            </div>
            <div className={s.footerCol}>
              <h4>Resources</h4>
              <Link to="/docs">Documentation</Link>
              <Link to="/support">Support</Link>
              <a href="mailto:support@polyglotscribe.app">Contact us</a>
            </div>
            <div className={s.footerCol}>
              <h4>Legal</h4>
              <Link to="/privacy">Privacy policy</Link>
              <Link to="/docs">Terms of use</Link>
            </div>
          </div>
          <div className={s.footerBottom}>
            <span>© {new Date().getFullYear()} Polyglot Scribe. All rights reserved.</span>
            <span>Made with ❤️ for multilingual creators</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
