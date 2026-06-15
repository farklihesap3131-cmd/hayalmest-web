"use client";

import { useState, useEffect } from "react";
import styles from "./Hero.module.css";
import Link from "next/link";

export function Hero({ backgroundImages }) {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    if (!backgroundImages || backgroundImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 6000); // Change bg every 6 seconds
    return () => clearInterval(interval);
  }, [backgroundImages]);

  // Using the user-provided logo
  const logoUrl = "/assets/images/hayalmest-logo-new.png";

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

      {/* Hero Content - Logo Focused */}
      <div className={styles.content} data-animate="true">
        <img src={logoUrl} alt="HayalMest Logo" className={styles.mainLogo} onError={(e) => e.target.style.display = 'none'} />
        <h1 className={styles.mainTitleFallback}>HayalMest</h1>
        <div className={styles.divider}></div>
        <p className={styles.subtitle}>Hayatın En Özel Anlarını Kutlayın</p>
        <div className={styles.actionButtons}>
          <a href="#takvim" className={styles.primaryBtn}>Sanatçı Takvimi</a>
          <a href="#rezervasyon" className={styles.secondaryBtn}>Rezervasyon Yap</a>
        </div>
      </div>
      
      <div className={styles.scrollIndicator}>
        <div className={styles.mouse}>
          <div className={styles.wheel}></div>
        </div>
        <div>Aşağı Kaydır</div>
      </div>
    </div>
  );
}
