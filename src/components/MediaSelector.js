"use client";

import { useState, useEffect } from "react";
import styles from "./MediaSelector.module.css";

export function MediaSelector({ onSelect, onClose }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      setMemories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Medyalar yüklenemedi:", err);
      setError("Medyalar yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Dosya boyutu çok büyük! Maksimum 50MB yükleyebilirsiniz.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload to storage
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // 2. Save to Gallery (Memory)
      const saveRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type || "IMAGE",
          url: data.url,
          caption: file.name,
        }),
      });

      if (!saveRes.ok) throw new Error("Galeriye kaydedilemedi");
      
      await fetchMemories();
    } catch (err) {
      console.error(err);
      setError("Dosya yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const isVideo = (url) => url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Dosya Yöneticisi</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.uploadArea}>
          <label className={styles.uploadLabel}>
            <div className={styles.uploadIcon}>📸</div>
            <div>Bilgisayardan Yeni Fotoğraf / Video Yükle</div>
            <input 
              type="file" 
              accept="image/*,video/mp4,video/webm" 
              className={styles.fileInput} 
              onChange={handleFileUpload} 
              disabled={uploading} 
            />
          </label>
          {uploading && <div className={styles.uploadingText}>Yükleniyor...</div>}
          {error && <div className={styles.errorText}>{error}</div>}
        </div>

        <h3 className={styles.subtitle}>Galeriden Seç</h3>
        
        {loading ? (
          <div className={styles.loadingText}>Yükleniyor...</div>
        ) : memories.length === 0 ? (
          <div className={styles.emptyText}>Henüz medya bulunmuyor.</div>
        ) : (
          <div className={styles.grid}>
            {memories.map((m) => (
              <div 
                key={m.id} 
                className={styles.gridItem} 
                onClick={() => onSelect(m.url)}
              >
                {m.type === "VIDEO" || isVideo(m.url) ? (
                  <video src={m.url} className={styles.media} muted playsInline />
                ) : (
                  <img src={m.url} alt={m.caption || "Medya"} className={styles.media} />
                )}
                <div className={styles.overlayHover}>Seç</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
