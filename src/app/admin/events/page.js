"use client";

import { useState, useEffect } from "react";
import { MediaSelector } from "@/components/MediaSelector";

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ color: "#333", margin: 0 }}>Etkinlik & Takvim Yönetimi</h1>
        <button onClick={openCreate} style={btnStyle}>+ Yeni Etkinlik</button>
      </div>

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr style={thRowStyle}>
              <th style={thStyle}>Afiş</th>
              <th style={thStyle}>Tarih</th>
              <th style={thStyle}>Başlık</th>
              <th style={thStyle}>Sanatçı</th>
              <th style={thStyle}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#999" }}>Henüz etkinlik bulunmuyor.</td></tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} style={trStyle}>
                  <td style={tdStyle}>
                    {ev.posterUrl ? (
                      isVideo(ev.posterUrl) ? (
                        <video src={ev.posterUrl} style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }} autoPlay loop muted playsInline />
                      ) : (
                        <img src={ev.posterUrl} alt="" style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }} />
                      )
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>{new Date(ev.date).toLocaleDateString("tr-TR")}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{ev.title}</td>
                  <td style={tdStyle}>{ev.artist?.name || "—"}</td>
                  <td style={tdStyle}>
                    <button onClick={() => openEdit(ev)} style={editBtn}>Düzenle</button>
                    <button onClick={() => handleDelete(ev.id)} style={deleteBtn}>Sil</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ color: "#333", marginBottom: "1.5rem" }}>{editing ? "Etkinliği Düzenle" : "Yeni Etkinlik"}</h2>
            
            <div style={{ border: "2px dashed #ccc", padding: "1rem", textAlign: "center", borderRadius: "8px", marginBottom: "1rem", cursor: "pointer", background: "#f9f9f9" }} onClick={() => setShowMediaSelector(true)}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
              <div style={{ color: "#333", fontWeight: 500 }}>Galeriden Seç veya Yükle</div>
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
                <input style={{ ...inputStyle, background: "#f9f9f9" }} value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} placeholder="/assets/images/..." readOnly />
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
                <button type="submit" style={btnStyle} disabled={uploading}>{editing ? "Güncelle" : "Oluştur"}</button>
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

const btnStyle = { padding: "0.6rem 1.2rem", background: "#1a1a1a", color: "#D4AF37", border: "1px solid #D4AF37", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" };
const cancelBtn = { padding: "0.6rem 1.2rem", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const editBtn = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 500, marginRight: 8 };
const deleteBtn = { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 500 };
const tableWrap = { background: "#fff", borderRadius: 8, border: "1px solid #eaeaea", overflow: "hidden" };
const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
const thRowStyle = { borderBottom: "2px solid #eaeaea", background: "#fafafa" };
const thStyle = { padding: "0.75rem 1rem", color: "#666", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" };
const trStyle = { borderBottom: "1px solid #f0f0f0" };
const tdStyle = { padding: "0.75rem 1rem", fontSize: "0.95rem" };
const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { background: "#fff", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto" };
const fieldStyle = { marginBottom: "1rem" };
const labelStyle = { display: "block", marginBottom: 4, fontWeight: 500, color: "#333", fontSize: "0.9rem" };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" };
