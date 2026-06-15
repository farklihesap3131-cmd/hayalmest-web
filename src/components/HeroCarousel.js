"use client";

import { useState, useEffect } from "react";
import styles from "./HeroCarousel.module.css";
import Link from "next/link";

export function HeroCarousel({ events, backgroundImages }) {
  const [currentBg, setCurrentBg] = useState(0);
  const [currentEvent, setCurrentEvent] = useState(0);

  // If no events are passed from the DB, we provide a beautiful default placeholder
  const displayEvents = events && events.length > 0 ? events : [
    {
      id: "placeholder-1",
      title: "Premium Türkü Bar Gecesi",
      date: new Date().toISOString(),
      posterUrl: "/assets/images/bdf870_a1401b7cf6044c358c19292fdea2a50cf000.jpg",
      artist: {
        name: "Sürpriz Sanatçılarla Canlı Müzik",
      }
    }
  ];

  useEffect(() => {
    if (!backgroundImages || backgroundImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 6000); // Change bg every 6 seconds
    return () => clearInterval(interval);
  }, [backgroundImages]);

  useEffect(() => {
    if (!displayEvents || displayEvents.length === 0) return;
    const interval = setInterval(() => {
      setCurrentEvent((prev) => (prev + 1) % displayEvents.length);
    }, 5000); // Change event every 5 seconds
    return () => clearInterval(interval);
  }, [displayEvents]);

  const waNumber = "905305012458";

  return (
    <div className={styles.heroWrapper}>
      {/* Background Images with Ken Burns */}
      {backgroundImages && backgroundImages.map((src, index) => (
        <div
          key={src}
          className={`${styles.bgImage} ${index === currentBg ? styles.activeBg : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className={styles.overlay} />

      {/* Hero Content */}
      <div className={styles.content} data-animate="true">
        <h1 className={styles.mainTitle}>HayalMest</h1>
        <div className={styles.divider}></div>
        <p className={styles.subtitle}>Premium Türkü Bar & Restoran</p>

        {/* Featured Events Carousel */}
        <div className={styles.eventCarousel}>
          {displayEvents.map((evt, index) => {
            const isActive = index === currentEvent;
            return (
              <div
                key={evt.id}
                className={`${styles.eventSlide} ${isActive ? styles.activeEvent : ""}`}
              >
                <div className={styles.eventPosterWrapper}>
                  {evt.posterUrl || evt.artist?.photoUrl ? (
                    <img
                      src={evt.posterUrl || evt.artist?.photoUrl}
                      alt={evt.title}
                      className={styles.eventPoster}
                    />
                  ) : (
                    <div className={styles.posterPlaceholder}>
                      <span>HayalMest</span>
                    </div>
                  )}
                </div>
                <div className={styles.eventDetails}>
                  <h2 className={styles.eventTitle}>{evt.artist?.name || evt.title}</h2>
                  <p className={styles.eventDate}>
                    {new Date(evt.date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      weekday: "long",
                    })}
                  </p>
                  <Link
                    href={`https://wa.me/${waNumber}?text=Merhaba,%20${encodeURIComponent(evt.artist?.name || evt.title)}%20etkinliği%20için%20rezervasyon%20yaptırmak%20istiyorum.`}
                    target="_blank"
                    className={styles.vipBtn}
                  >
                    VIP Masanızı Ayırtın
                  </Link>
                </div>
              </div>
            );
          })}
          
          {displayEvents.length > 1 && (
            <div className={styles.eventControls}>
              {displayEvents.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === currentEvent ? styles.activeDot : ""}`}
                  onClick={() => setCurrentEvent(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
