"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { MediaSelector } from "@/components/MediaSelector";

// ── Inline style constants ──────────────────────────────────────────
const gold = "#D4AF37";
const dark = "#1a1a1a";

const btnPrimary = {
  padding: "0.5rem 1.2rem",
  background: dark,
  color: gold,
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
  transition: "opacity .2s",
};

const btnSmall = {
  padding: "0.35rem 0.75rem",
  fontSize: "0.82rem",
  borderRadius: "5px",
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
};

const btnEdit = { ...btnSmall, background: "#e8ddb5", color: dark };
const btnDelete = { ...btnSmall, background: "#ff4d4d", color: "#fff" };
const btnAdd = { ...btnSmall, background: gold, color: dark, fontWeight: 600 };

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBox = {
  background: "#fff",
  borderRadius: "10px",
  padding: "2rem",
  width: "100%",
  maxWidth: "460px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
};

const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.3rem",
  fontWeight: 600,
  color: "#333",
  fontSize: "0.9rem",
};

// ── Component ───────────────────────────────────────────────────────
export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Modal state
  const [modal, setModal] = useState(null); // null | { type, data? }

  // Form fields
  const [catName, setCatName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // ── Fetch categories ──────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Kategoriler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Toggle expand/collapse ────────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Modal helpers ─────────────────────────────────────────────────
  const openNewCategory = () => {
    setCatName("");
    setModal({ type: "newCategory" });
  };

  const openEditCategory = (cat) => {
    setCatName(cat.name);
    setModal({ type: "editCategory", data: cat });
  };

  const openNewItem = (categoryId) => {
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemImageUrl("");
    setModal({ type: "newItem", data: { categoryId } });
  };

  const openEditItem = (item) => {
    setItemName(item.name);
    setItemDesc(item.description || "");
    setItemPrice(String(item.price ?? ""));
    setItemImageUrl(item.imageUrl || "");
    setModal({ type: "editItem", data: item });
  };

  const closeModal = () => setModal(null);

  // ── CRUD: Categories ─────────────────────────────────────────────
  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim() }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      await fetchCategories();
    } catch {
      alert("Kategori eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!catName.trim() || !modal?.data?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/menu/${modal.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim() }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      await fetchCategories();
    } catch {
      alert("Kategori güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Bu kategoriyi ve tüm ürünlerini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchCategories();
    } catch {
      alert("Kategori silinemedi.");
    }
  };

  // ── CRUD: Menu Items ──────────────────────────────────────────────
  const handleCreateItem = async () => {
    if (!itemName.trim() || !itemPrice) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: parseFloat(itemPrice),
          imageUrl: itemImageUrl,
          categoryId: modal.data.categoryId,
        }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      await fetchCategories();
    } catch {
      alert("Ürün eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!itemName.trim() || !itemPrice || !modal?.data?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/menu-items/${modal.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: parseFloat(itemPrice),
          imageUrl: itemImageUrl,
        }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      await fetchCategories();
    } catch {
      alert("Ürün güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchCategories();
    } catch {
      alert("Ürün silinemedi.");
    }
  };

  // ── Format price ──────────────────────────────────────────────────
  const formatPrice = (p) => `₺${Number(p).toFixed(2)}`;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={styles.mobilePage}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className={styles.mobileHeader}>
        <h1 style={{ color: "#333", margin: 0 }}>Menü Yönetimi</h1>
        <button style={btnPrimary} onClick={openNewCategory} className={styles.mobileFullWidth}>
          + Yeni Kategori Ekle
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ textAlign: "center", color: "#999", padding: "3rem 0" }}>
          Yükleniyor…
        </p>
      )}

      {/* Empty state */}
      {!loading && categories.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "8px", border: "1px solid #eaeaea" }}>
          <p style={{ color: "#999", fontSize: "1rem" }}>Henüz menü kategorisi bulunmuyor.</p>
        </div>
      )}

      {/* Categories */}
      {categories.map((cat) => {
        const isOpen = expandedIds.has(cat.id);
        const items = cat.items || cat.menuItems || [];

        return (
          <div
            key={cat.id}
            className={styles.card}
            style={{ marginBottom: "1rem", overflow: "hidden" }}
          >
            {/* Category Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => toggleExpand(cat.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    transition: "transform .2s",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    fontSize: "0.85rem",
                    color: gold,
                  }}
                >
                  ▶
                </span>
                <h2 style={{ margin: 0, fontSize: "1.15rem", color: dark }}>
                  {cat.name}
                </h2>
                <span style={{ fontSize: "0.82rem", color: "#999" }}>
                  ({items.length} ürün)
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                <button style={btnEdit} onClick={() => openEditCategory(cat)}>
                  Düzenle
                </button>
                <button style={btnDelete} onClick={() => handleDeleteCategory(cat.id)}>
                  Sil
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid #eaeaea", paddingTop: "1rem" }}>
                {/* Add item button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
                  <button style={btnAdd} onClick={() => openNewItem(cat.id)}>
                    + Yeni Ürün Ekle
                  </button>
                </div>

                {items.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#999", padding: "1rem 0", fontSize: "0.9rem" }}>
                    Bu kategoride henüz ürün yok.
                  </p>
                ) : (
                  <div className={styles.mobileTableWrapper}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #eaeaea" }}>
                          <th style={{ padding: "0.65rem 0.75rem", color: "#666", fontSize: "0.85rem", fontWeight: 600 }}>
                            Görsel
                          </th>
                        <th style={{ padding: "0.65rem 0.75rem", color: "#666", fontSize: "0.85rem", fontWeight: 600 }}>
                          Ürün Adı
                        </th>
                        <th style={{ padding: "0.65rem 0.75rem", color: "#666", fontSize: "0.85rem", fontWeight: 600 }}>
                          Açıklama
                        </th>
                        <th style={{ padding: "0.65rem 0.75rem", color: "#666", fontSize: "0.85rem", fontWeight: 600, textAlign: "right" }}>
                          Fiyat
                        </th>
                        <th style={{ padding: "0.65rem 0.75rem", color: "#666", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "0.65rem 0.75rem" }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                            ) : (
                              <span style={{ color: "#ccc" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "0.65rem 0.75rem", fontWeight: 500, color: "#333" }}>
                            {item.name}
                          </td>
                          <td style={{ padding: "0.65rem 0.75rem", color: "#666", fontSize: "0.88rem", maxWidth: "300px" }}>
                            {item.description || "—"}
                          </td>
                          <td style={{ padding: "0.65rem 0.75rem", textAlign: "right", fontWeight: 600, color: dark }}>
                            {formatPrice(item.price)}
                          </td>
                          <td style={{ padding: "0.65rem 0.75rem", textAlign: "center" }}>
                            <button
                              style={{ ...btnSmall, color: "#0070f3", background: "none", textDecoration: "underline" }}
                              onClick={() => openEditItem(item)}
                            >
                              Düzenle
                            </button>
                            <button
                              style={{ ...btnSmall, color: "#ff4d4d", background: "none", textDecoration: "underline", marginLeft: "0.5rem" }}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      {modal && (
        <div style={overlay} onClick={closeModal}>
          <div style={modalBox} className={styles.mobileModal} onClick={(e) => e.stopPropagation()}>
            {/* ─ New Category ─ */}
            {modal.type === "newCategory" && (
              <>
                <h2 style={{ margin: "0 0 1.25rem", color: dark }}>Yeni Kategori</h2>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Kategori Adı</label>
                  <input
                    style={inputStyle}
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Örn: Sıcak İçecekler"
                    autoFocus
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    style={{ ...btnSmall, background: "#e0e0e0", color: "#333", padding: "0.5rem 1rem" }}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    İptal
                  </button>
                  <button
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                    onClick={handleCreateCategory}
                    disabled={saving}
                  >
                    {saving ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </div>
              </>
            )}

            {/* ─ Edit Category ─ */}
            {modal.type === "editCategory" && (
              <>
                <h2 style={{ margin: "0 0 1.25rem", color: dark }}>Kategori Düzenle</h2>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Kategori Adı</label>
                  <input
                    style={inputStyle}
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    style={{ ...btnSmall, background: "#e0e0e0", color: "#333", padding: "0.5rem 1rem" }}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    İptal
                  </button>
                  <button
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                    onClick={handleUpdateCategory}
                    disabled={saving}
                  >
                    {saving ? "Güncelleniyor…" : "Güncelle"}
                  </button>
                </div>
              </>
            )}

            {/* ─ New Item ─ */}
            {modal.type === "newItem" && (
              <>
                <h2 style={{ margin: "0 0 1.25rem", color: dark }}>Yeni Ürün Ekle</h2>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Ürün Adı</label>
                  <input
                    style={inputStyle}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Örn: Türk Kahvesi"
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Açıklama</label>
                  <input
                    style={inputStyle}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Kısa açıklama (opsiyonel)"
                  />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={labelStyle}>Fiyat (₺)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={labelStyle}>Görsel</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {itemImageUrl && <img src={itemImageUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />}
                    <button type="button" onClick={() => setShowMediaSelector(true)} style={btnSmall}>Görsel Seç</button>
                    {itemImageUrl && <button type="button" onClick={() => setItemImageUrl("")} style={{ ...btnSmall, color: "#ff4d4d" }}>Kaldır</button>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    style={{ ...btnSmall, background: "#e0e0e0", color: "#333", padding: "0.5rem 1rem" }}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    İptal
                  </button>
                  <button
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                    onClick={handleCreateItem}
                    disabled={saving}
                  >
                    {saving ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </div>
              </>
            )}

            {/* ─ Edit Item ─ */}
            {modal.type === "editItem" && (
              <>
                <h2 style={{ margin: "0 0 1.25rem", color: dark }}>Ürün Düzenle</h2>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Ürün Adı</label>
                  <input
                    style={inputStyle}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Açıklama</label>
                  <input
                    style={inputStyle}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={labelStyle}>Fiyat (₺)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={labelStyle}>Görsel</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {itemImageUrl && <img src={itemImageUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />}
                    <button type="button" onClick={() => setShowMediaSelector(true)} style={btnSmall}>Görsel Seç</button>
                    {itemImageUrl && <button type="button" onClick={() => setItemImageUrl("")} style={{ ...btnSmall, color: "#ff4d4d" }}>Kaldır</button>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    style={{ ...btnSmall, background: "#e0e0e0", color: "#333", padding: "0.5rem 1rem" }}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    İptal
                  </button>
                  <button
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                    onClick={handleUpdateItem}
                    disabled={saving}
                  >
                    {saving ? "Güncelleniyor…" : "Güncelle"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showMediaSelector && (
        <MediaSelector 
          onSelect={(url) => {
            setItemImageUrl(url);
            setShowMediaSelector(false);
          }} 
          onClose={() => setShowMediaSelector(false)} 
        />
      )}
    </div>
  );
}
