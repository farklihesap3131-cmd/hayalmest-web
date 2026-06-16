"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./admin.module.css";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Coffee,
  List,
  Mic2,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === "/admin/login") {
    return children;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/admin/events", label: "Etkinlik & Takvim", icon: <Calendar size={20} /> },
    { href: "/admin/artists", label: "Sanatçılar", icon: <Mic2 size={20} /> },
    { href: "/admin/reservations", label: "Rezervasyonlar", icon: <List size={20} /> },
    { href: "/admin/menu", label: "Menü Yönetimi", icon: <Coffee size={20} /> },
    { href: "/admin/gallery", label: "Galeri (Anılar)", icon: <ImageIcon size={20} /> },
    { href: "/admin/settings", label: "Ayarlar", icon: <Settings size={20} /> },
  ];

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>HayalMest Admin</h2>
          <button 
            className={styles.mobileCloseBtn}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/admin/login' })}>
            <LogOut size={20} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <div className={styles.topbar}>
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className={styles.topbarTitle}>Yönetim Paneli</div>
        </div>
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
