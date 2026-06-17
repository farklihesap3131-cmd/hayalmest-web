"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import { MediaSelector } from "@/components/MediaSelector";

const API_URL = "/api/admin/artists";

const emptyForm = { name: "", bio: "", photoUrl: "" };

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // ── Fetch ───────────────────────────────────────────────
  const fetchArtists = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setArtists(Array.isArray(data) ? data : data.artists ?? []);
    } catch (e) {
      console.error("Sanatçılar yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtists(); }, []);

  // ── Handlers ────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFileError("");
    setModalOpen(true);
  };

  const openEdit = (artist) => {
    setEditing(artist);
    setForm({
      name: artist.name || "",
      bio: artist.bio || "",
      photoUrl: artist.photoUrl || artist.photo || "",
    });
    setFileError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMediaSelect = (url) => {
    setForm((prev) => ({
      ...prev,
      photoUrl: url,
    }));
    setShowMediaSelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await fetch(`${API_URL}/${editing._id || editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      closeModal();
      fetchArtists();
    } catch (e) {
      console.error("Kayıt hatası:", e);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (artist) => setDeleteTarget(artist);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API_URL}/${deleteTarget._id || deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      fetchArtists();
    } catch (e) {
      console.error("Silme hatası:", e);
    }
  };

  const isVideo = (url) => url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));

  // ── Inline style objects ────────────────────────────────
  const S = {
    page: {
      padding: "32px",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "28px",
      flexWrap: "wrap",
      gap: "12px",
    },
    title: {
      fontSize: "28px",
      fontWeight: 700,
      color: "#D4AF37",
      margin: 0,
    },
    addBtn: {
      background: "#D4AF37",
      color: "#1a1a1a",
      border: "none",
      padding: "12px 24px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "15px",
      cursor: "pointer",
      transition: "opacity .2s",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "24px",
    },
    card: {
      background: "#232323",
      borderRadius: "14px",
      overflow: "hidden",
      border: "1px solid #333",
      display: "flex",
      flexDirection: "column",
      transition: "transform .2s, box-shadow .2s",
    },
    img: {
      width: "100%",
      height: "200px",
      objectFit: "cover",
      display: "block",
      background: "#1a1a1a",
    },
    placeholder: {
      width: "100%",
      height: "200px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1a1a1a",
      color: "#D4AF37",
      fontSize: "16px",
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
    cardBody: {
      padding: "18px 20px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    cardName: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#fff",
      marginBottom: "8px",
    },
    cardBio: {
      fontSize: "14px",
      color: "#aaa",
      lineHeight: 1.55,
      flex: 1,
      marginBottom: "16px",
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
    },
    cardActions: {
      display: "flex",
      gap: "10px",
    },
    editBtn: {
      flex: 1,
      padding: "10px 0",
      background: "transparent",
      border: "1px solid #D4AF37",
      color: "#D4AF37",
      borderRadius: "6px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      transition: "all .2s",
    },
    deleteBtn: {
      flex: 1,
      padding: "10px 0",
      background: "transparent",
      border: "1px solid #e74c3c",
      color: "#e74c3c",
      borderRadius: "6px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      transition: "all .2s",
    },
    // overlay + modal
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "16px",
    },
    modal: {
      background: "#1e1e1e",
      borderRadius: "16px",
      width: "100%",
      maxWidth: "520px",
      padding: "32px",
      border: "1px solid #333",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    modalTitle: {
      fontSize: "22px",
      fontWeight: 700,
      color: "#D4AF37",
      marginBottom: "24px",
      margin: "0 0 24px",
    },
    label: {
      display: "block",
      color: "#ccc",
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #444",
      background: "#2a2a2a",
      color: "#fff",
      fontSize: "15px",
      marginBottom: "18px",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color .2s",
    },
    textarea: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #444",
      background: "#2a2a2a",
      color: "#fff",
      fontSize: "15px",
      marginBottom: "18px",
      outline: "none",
      boxSizing: "border-box",
      resize: "vertical",
      minHeight: "100px",
      fontFamily: "inherit",
      transition: "border-color .2s",
    },
    formActions: {
      display: "flex",
      gap: "12px",
      marginTop: "8px",
    },
    saveBtn: {
      flex: 1,
      padding: "12px 0",
      background: "#D4AF37",
      color: "#1a1a1a",
      border: "none",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "15px",
      cursor: "pointer",
    },
    cancelBtn: {
      flex: 1,
      padding: "12px 0",
      background: "transparent",
      color: "#aaa",
      border: "1px solid #555",
      borderRadius: "8px",
      fontWeight: 600,
      fontSize: "15px",
      cursor: "pointer",
    },
    // delete confirm
    confirmBox: {
      background: "#1e1e1e",
      borderRadius: "16px",
      padding: "32px",
      border: "1px solid #e74c3c",
      maxWidth: "420px",
      width: "100%",
      textAlign: "center",
    },
    confirmText: {
      color: "#fff",
      fontSize: "16px",
      lineHeight: 1.6,
      marginBottom: "24px",
    },
    confirmName: {
      color: "#D4AF37",
      fontWeight: 700,
    },
    confirmActions: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
    },
    confirmDeleteBtn: {
      padding: "12px 28px",
      background: "#e74c3c",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "15px",
      cursor: "pointer",
    },
    confirmCancelBtn: {
      padding: "12px 28px",
      background: "transparent",
      color: "#aaa",
      border: "1px solid #555",
      borderRadius: "8px",
      fontWeight: 600,
      fontSize: "15px",
      cursor: "pointer",
    },
    loading: {
      color: "#888",
      textAlign: "center",
      padding: "60px 0",
      fontSize: "16px",
    },
    empty: {
      color: "#666",
      textAlign: "center",
      padding: "60px 0",
      fontSize: "16px",
    },
    photoPreview: {
      width: "100%",
      height: "140px",
      objectFit: "cover",
      borderRadius: "8px",
      marginBottom: "18px",
      background: "#1a1a1a",
    },
    uploadArea: {
      border: "2px dashed #444",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      marginBottom: "18px",
      cursor: "pointer",
      background: "#222",
      color: "#aaa",
    }
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div style={S.page} className={styles.mobilePage}>
      {/* Header */}
      <div style={S.header} className={styles.mobileHeader}>
        <h1 style={S.title}>🎨 Sanatçı Yönetimi</h1>
        <button
          style={S.addBtn}
          className={styles.mobileFullWidth}
          onClick={openCreate}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          + Yeni Sanatçı Ekle
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p style={S.loading}>Yükleniyor…</p>
      ) : artists.length === 0 ? (
        <p style={S.empty}>Henüz sanatçı eklenmemiş.</p>
      ) : (
        <div style={S.grid}>
          {artists.map((artist) => (
            <div
              key={artist._id || artist.id}
              style={S.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(212,175,55,.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {artist.photoUrl || artist.photo ? (
                isVideo(artist.photoUrl || artist.photo) ? (
                  <video src={artist.photoUrl || artist.photo} style={S.img} autoPlay loop muted playsInline />
                ) : (
                  <img
                    src={artist.photoUrl || artist.photo}
                    alt={artist.name}
                    style={S.img}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
                    }}
                  />
                )
              ) : (
                <div style={S.placeholder}>Medya Yok</div>
              )}

              <div style={S.cardBody}>
                <div style={S.cardName}>{artist.name}</div>
                <div style={S.cardBio}>
                  {artist.bio || "Biyografi bilgisi yok."}
                </div>
                <div style={S.cardActions}>
                  <button
                    style={S.editBtn}
                    onClick={() => openEdit(artist)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#D4AF37";
                      e.currentTarget.style.color = "#1a1a1a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#D4AF37";
                    }}
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    style={S.deleteBtn}
                    onClick={() => confirmDelete(artist)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e74c3c";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#e74c3c";
                    }}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────── */}
      {modalOpen && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} className={styles.mobileModal} onClick={(e) => e.stopPropagation()}>
            <h2 style={S.modalTitle}>
              {editing ? "Sanatçıyı Düzenle" : "Yeni Sanatçı Ekle"}
            </h2>

            <div style={S.uploadArea} onClick={() => setShowMediaSelector(true)}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
              <div>Galeriden Seç veya Yükle</div>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={S.label}>İsim</label>
              <input
                style={S.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Sanatçı adı"
                required
                onFocus={(e) => (e.target.style.borderColor = "#D4AF37")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />

              <label style={S.label}>Biyografi</label>
              <textarea
                style={S.textarea}
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Kısa biyografi…"
                rows={4}
                onFocus={(e) => (e.target.style.borderColor = "#D4AF37")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />

              <label style={S.label}>Medya URL</label>
              <input
                style={{ ...S.input, opacity: 0.7 }}
                name="photoUrl"
                value={form.photoUrl}
                onChange={handleChange}
                placeholder="Yüklediğinizde otomatik dolacak..."
                readOnly
              />

              {form.photoUrl && (
                isVideo(form.photoUrl) ? (
                  <video src={form.photoUrl} style={S.photoPreview} autoPlay loop muted playsInline />
                ) : (
                  <img
                    src={form.photoUrl}
                    alt="Önizleme"
                    style={S.photoPreview}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )
              )}

              <div style={S.formActions}>
                <button type="submit" style={S.saveBtn} disabled={saving || uploading}>
                  {saving
                    ? "Kaydediliyor…"
                    : editing
                    ? "Güncelle"
                    : "Kaydet"}
                </button>
                <button
                  type="button"
                  style={S.cancelBtn}
                  onClick={closeModal}
                  disabled={uploading}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────── */}
      {deleteTarget && (
        <div
          style={S.overlay}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={S.confirmBox}
            className={styles.mobileModal}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={S.confirmText}>
              <span style={S.confirmName}>{deleteTarget.name}</span> adlı
              sanatçıyı silmek istediğinize emin misiniz?
              <br />
              Bu işlem geri alınamaz.
            </p>
            <div style={S.confirmActions}>
              <button style={S.confirmDeleteBtn} onClick={handleDelete}>
                Evet, Sil
              </button>
              <button
                style={S.confirmCancelBtn}
                onClick={() => setDeleteTarget(null)}
              >
                Vazgeç
              </button>
            </div>
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
