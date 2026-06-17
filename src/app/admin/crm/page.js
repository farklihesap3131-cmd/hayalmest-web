"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";

export default function CRMPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/crm");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Müşteriler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCopyNumbers = () => {
    const activeCustomers = customers.filter(c => !c.optOut && c.phone);
    const numbers = activeCustomers.map(c => c.phone).join(",");
    
    navigator.clipboard.writeText(numbers).then(() => {
      alert(`${activeCustomers.length} numara kopyalandı!`);
    }).catch(err => {
      console.error('Kopyalama başarısız', err);
      alert('Kopyalama başarısız oldu.');
    });
  };

  const getOptOutLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/opt-out/`;
    }
    return "https://hayalmest.com/opt-out/";
  };

  // Styles
  const tableWrapperStyle = {
    background: "#fff",
    borderRadius: "8px",
    padding: "1rem",
    border: "1px solid #eaeaea",
    overflowX: "auto",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "0.95rem",
  };

  const thStyle = {
    padding: "0.85rem 1rem",
    color: "#666",
    fontWeight: 600,
    borderBottom: "2px solid #eaeaea",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
  };

  const btnPrimary = {
    padding: "0.6rem 1.2rem",
    background: "#25d366", // WhatsApp Green
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div className={styles.mobilePage}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className={styles.mobileHeader}>
        <div>
          <h1 style={{ color: "#333", fontSize: "1.5rem", margin: 0 }}>Müşteri Yönetimi (CRM)</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Geçmiş rezervasyonlardan toplanan misafir veritabanı.</p>
        </div>
        <button style={btnPrimary} onClick={handleCopyNumbers} className={styles.mobileFullWidth}>
          📱 Toplu Mesaj Numaralarını Kopyala
        </button>
      </div>

      <div style={{ background: "#e8f5e9", borderLeft: "4px solid #25d366", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1b5e20", fontSize: "1rem" }}>WhatsApp Toplu Mesaj Şablonu (Önerilen)</h3>
        <p style={{ margin: 0, color: "#2e7d32", fontSize: "0.9rem", lineHeight: "1.5" }}>
          Müşterilerinize mesaj gönderirken mesajın sonuna iptal linkini eklemelisiniz. Yukarıdaki kopyala butonuna tıkladığınızda iptal eden müşteriler <strong>otomatik olarak listeden çıkarılır.</strong><br/><br/>
          <strong>Örnek Mesaj Sonu Eki:</strong><br/>
          <span style={{ background: "#fff", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", display: "inline-block", marginTop: "4px", userSelect: "all" }}>
            Reklam ve etkinlik mesajı almak istemiyorsanız iptal linki: {getOptOutLink()}[MÜŞTERİ_NUMARANIZ]
          </span>
          <br/>
          <em style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px", display: "block" }}>Not: Çoğu WhatsApp aracı numaraları dinamik eklemeye izin vermediği için müşterilere doğrudan genel iptal sayfasını ({getOptOutLink()}) de atabilirsiniz, girdiklerinde kendi numaralarını yazarak iptal edebilirler. Veya {getOptOutLink()}[NUMARA] şeklinde parametre atayabilirsiniz.</em>
        </p>
      </div>

      <div style={tableWrapperStyle} className={styles.mobileTableWrapper}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#999" }}>Yükleniyor...</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Ad Soyad</th>
                <th style={thStyle}>Telefon</th>
                <th style={thStyle}>Rezervasyonlar</th>
                <th style={thStyle}>Onaylı Ziyaret</th>
                <th style={thStyle}>Son Ziyaret</th>
                <th style={thStyle}>İzin Durumu</th>
                <th style={thStyle}>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "2.5rem", textAlign: "center", color: "#999" }}>
                    Henüz müşteri bulunmuyor.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} style={{ transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{c.name}</td>
                    <td style={tdStyle}>{c.phone || "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{c.reservationCount}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: c.approvedReservationCount > 0 ? "#155724" : "inherit" }}>
                      {c.approvedReservationCount}
                    </td>
                    <td style={tdStyle}>
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("tr-TR") : "-"}
                    </td>
                    <td style={tdStyle}>
                      {c.optOut ? (
                        <span style={{ padding: "4px 8px", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>İptal Etti</span>
                      ) : (
                        <span style={{ padding: "4px 8px", background: "#dcfce7", color: "#166534", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>İzinli</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {c.phone && (
                        <a 
                          href={`https://wa.me/${c.phone}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "#25d366", textDecoration: "none", fontWeight: "bold", fontSize: "0.85rem" }}
                        >
                          Mesaj At
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
