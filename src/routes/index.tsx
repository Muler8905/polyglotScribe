import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import s from "@/components/Landing.module.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroVideo } from "@/components/HeroVideo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      if (apiClient.isAuthenticated()) throw redirect({ to: "/dashboard" });
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

const featureItems = [
  { icon: "🎙️", key: "live" },
  { icon: "📁", key: "file" },
  { icon: "▶️", key: "yt" },
  { icon: "🌍", key: "translate" },
  { icon: "🔊", key: "tts" },
  { icon: "📚", key: "history" },
] as const;

const stepItems = [
  { n: 1, key: "s1" },
  { n: 2, key: "s2" },
  { n: 3, key: "s3" },
  { n: 4, key: "s4" },
] as const;

const caseItems = [
  { emoji: "📰", key: "journalists" },
  { emoji: "🎓", key: "students" },
  { emoji: "🎙️", key: "podcasters" },
  { emoji: "💼", key: "teams" },
] as const;

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className={s.page}>
      <header className={s.nav}>
        <Link to="/" className={s.brand}>
          <div className={s.brandMark} />
          <span>Polyglot Scribe</span>
        </Link>
        <nav className={s.navLinks}>
          <a href="#features" className={s.navLink}>{t("nav.features")}</a>
          <a href="#how" className={s.navLink}>{t("nav.how")}</a>
          <a href="#cases" className={s.navLink}>{t("nav.cases")}</a>
          <ThemeToggle />
          <LanguageSwitcher />
          <Link to="/auth" className={`${s.linkBtn} ${s.linkGhost}`}>{t("nav.signin")}</Link>
          <Link to="/auth" className={`${s.linkBtn} ${s.linkPrimary}`}>{t("nav.getStarted")}</Link>
        </nav>
        <div className={s.navMobileTools}>
          <LanguageSwitcher compact />
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
        <a href="#features" onClick={() => setMenuOpen(false)}>{t("nav.features")}</a>
        <a href="#how" onClick={() => setMenuOpen(false)}>{t("nav.how")}</a>
        <a href="#cases" onClick={() => setMenuOpen(false)}>{t("nav.cases")}</a>
        <Link to="/docs" onClick={() => setMenuOpen(false)}>{t("nav.documentation")}</Link>
        <Link to="/support" onClick={() => setMenuOpen(false)}>{t("nav.support")}</Link>
        <Link to="/privacy" onClick={() => setMenuOpen(false)}>{t("nav.privacy")}</Link>
        <Link to="/auth" onClick={() => setMenuOpen(false)} className={`${s.linkBtn} ${s.linkPrimary}`} style={{ textAlign: "center", marginTop: "0.5rem" }}>{t("nav.getStarted")}</Link>
      </div>

      {/* HERO */}
      <section className={s.hero}>
        <HeroVideo />
        <div className={s.heroContainer}>
          <motion.div
            className={s.heroInner}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 16 }}
          >
            <span className={s.kicker}>
              <span className={s.dot} />
              {t("hero.kicker")}
            </span>
            <h1 className={s.title} style={{ width: "100%" }}>
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 80, damping: 15 }}
                style={{ textAlign: "left" }}
              >
                {t("hero.title1")}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 80, damping: 15 }}
                style={{ textAlign: "center", paddingLeft: "15%" }}
              >
                {t("hero.title2")} <span className={s.gradient}>{t("hero.title3")}</span>.
              </motion.div>
            </h1>
            <p className={s.subtitle}>{t("hero.subtitle")}</p>
            <div className={s.ctaRow}>
              <Link to="/auth" className={s.cta}>{t("hero.ctaPrimary")}</Link>
              <a href="#features" className={s.ctaSecondary}>{t("hero.ctaSecondary")}</a>
            </div>
            <div className={s.languages}>
              <span className={s.langBadge}>🇬🇧 English</span>
              <span className={s.langBadge}>🇪🇹 Amharic (አማርኛ)</span>
              <span className={s.langBadge}>🇪🇹 Afaan Oromo</span>
              <span className={s.langBadge}>🇸🇴 Somali (Soomaali)</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={s.section}>
        <h2 className={s.sectionTitle}>{t("sections.featuresTitle")}</h2>
        <p className={s.sectionSubtitle}>{t("sections.featuresSubtitle")}</p>
        <div className={s.features}>
          {featureItems.map((f, i) => (
            <motion.div
              key={f.key}
              className={s.feat}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ y: -6, scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 18 } }}
            >
              <div className={s.featIcon}>{f.icon}</div>
              <div className={s.featTitle}>{t(`features.${f.key}Title`)}</div>
              <div className={s.featDesc}>{t(`features.${f.key}Desc`)}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className={s.section} style={{ paddingTop: 0 }}>
        <h2 className={s.sectionTitle}>{t("sections.howTitle")}</h2>
        <p className={s.sectionSubtitle}>{t("sections.howSubtitle")}</p>
        <div className={s.steps}>
          {stepItems.map((st, i) => (
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
              <div className={s.stepTitle}>{t(`steps.${st.key}Title`)}</div>
              <div className={s.stepDesc}>{t(`steps.${st.key}Desc`)}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section id="cases" className={s.section} style={{ paddingTop: 0 }}>
        <h2 className={s.sectionTitle}>{t("sections.casesTitle")}</h2>
        <p className={s.sectionSubtitle}>{t("sections.casesSubtitle")}</p>
        <div className={s.cases}>
          {caseItems.map((c, i) => (
            <motion.div
              key={c.key}
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
                <div className={s.caseTitle}>{t(`cases.${c.key}Title`)}</div>
                <div className={s.caseDesc}>{t(`cases.${c.key}Desc`)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaSection}>
        <div className={s.ctaSectionInner}>
          <h2 className={s.ctaSectionTitle}>{t("sections.ctaTitle")}</h2>
          <p className={s.ctaSectionDesc}>{t("sections.ctaDesc")}</p>
          <Link to="/auth" className={s.ctaWhite}>{t("sections.ctaBtn")}</Link>
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
              <p className={s.footerTagline}>{t("footer.tagline")}</p>
            </div>
            <div className={s.footerCol}>
              <h4>{t("footer.product")}</h4>
              <a href="#features">{t("nav.features")}</a>
              <a href="#how">{t("nav.how")}</a>
              <a href="#cases">{t("nav.cases")}</a>
              <Link to="/auth">{t("nav.signin")}</Link>
            </div>
            <div className={s.footerCol}>
              <h4>{t("footer.resources")}</h4>
              <Link to="/docs">{t("nav.documentation")}</Link>
              <Link to="/support">{t("nav.support")}</Link>
              <a href="mailto:support@polyglotscribe.app">{t("footer.contact")}</a>
            </div>
            <div className={s.footerCol}>
              <h4>{t("footer.legal")}</h4>
              <Link to="/privacy">{t("nav.privacy")}</Link>
              <Link to="/docs">{t("footer.terms")}</Link>
            </div>
          </div>
          <div className={s.footerBottom}>
            <span>© {new Date().getFullYear()} Polyglot Scribe. {t("footer.rights")}</span>
            <span>{t("footer.made")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
