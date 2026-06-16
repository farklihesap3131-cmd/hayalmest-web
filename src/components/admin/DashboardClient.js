"use client";

import Link from "next/link";
import styles from "../../app/admin/admin.module.css";

export function DashboardClient({ stats, upcomingEvents, pendingReservations, density }) {
  // Density is an array of { date: 'YYYY-MM-DD', count: N }
  const maxDensity = density.length > 0 ? Math.max(...density.map(d => d.count)) : 1;

  const getStatusBadge = (status) => {
    switch(status) {
      case "PENDING": return <span className={`${styles.badge} ${styles.badgePending}`}>Bekliyor</span>;
      case "APPROVED": return <span className={`${styles.badge} ${styles.badgeApproved}`}>Onaylandı</span>;
      case "REJECTED": return <span className={`${styles.badge} ${styles.badgeRejected}`}>Reddedildi</span>;
      default: return null;
    }
  };

  const cards = [
    { label: "Yaklaşan Etkinlikler", value: stats.events, href: "/admin/events", color: "#D4AF37" },
    { label: "Bekleyen Rezervasyon", value: stats.pendingRes, href: "/admin/reservations", color: stats.pendingRes > 0 ? "#f59e0b" : "#10b981" },
    { label: "Toplam Rezervasyon", value: stats.totalRes, href: "/admin/reservations", color: "#6c63ff" },
    { label: "Galeri / Menü", value: `${stats.gallery} / ${stats.menuCats}`, href: "/admin/gallery", color: "#e91e63" },
  ];

  return (
    <div className={styles.dashboardLayout}>
      <h1 style={{ color: "#333", margin: 0 }}>Sistem Özeti</h1>
      
      {/* Top Stats */}
      <div className={styles.grid}>
        {cards.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: "none" }}>
            <div className={styles.card} style={{ cursor: "pointer", transition: "transform 0.2s", borderLeft: `4px solid ${card.color}` }}>
              <div className={styles.cardTitle}>{card.label}</div>
              <div className={styles.cardValue} style={{ color: card.color }}>{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.panelsGrid}>
        
        {/* Left Column: Upcoming Events & Density */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Önümüzdeki Günlerin Yoğunluğu</span>
            </div>
            {density.length === 0 ? (
              <p style={{ color: "#888", fontSize: "0.9rem" }}>Önümüzdeki günlerde rezervasyon bulunmuyor.</p>
            ) : (
              <div>
                {density.map((d) => (
                  <div key={d.date} className={styles.barContainer}>
                    <span className={styles.barLabel}>{new Date(d.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${(d.count / maxDensity) * 100}%` }}></div>
                    </div>
                    <span className={styles.barValue}>{d.count} Kişi</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Yaklaşan Etkinlikler</span>
              <Link href="/admin/events" style={{ fontSize: "0.85rem", color: "#D4AF37", textDecoration: "none" }}>Tümünü Gör</Link>
            </div>
            <div className={styles.list}>
              {upcomingEvents.length === 0 ? (
                <p style={{ color: "#888", fontSize: "0.9rem" }}>Yaklaşan etkinlik yok.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div key={evt.id} className={styles.listItem}>
                    <div className={styles.itemLeft}>
                      <span className={styles.itemTitle}>{evt.artist?.name || evt.title}</span>
                      <span className={styles.itemSub}>{new Date(evt.date).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column: Pending Reservations */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Son Bekleyen Rezervasyonlar</span>
            <Link href="/admin/reservations" style={{ fontSize: "0.85rem", color: "#D4AF37", textDecoration: "none" }}>Tümüne Git</Link>
          </div>
          <div className={styles.list}>
            {pendingReservations.length === 0 ? (
              <p style={{ color: "#888", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>Bekleyen rezervasyon bulunmuyor. Harika! 🎉</p>
            ) : (
              pendingReservations.map((res) => (
                <div key={res.id} className={styles.listItem} style={{ alignItems: "flex-start" }}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemTitle}>{res.name} <span style={{ fontWeight: "normal", color: "#666" }}>- {res.guestCount} Kişi</span></span>
                    <span className={styles.itemSub}>Tel: {res.phone}</span>
                    <span className={styles.itemSub}>Tarih: {new Date(res.date).toLocaleDateString('tr-TR')}</span>
                    {res.note && <span className={styles.itemSub} style={{ fontStyle: "italic", marginTop: "4px" }}>"{res.note}"</span>}
                  </div>
                  <div className={styles.itemRight}>
                    {getStatusBadge(res.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
