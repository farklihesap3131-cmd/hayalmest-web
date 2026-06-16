"use client";

import { useState, useEffect } from "react";

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: "IMAGE", url: "", caption: "", showOnHome: true });
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  const fetchItems = async () => {
    const res = await fetch("/api/admin/gallery", { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } });
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ type: "IMAGE", url: "", caption: "", showOnHome: true });
    setFileError("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ type: item.type, url: item.url, caption: item.caption || "", showOnHome: item.showOnHome !== false });
    setFileError("");
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g., 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setFileError("Dosya boyutu çok büyük! Maksimum 50MB yükleyebilirsiniz.");
      return;
    }

    setUploading(true);
    setFileError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setForm((prev) => ({
        ...prev,
        url: data.url,
        type: data.type, // IMAGE or VIDEO from server
      }));
    } catch (err) {
      console.error(err);
      setFileError("Dosya yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/admin/gallery/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu medyayı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleToggleShowOnHome = async (item) => {
    await fetch(`/api/admin/gallery/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: item.type, url: item.url, caption: item.caption, showOnHome: !item.showOnHome }),
    });
    fetchItems();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ color: "#333", margin: 0 }}>Dosya Yöneticisi & Galeri</h1>
        <button onClick={openCreate} style={btnStyle}>+ Yeni Medya Yükle</button>
      </div>

      <div style={{ marginBottom: "2rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
        <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>
          <strong>Bilgi:</strong> Buraya yüklediğiniz tüm fotoğraf ve videolar otomatik olarak ana sayfanızdaki "Mekanımızdan Kareler" (Galeri) bölümünde yayınlanacaktır. Videolar ana sayfada otomatik ve sessiz (loop) oynatılır.
        </p>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", padding: "3rem" }}>Henüz galeri öğesi bulunmuyor.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
          {items.map((item) => (
            <div key={item.id} style={cardStyle}>
              {item.type === "IMAGE" ? (
                <img src={item.url} alt={item.caption || ""} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "8px 8px 0 0" }} />
              ) : (
                <video src={item.url} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "8px 8px 0 0" }} muted autoPlay loop playsInline />
              )}
              <div style={{ padding: "0.75rem" }}>
                <span style={badgeStyle}>{item.type === "IMAGE" ? "📷 Fotoğraf" : "🎥 Video"}</span>
                {item.caption && <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.5rem" }}>{item.caption}</p>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  <button onClick={() => openEdit(item)} style={editBtn}>Düzenle</button>
                  <button onClick={() => handleDelete(item.id)} style={deleteBtn}>Sil</button>
                  <button 
                    onClick={() => handleToggleShowOnHome(item)} 
                    style={{
                      ...toggleBtn,
                      color: item.showOnHome ? "#16a34a" : "#9ca3af"
                    }}
                  >
                    {item.showOnHome ? "👁 Ana Sayfada Açık" : "🚫 Ana Sayfada Gizli"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ color: "#333", marginBottom: "1.5rem" }}>{editing ? "Medyayı Düzenle" : "Cihazdan Yeni Yükle"}</h2>
            
            {/* FILE UPLOAD SECTION */}
            <div style={{ padding: "1.5rem", border: "2px dashed #D4AF37", borderRadius: "8px", background: "#fffdf5", marginBottom: "1.5rem", textAlign: "center" }}>
              <label style={{ display: "block", cursor: "pointer", color: "#333" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
                <strong>Tıklayıp Fotoğraf veya Video Seçin</strong>
                <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>(Max 50MB - JPG, PNG, MP4, WEBM)</p>
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/webm" 
                  style={{ display: "none" }} 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              {uploading && <div style={{ marginTop: "1rem", color: "#D4AF37", fontWeight: "bold" }}>Dosya yükleniyor, lütfen bekleyin... ⏳</div>}
              {fileError && <div style={{ marginTop: "1rem", color: "#dc2626", fontSize: "0.9rem" }}>{fileError}</div>}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Dosya Yolu (URL)</label>
                <input style={{...inputStyle, background: "#f5f5f5"}} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required readOnly placeholder="Dosya seçtiğinizde otomatik dolacak..." />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Medyatürü *</label>
                <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IMAGE">Fotoğraf</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Açıklama (İsteğe Bağlı)</label>
                <input style={inputStyle} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
              </div>
              <div style={fieldStyle}>
                <label style={{...labelStyle, display: "flex", alignItems: "center", gap: "0.5rem"}}>
                  <input type="checkbox" checked={form.showOnHome} onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })} />
                  Ana Sayfada Göster
                </label>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" style={btnStyle} disabled={!form.url || uploading}>{editing ? "Güncelle" : "Yayınla"}</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn} disabled={uploading}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: "0.6rem 1.2rem", background: "#1a1a1a", color: "#D4AF37", border: "1px solid #D4AF37", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" };
const cancelBtn = { padding: "0.6rem 1.2rem", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const editBtn = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem" };
const deleteBtn = { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem" };
const toggleBtn = { background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.80rem", marginLeft: "auto" };
const cardStyle = { background: "#fff", borderRadius: 8, border: "1px solid #eaeaea", overflow: "hidden" };
const badgeStyle = { display: "inline-block", padding: "2px 8px", background: "#f5f5f5", borderRadius: 4, fontSize: "0.8rem", color: "#666" };
const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { background: "#fff", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto" };
const fieldStyle = { marginBottom: "1rem" };
const labelStyle = { display: "block", marginBottom: 4, fontWeight: 500, color: "#333", fontSize: "0.9rem" };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" };
