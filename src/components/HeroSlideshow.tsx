import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import s from "./HeroSlideshow.module.css";

const FALLBACK = [
  { url: hero1, caption: "Capture every voice in the room" },
  { url: hero2, caption: "Studio-quality transcription" },
  { url: hero3, caption: "Built for multilingual teams" },
];

interface Slide {
  url: string;
  caption: string | null;
}

export function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK.map((f) => ({ url: f.url, caption: f.caption })));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("hero_images")
      .select("image_url, caption")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSlides(data.map((d) => ({ url: d.image_url, caption: d.caption })));
        }
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className={s.wrap} aria-label="Hero slideshow">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          className={s.slide}
          initial={{ x: "100%", opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0.6 }}
          transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
          style={{ backgroundImage: `url(${slides[index].url})` }}
        >
          <div className={s.overlay} />
          {slides[index].caption && (
            <div className={s.caption}>{slides[index].caption}</div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className={s.dots}>
        {slides.map((_, i) => (
          <button
            key={i}
            className={`${s.dot} ${i === index ? s.dotActive : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
