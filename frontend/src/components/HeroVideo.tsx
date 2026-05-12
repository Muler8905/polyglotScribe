import { useEffect, useRef } from "react";
import s from "./HeroVideo.module.css";
import heroVideoSrc from "@/assets/hero_video.mp4";

export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly set defaultMuted to appease strict browser autoplay policies
    video.defaultMuted = true;
    video.muted = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only restart if the video is paused (to avoid interrupting if already playing)
            if (video.paused) {
               video.currentTime = 0;
               video.play().catch((e) => console.log("Video auto-play failed:", e));
            }
          } else {
            // Pause when scrolled out of view
            video.pause();
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the video is visible
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={s.wrap} ref={containerRef} aria-label="Hero video">
      <video
        ref={videoRef}
        className={s.video}
        // Using the imported video asset
        src={heroVideoSrc}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className={s.overlay} />
    </div>
  );
}
