"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";

const STATUS_MAP = {
  PENDING: { label: "Beklemede", bg: "#FFF3CD", color: "#856404", border: "#FFEEBA" },
  APPROVED: { label: "Onaylandı", bg: "#D4EDDA", color: "#155724", border: "#C3E6CB" },
  REJECTED: { label: "Reddedildi", bg: "#F8D7DA", color: "#721C24", border: "#F5C6CB" },
};

const initialForm = { name: "", phone: "", date: "", guestCount: 1, note: "" };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ---------- Fetch ----------
  const fetchReservations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch("/api/admin/reservations");
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (err) {
      console.error("Rezervasyonlar yüklenemedi:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(() => {
      fetchReservations(false);
    }, 5000); // Her 5 saniyede bir sessizce yenile
    return () => clearInterval(interval);
  }, []);

  // ---------- Create ----------
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm(initialForm);
        await fetchReservations();
      }
    } catch (err) {
      console.error("Oluşturma hatası:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Update Status ----------
  const handleStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchReservations();
    } catch (err) {
      console.error("Durum güncelleme hatası:", err);
    }
  };

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/reservations/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteId(null);
        await fetchReservations();
      }
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  };

  // ---------- Styles ----------
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
    padding: "0.55rem 1.1rem",
    background: "#1a1a1a",
    color: "#D4AF37",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    transition: "opacity 0.2s",
  };

  const btnApprove = {
    padding: "0.35rem 0.7rem",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
    marginRight: "0.35rem",
  };

  const btnReject = {
    padding: "0.35rem 0.7rem",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
    marginRight: "0.35rem",
  };

  const btnDelete = {
    padding: "0.35rem 0.7rem",
    background: "transparent",
    color: "#dc3545",
    border: "1px solid #dc3545",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    position: "relative",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.65rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.35rem",
    fontWeight: 600,
    color: "#333",
    fontSize: "0.9rem",
  };

  // ---------- Render ----------
  return (
    <div className={styles.mobilePage}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className={styles.mobileHeader}>
        <h1 style={{ color: "#333", fontSize: "1.5rem", margin: 0 }}>Rezervasyon Yönetimi</h1>
        <button style={btnPrimary} onClick={() => setModalOpen(true)} className={styles.mobileFullWidth}>
          + Yeni Rezervasyon
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.grid} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Toplam</span>
          <span className={styles.cardValue}>{reservations.length}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Beklemede</span>
          <span className={styles.cardValue} style={{ color: "#856404" }}>
            {reservations.filter((r) => r.status === "PENDING").length}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Onaylanan</span>
          <span className={styles.cardValue} style={{ color: "#155724" }}>
            {reservations.filter((r) => r.status === "APPROVED").length}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Reddedilen</span>
          <span className={styles.cardValue} style={{ color: "#721C24" }}>
            {reservations.filter((r) => r.status === "REJECTED").length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={tableWrapperStyle}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#999" }}>Yükleniyor...</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Ad</th>
                <th style={thStyle}>Telefon</th>
                <th style={thStyle}>Tarih</th>
                <th style={thStyle}>Kişi Sayısı</th>
                <th style={thStyle}>Durum</th>
                <th style={thStyle}>Not</th>
                <th style={thStyle}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "2.5rem", textAlign: "center", color: "#999" }}>
                    Henüz rezervasyon bulunmuyor.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const badge = STATUS_MAP[r.status] || STATUS_MAP.PENDING;
                  return (
                    <tr key={r.id} style={{ transition: "background 0.15s", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => {
                        setSelectedReservation(r);
                        setDetailModalOpen(true);
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{r.name}</td>
                      <td style={tdStyle}>{r.phone || "-"}</td>
                      <td style={tdStyle}>
                        {r.date ? new Date(r.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) : "-"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{r.guestCount || "-"}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.note || "-"}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {r.status !== "APPROVED" && (
                          <button style={btnApprove} onClick={(e) => { e.stopPropagation(); handleStatus(r.id, "APPROVED"); }}>
                            Onayla
                          </button>
                        )}
                        {r.status !== "REJECTED" && (
                          <button style={btnReject} onClick={(e) => { e.stopPropagation(); handleStatus(r.id, "REJECTED"); }}>
                            Reddet
                          </button>
                        )}
                        <button style={btnDelete} onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}>
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div style={overlayStyle} onClick={() => setModalOpen(false)}>
          <div style={modalStyle} className={styles.mobileModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, color: "#1a1a1a", fontSize: "1.25rem" }}>Yeni Rezervasyon</h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Ad Soyad *</label>
                <input
                  style={inputStyle}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Müşteri adı"
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Telefon</label>
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }} className={styles.mobileFormGroup}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tarih *</label>
                  <input
                    style={inputStyle}
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Kişi Sayısı *</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="1"
                    required
                    value={form.guestCount}
                    onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Not</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Ek notlar..."
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "0.6rem 1.2rem", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={overlayStyle} onClick={() => setDeleteId(null)}>
          <div
            style={{ ...modalStyle, maxWidth: "400px", textAlign: "center" }}
            className={styles.mobileModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
            <h3 style={{ margin: "0 0 0.5rem", color: "#1a1a1a" }}>Rezervasyonu Sil</h3>
            <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ padding: "0.6rem 1.5rem", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                style={{ padding: "0.6rem 1.5rem", background: "#dc3545", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedReservation && (
        <div style={overlayStyle} onClick={() => setDetailModalOpen(false)}>
          <div style={modalStyle} className={styles.mobileModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
              <h2 style={{ margin: 0, color: "#1a1a1a", fontSize: "1.25rem" }}>Rezervasyon Detayları</h2>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", color: "#333" }}>
              <div><strong style={labelStyle}>Ad Soyad:</strong> <span style={{fontSize: "1.1rem", color: "#111"}}>{selectedReservation.name}</span></div>
              <div><strong style={labelStyle}>Telefon:</strong> <span style={{color: "#333"}}>{selectedReservation.phone || "Belirtilmemiş"}</span></div>
              <div><strong style={labelStyle}>Tarih & Saat:</strong> <span style={{color: "#333"}}>{new Date(selectedReservation.date).toLocaleString("tr-TR")}</span></div>
              <div><strong style={labelStyle}>Kişi Sayısı:</strong> <span style={{color: "#333"}}>{selectedReservation.guestCount}</span></div>
              <div>
                <strong style={labelStyle}>Durum:</strong> 
                <span style={{
                  padding: "0.2rem 0.6rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold",
                  background: STATUS_MAP[selectedReservation.status]?.bg,
                  color: STATUS_MAP[selectedReservation.status]?.color,
                }}>
                  {STATUS_MAP[selectedReservation.status]?.label}
                </span>
              </div>
              <div>
                <strong style={labelStyle}>Atanan Masalar:</strong> 
                {selectedReservation.tables && selectedReservation.tables.length > 0 ? (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {selectedReservation.tables.map(t => (
                      <span key={t.id} style={{ background: "#000", color: "#D4AF37", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "500" }}>
                        {t.room.name} - {t.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#888" }}> Henüz masa atanmamış.</span>
                )}
              </div>
              <div><strong style={labelStyle}>Notlar:</strong> <div style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "8px", border: "1px solid #eee", marginTop: "0.5rem", minHeight: "50px" }}>{selectedReservation.note || "Not bulunmuyor."}</div></div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                style={{ padding: "0.6rem 1.2rem", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
