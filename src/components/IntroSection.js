"use client";

import styles from "./IntroSection.module.css";
import { Coffee, Music, Heart } from "lucide-react";

export function IntroSection() {
  const cards = [
    {
      id: 1,
      title: "Her Anınıza Değer Katıyoruz",
      desc: "Sadece lezzetli yemeklerimizle değil; sunduğumuz sıcak atmosfer, şık dekorasyon ve özenli hizmetimizle de özel anlarınızı daha anlamlı kılıyoruz.",
      icon: <Coffee size={40} strokeWidth={1.5} />,
    },
    {
      id: 2,
      title: "Davetlerde Fark Yaratın",
      desc: "Doğum günü, yıl dönümleri, nişan veya iş toplantıları… Her organizasyona özel menülerimiz ve DJ/canlı müzik seçeneklerimizle yanınızdayız.",
      icon: <Music size={40} strokeWidth={1.5} />,
    },
    {
      id: 3,
      title: "Sizin Hayaliniz, Önceliğimiz",
      desc: "Siz hayal edin, biz gerçeğe dönüştürelim! Organizasyon danışmanlarımız her aşamada yanınızda olarak kusursuz bir gece planlıyor.",
      icon: <Heart size={40} strokeWidth={1.5} />,
    }
  ];

  return (
    <section className={styles.introSection}>
      <div className={styles.container}>
        <div className={styles.header} data-animate="true">
          <h2 className={styles.title}>Hayatın En Özel Anlarını Kutlayın</h2>
          <div className={styles.divider}></div>
          <p className={styles.subtitle}>
            İster romantik bir akşam yemeği, ister eğlenceli bir parti... 
            HayalMest bu unutulmaz anlarınıza ev sahipliği yapmak için sizi bekliyor.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className={styles.card} 
              data-animate="true" 
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={styles.iconWrapper}>
                {card.icon}
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
