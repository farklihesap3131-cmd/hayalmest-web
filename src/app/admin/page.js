"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ events: 0, artists: 0, pendingRes: 0, totalRes: 0, gallery: 0, menuCats: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const [evRes, arRes, resRes, galRes, menuRes] = await Promise.all([
          fetch("/api/admin/events").then(r => r.json()).catch(() => []),
          fetch("/api/admin/artists").then(r => r.json()).catch(() => []),
          fetch("/api/admin/reservations").then(r => r.json()).catch(() => []),
          fetch("/api/admin/gallery").then(r => r.json()).catch(() => []),
          fetch("/api/admin/menu").then(r => r.json()).catch(() => []),
        ]);
        setStats({
          events: evRes.length || 0,
          artists: arRes.length || 0,
          pendingRes: (resRes.filter?.(r => r.status === "PENDING") || []).length,
          totalRes: resRes.length || 0,
          gallery: galRes.length || 0,
          menuCats: menuRes.length || 0,
        });
      } catch (e) {
        console.error("Stats fetch error", e);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: "Yaklaşan Etkinlikler", value: stats.events, href: "/admin/events", color: "#D4AF37" },
    { label: "Bekleyen Rezervasyonlar", value: stats.pendingRes, href: "/admin/reservations", color: stats.pendingRes > 0 ? "#ff9900" : "#28a745" },
    { label: "Toplam Rezervasyonlar", value: stats.totalRes, href: "/admin/reservations", color: "#6c63ff" },
    { label: "Kayıtlı Sanatçılar", value: stats.artists, href: "/admin/artists", color: "#2563eb" },
    { label: "Galeri Medyaları", value: stats.gallery, href: "/admin/gallery", color: "#e91e63" },
    { label: "Menü Kategorileri", value: stats.menuCats, href: "/admin/menu", color: "#00bcd4" },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: "2rem", color: "#333" }}>Hoş Geldiniz, HayalMest Yönetimi</h1>
      <div className={styles.grid}>
        {cards.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: "none" }}>
            <div className={styles.card} style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderLeft: `4px solid ${card.color}` }}>
              <div className={styles.cardTitle}>{card.label}</div>
              <div className={styles.cardValue} style={{ color: card.color }}>{card.value}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
