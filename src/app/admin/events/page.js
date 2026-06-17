"use client";

import { useState, useEffect } from "react";
import { MediaSelector } from "@/components/MediaSelector";
import styles from "../admin.module.css";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", posterUrl: "", artistId: "" });

  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const fetchEvents = async () => {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setEvents(data);
  };

  const fetchArtists = async () => {
    const res = await fetch("/api/admin/artists");
    const data = await res.json();
    setArtists(Array.isArray(data) ? data : data.artists ?? []);
  };

  useEffect(() => { fetchEvents(); fetchArtists(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", date: "", posterUrl: "", artistId: "" });
    setFileError("");
    setShowModal(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || "",
      date: event.date ? event.date.slice(0, 10) : "",
      posterUrl: event.posterUrl || "",
      artistId: event.artistId ? String(event.artistId) : "",
    });
    setFileError("");
    setShowModal(true);
  };

  const handleMediaSelect = (url) => {
    setForm((prev) => ({
      ...prev,
      posterUrl: url,
    }));
    setShowMediaSelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, artistId: form.artistId ? parseInt(form.artistId) : null };

    if (editing) {
      await fetch(`/api/admin/events/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setShowModal(false);
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    fetchEvents();
  };

  const isVideo = (url) => url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));

  return (
    <div style={containerStyle} className={styles.mobilePage}>
      <div style={headerStyle} className={styles.mobileHeader}>
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>Etkinlikler & Takvim</h1>
          <p style={{ color: "#888", marginTop: "0.5rem" }}>Yaklaşan programları koyu tema ile yönetin.</p>
        </div>
        <button onClick={openCreate} style={createBtnStyle} className={styles.mobileFullWidth}>+ Yeni Etkinlik</button>
      </div>

      <div style={gridStyle}>
        {events.length === 0 ? (
          <div style={emptyStateStyle}>Henüz etkinlik bulunmuyor.</div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} style={cardStyle}>
              <div style={cardMediaWrap}>
                {ev.posterUrl ? (
                  isVideo(ev.posterUrl) ? (
                    <video src={ev.posterUrl} style={cardMedia} autoPlay loop muted playsInline />
                  ) : (
                    <img src={ev.posterUrl} alt={ev.title} style={cardMedia} />
                  )
                ) : (
                  <div style={placeholderMedia}>Afiş Yok</div>
                )}
                <div style={dateBadge}>
                  {new Date(ev.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={cardContent}>
                <h3 style={cardTitle}>{ev.title}</h3>
                <p style={cardSubtitle}>{ev.artist?.name || "Sanatçı Belirtilmedi"}</p>
                <div style={cardActions}>
                  <button onClick={() => openEdit(ev)} style={editBtn}>Düzenle</button>
                  <button onClick={() => handleDelete(ev.id)} style={deleteBtn}>Sil</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={overlay}>
          <div style={modal} className={styles.mobileModal}>
            <h2 style={{ color: "#fff", marginBottom: "1.5rem" }}>{editing ? "Etkinliği Düzenle" : "Yeni Etkinlik"}</h2>
            
            <div style={uploadZone} onClick={() => setShowMediaSelector(true)}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
              <div style={{ color: "#fff", fontWeight: 500 }}>Galeriden Seç veya Yükle</div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Başlık *</label>
                <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Açıklama</label>
                <textarea style={{ ...inputStyle, height: 80 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Tarih *</label>
                <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Afiş URL</label>
                <input style={{ ...inputStyle, background: "#2a2a2a", color: "#888" }} value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} placeholder="/assets/images/..." readOnly />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Sanatçı</label>
                <select style={inputStyle} value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })}>
                  <option value="">— Seçiniz —</option>
                  {artists.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" style={submitBtn} disabled={uploading}>{editing ? "Güncelle" : "Oluştur"}</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn} disabled={uploading}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMediaSelector && (
        <MediaSelector 
          onSelect={handleMediaSelect} 
          onClose={() => setShowMediaSelector(false)} 
        />
      )}
    </div>
  );
}

const containerStyle = {
  background: "#121212",
  minHeight: "100vh",
  padding: "2rem",
  borderRadius: "12px",
  color: "#fff"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2.5rem",
  borderBottom: "1px solid #333",
  paddingBottom: "1.5rem"
};

const createBtnStyle = {
  padding: "0.75rem 1.5rem",
  background: "#D4AF37",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
  transition: "transform 0.2s"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1.5rem"
};

const emptyStateStyle = {
  gridColumn: "1 / -1",
  padding: "4rem",
  textAlign: "center",
  color: "#666",
  background: "#1a1a1a",
  borderRadius: "12px",
  border: "1px dashed #333"
};

const cardStyle = {
  background: "#1a1a1a",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #333",
  transition: "transform 0.3s, box-shadow 0.3s",
  display: "flex",
  flexDirection: "column",
  position: "relative"
};

const cardMediaWrap = {
  position: "relative",
  width: "100%",
  paddingTop: "100%", // 1:1 Aspect Ratio
  background: "#000"
};

const cardMedia = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover"
};

const placeholderMedia = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#444",
  background: "#111",
  fontSize: "1.2rem"
};

const dateBadge = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "rgba(0,0,0,0.7)",
  color: "#D4AF37",
  padding: "6px 12px",
  borderRadius: "6px",
  fontWeight: "bold",
  fontSize: "0.85rem",
  backdropFilter: "blur(4px)",
  border: "1px solid rgba(212, 175, 55, 0.3)"
};

const cardContent = {
  padding: "1.25rem",
  display: "flex",
  flexDirection: "column",
  flex: 1
};

const cardTitle = {
  margin: "0 0 0.25rem 0",
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "#fff"
};

const cardSubtitle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "#999",
  flex: 1
};

const cardActions = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "1.5rem",
  paddingTop: "1rem",
  borderTop: "1px solid #333"
};

const editBtn = { background: "none", border: "none", color: "#D4AF37", cursor: "pointer", fontWeight: 500, fontSize: "0.9rem" };
const deleteBtn = { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 500, fontSize: "0.9rem" };

const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)" };
const modal = { background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto" };
const uploadZone = { border: "2px dashed #444", padding: "1.5rem", textAlign: "center", borderRadius: "8px", marginBottom: "1.5rem", cursor: "pointer", background: "#111", transition: "border 0.2s" };

const fieldStyle = { marginBottom: "1.25rem" };
const labelStyle = { display: "block", marginBottom: 6, fontWeight: 500, color: "#ccc", fontSize: "0.9rem" };
const inputStyle = { width: "100%", padding: "0.75rem", background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" };

const submitBtn = { padding: "0.75rem 1.5rem", background: "#D4AF37", color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, flex: 1 };
const cancelBtn = { padding: "0.75rem 1.5rem", background: "#333", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
