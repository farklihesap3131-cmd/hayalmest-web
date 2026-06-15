"use client";

import { useState, useEffect } from "react";
import { MediaSelector } from "@/components/MediaSelector";

const DEFAULT_SETTINGS = [
  { key: "whatsapp_number", label: "WhatsApp Numarası", placeholder: "905305012458" },
  { key: "address", label: "Adres", placeholder: "Mekan adresi..." },
  { key: "phone", label: "Telefon", placeholder: "0530 501 24 58" },
  { key: "instagram", label: "Instagram", placeholder: "@hayalmest" },
  { key: "working_hours", label: "Çalışma Saatleri", placeholder: "20:00 - 02:00" },
  { key: "about_text", label: "Hakkımızda Metni", placeholder: "HayalMest hakkında kısa açıklama..." },
  { key: "reservation_note", label: "Rezervasyon Notu", placeholder: "Minimum 2 kişi..." },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [heroBgs, setHeroBgs] = useState([]);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const fetchSettings = async () => {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    const map = {};
    data.forEach((s) => { map[s.key] = s.value; });
    setSettings(map);
    
    if (map["hero_backgrounds"]) {
      try {
        setHeroBgs(JSON.parse(map["hero_backgrounds"]));
      } catch (e) {
        setHeroBgs([]);
      }
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    // Save text settings
    for (const def of DEFAULT_SETTINGS) {
      if (settings[def.key] !== undefined) {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: def.key, value: settings[def.key] }),
        });
      }
    }
    
    // Save Hero backgrounds
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "hero_backgrounds", value: JSON.stringify(heroBgs) }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleBgSelect = (url) => {
    setHeroBgs((prev) => [...prev, url]);
    setShowMediaSelector(false);
  };

  const handleRemoveBg = (index) => {
    setHeroBgs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ color: "#333", margin: 0 }}>Site Ayarları</h1>
        <button onClick={handleSave} disabled={saving} style={btnStyle}>
          {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi!" : "Kaydet"}
        </button>
      </div>

      <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left Column: Text Settings */}
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #eaeaea", padding: "2rem" }}>
          <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", color: "#1a1a1a" }}>Genel Ayarlar</h2>
          {DEFAULT_SETTINGS.map((def) => (
            <div key={def.key} style={fieldStyle}>
              <label style={labelStyle}>{def.label}</label>
              {def.key === "about_text" || def.key === "reservation_note" ? (
                <textarea
                  style={{ ...inputStyle, height: 80 }}
                  value={settings[def.key] || ""}
                  onChange={(e) => setSettings({ ...settings, [def.key]: e.target.value })}
                  placeholder={def.placeholder}
                />
              ) : (
                <input
                  style={inputStyle}
                  value={settings[def.key] || ""}
                  onChange={(e) => setSettings({ ...settings, [def.key]: e.target.value })}
                  placeholder={def.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Hero Backgrounds */}
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #eaeaea", padding: "2rem" }}>
          <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", color: "#1a1a1a" }}>Ana Sayfa Arkaplanları (Hero)</h2>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
            Ana sayfaya ilk girildiğinde dönen fotoğrafları buradan belirleyebilirsiniz. 
            <br /><em>(Değişikliklerin etkili olması için yukarıdan Kaydet butonuna basmayı unutmayın.)</em>
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {heroBgs.map((url, i) => (
              <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd", height: "80px" }}>
                <img src={url} alt={`bg-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button 
                  onClick={() => handleRemoveBg(i)}
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(220,38,38,0.9)", color: "white", border: "none", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={() => setShowMediaSelector(true)}
            style={{ display: "block", width: "100%", cursor: "pointer", border: "2px dashed #ccc", padding: "1.5rem", textAlign: "center", borderRadius: "8px", background: "#f9f9f9" }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
            <div style={{ color: "#333", fontWeight: 500 }}>Galeriden Seç veya Yükle</div>
          </button>
        </div>
      </div>

      {showMediaSelector && (
        <MediaSelector 
          onSelect={handleBgSelect} 
          onClose={() => setShowMediaSelector(false)} 
        />
      )}
    </div>
  );
}

const btnStyle = { padding: "0.6rem 1.2rem", background: "#1a1a1a", color: "#D4AF37", border: "1px solid #D4AF37", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" };
const fieldStyle = { marginBottom: "1.25rem" };
const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600, color: "#333", fontSize: "0.9rem" };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" };
