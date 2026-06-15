"use client";

import styles from "./ArtistCards.module.css";
import { useEffect, useRef } from "react";

export function ArtistCards({ artists }) {
  const containerRef = useRef(null);

  // Mouse drag-to-scroll functionality for desktop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.style.cursor = "grabbing";
    };

    const onMouseLeave = () => {
      isDown = false;
      container.style.cursor = "grab";
    };

    const onMouseUp = () => {
      isDown = false;
      container.style.cursor = "grab";
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    // Horizontal scroll with mouse wheel
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  if (!artists || artists.length === 0) return null;

  const isVideo = (url) => url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));

  return (
    <section className={styles.artistSection} id="sanatcilar">
      <div className={styles.sectionHeader} data-animate="true">
        <h2 className={styles.sectionTitle}>Sanatçılarımız</h2>
        <div className={styles.titleDivider}></div>
        <p className={styles.sectionSubtitle}>HayalMest sahnesinin vazgeçilmez sesleri.</p>
      </div>

      <div className={styles.cardsContainer} ref={containerRef} style={{ cursor: "grab" }}>
        {artists.map((artist) => {
          const mediaUrl = artist.photoUrl || artist.photo;
          if (!mediaUrl) return null; // Only show artists with media

          return (
            <div key={artist.id || artist._id} className={styles.card}>
              <div className={styles.mediaWrapper}>
                {isVideo(mediaUrl) ? (
                  <video
                    src={mediaUrl}
                    className={styles.media}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img src={mediaUrl} alt={artist.name} className={styles.media} />
                )}
                
                <div className={styles.overlay}>
                  <h3 className={styles.artistName}>{artist.name}</h3>
                  {artist.bio && <p className={styles.artistBio}>{artist.bio}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
