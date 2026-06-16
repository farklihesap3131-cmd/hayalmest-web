import { ArtistCards } from "@/components/ArtistCards";
import { GSAPAnimations } from "@/components/GSAPAnimations";
import { Hero } from "@/components/Hero";
import { IntroSection } from "@/components/IntroSection";
import { ReservationForm } from "@/components/ReservationForm";
import { Timeline } from "@/components/Timeline";
import { MenuTabs } from "@/components/MenuTabs";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./home.module.css";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  // Fetch ALL Events (Past and Future) for the Timeline
  const allEvents = await prisma.event.findMany({
    include: { artist: true },
    orderBy: { date: "asc" },
  });

  // Fetch Artists for Artist Cards
  const artists = await prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Fetch Menu
  const menuCategories = await prisma.menuCategory.findMany({
    include: { items: true },
  });

  // Fetch Gallery (Memories)
  const memories = await prisma.memory.findMany({
    where: { showOnHome: true },
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  // Fetch Settings (for Hero Backgrounds)
  const settingsArray = await prisma.setting.findMany();
  const settingsMap = {};
  settingsArray.forEach((s) => { settingsMap[s.key] = s.value; });

  const WA_NUMBER = "905305012458";

  // Provide fallback images if memory DB is empty
  const defaultImages = [
    "/assets/images/bdf870_12ef2e747fa64270b2f6050aa0f3251df000.jpg",
    "/assets/images/bdf870_313c1814971846f9bb0a114640849334f000.jpg",
    "/assets/images/bdf870_0b8e843db66a448c9097e2c12257b4e9f000.jpg",
    "/assets/images/bdf870_27bf7cec6c0d4e35b34cc9cabb4d0fb1f000.jpg",
    "/assets/images/bdf870_2acff29e15614097944c83e9845b2781f000.jpg",
    "/assets/images/bdf870_40f621e295184a64af2830762f3ae943f000.jpg",
  ];

  let adminHeroBgs = [];
  if (settingsMap["hero_backgrounds"]) {
    try {
      adminHeroBgs = JSON.parse(settingsMap["hero_backgrounds"]);
    } catch(e) {}
  }

  // 1. If admin set backgrounds, use them
  // 2. If no admin backgrounds, fallback to gallery images
  // 3. If no gallery images, fallback to defaultImages
  const backgroundImages = adminHeroBgs.length > 0 
    ? adminHeroBgs 
    : (memories.length > 0 
        ? memories.filter((m) => m.type === "IMAGE").map((m) => m.url).slice(0, 5)
        : defaultImages.slice(0, 5)
      );

  const galleryMemories = memories.length > 0
    ? memories
    : defaultImages.map((url, idx) => ({ id: idx, type: "IMAGE", url }));

  return (
    <GSAPAnimations>
      <main className={styles.mainContainer}>
        
        {/* ─── HERO ─── */}
        <Hero backgroundImages={backgroundImages} />

        {/* ─── INTRO SECTION (Tanıtım Girişi) ─── */}
        <IntroSection />

        {/* ─── ARTIST TIMELINE SECTION ─── */}
        <section className={styles.section} id="takvim" style={{ padding: "0", overflow: "hidden" }}>
          <div data-animate="true" className={styles.sectionHeader} style={{ marginTop: "6rem" }}>
            <h2 className={styles.sectionTitle}>Sanatçı Takvimi</h2>
            <div className={styles.titleDivider}></div>
            <p className={styles.sectionSubtitle}>Sağa kaydırarak gelecek, sola sürükleyerek geçmiş etkinlikleri keşfedin.</p>
          </div>
          
          <div data-animate="true" style={{ width: "100%" }}>
            <Timeline events={allEvents} />
          </div>
        </section>

        {/* ─── ARTIST CARDS SECTION ─── */}
        <ArtistCards artists={artists} />

        {/* ─── RESERVATION SECTION ─── */}
        <section className={styles.reservationSection} id="rezervasyon">
          <div className={styles.reservationBg} data-parallax="true"></div>
          <div className={styles.reservationContent} data-animate="true">
            <ReservationForm />
          </div>
        </section>

        {/* ─── MENU SECTION ─── */}
        <section className={styles.section} id="menu" style={{ backgroundColor: "#080808" }}>
          <div data-animate="true" className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Lezzetlerimiz</h2>
            <div className={styles.titleDivider}></div>
            <p className={styles.sectionSubtitle}>Şefimizin özenle hazırladığı premium lezzetler.</p>
          </div>

          <div className={styles.menuContainer} data-animate="true">
            <MenuTabs categories={menuCategories} />
          </div>
        </section>

        {/* ─── GALLERY SECTION ─── */}
        <section className={styles.section} id="galeri" style={{ backgroundColor: "#0d0d0d" }}>
          <div data-animate="true" className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Mekanımızdan Kareler</h2>
            <div className={styles.titleDivider}></div>
            <p className={styles.sectionSubtitle}>HayalMest'in sıcak atmosferi ve unutulmaz anları.</p>
          </div>
          
          <div className={styles.galleryGrid} data-animate="true">
            {galleryMemories.map((m, i) => {
              const isLarge = i === 0 || i === 5;
              return (
                <div 
                  key={m.id} 
                  className={`${styles.galleryItem} ${isLarge ? styles.galleryItemLarge : ""}`}
                >
                  {m.type === "VIDEO" ? (
                    <video src={m.url} className={styles.galleryImg} autoPlay loop muted playsInline />
                  ) : (
                    <img src={m.url} alt={m.caption || `HayalMest mekan ${i + 1}`} className={styles.galleryImg} loading="lazy" />
                  )}
                  <div className={styles.galleryOverlay}></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className={styles.footer}>
          <div data-animate="true" className={styles.footerContent}>
            <h3 className={styles.footerLogo}>HayalMest</h3>
            <p className={styles.footerText}>Premium Türkü Bar | İstanbul</p>
            <div className={styles.footerLinks}>
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href="https://www.instagram.com/hayalmest" target="_blank" rel="noreferrer">Instagram</a>
              <a href="#rezervasyon">Rezervasyon</a>
              <Link href="/admin">Yönetici Girişi</Link>
            </div>
            <p className={styles.footerCopyright}>© {new Date().getFullYear()} HayalMest. Tüm hakları saklıdır.</p>
          </div>
        </footer>

        {/* ─── WhatsApp FAB ─── */}
        <a
          href={`https://wa.me/${WA_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className={styles.waFloat}
          aria-label="WhatsApp ile iletişim"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </main>
    </GSAPAnimations>
  );
}
