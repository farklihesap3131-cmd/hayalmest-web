"use client";

import { useState, useEffect } from "react";
import styles from "./ReservationForm.module.css";

export function ReservationForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    guestCount: "",
    note: "",
  });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  useEffect(() => {
    const handleFillReservation = (e) => {
      const { date, notes } = e.detail;
      setFormData(prev => ({
        ...prev,
        date: date || prev.date,
        note: notes || prev.note
      }));
    };

    window.addEventListener("fillReservation", handleFillReservation);
    return () => window.removeEventListener("fillReservation", handleFillReservation);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          date: new Date(formData.date).toISOString(),
          guestCount: parseInt(formData.guestCount),
          note: formData.note,
        }),
      });

      if (!res.ok) throw new Error("Rezervasyon yapılamadı");

      setStatus("success");
      setFormData({ name: "", phone: "", date: "", guestCount: "", note: "" });
      
      // Reset success message after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Masanızı Ayırtın</h2>
      <p className={styles.subtitle}>Unutulmaz bir gece için yerinizi hemen ayırtın.</p>
      
      {status === "success" && (
        <div className={styles.successMessage}>
          Talebiniz başarıyla alındı. Sizinle en kısa sürede iletişime geçeceğiz.
        </div>
      )}
      
      {status === "error" && (
        <div className={styles.errorMessage}>
          Bir hata oluştu. Lütfen tekrar deneyin veya WhatsApp üzerinden ulaşın.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="name"
            placeholder="Adınız Soyadınız"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <input
            type="tel"
            name="phone"
            placeholder="Telefon Numaranız"
            value={formData.phone}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="number"
              name="guestCount"
              placeholder="Kişi Sayısı"
              min="1"
              max="50"
              value={formData.guestCount}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <textarea
            name="note"
            placeholder="Özel İstekleriniz (İsteğe Bağlı)"
            value={formData.note}
            onChange={handleChange}
            className={styles.textarea}
            rows="3"
          />
        </div>
        
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            disabled={status === "loading"}
            className={styles.submitBtn}
            style={{ flex: 1 }}
          >
            {status === "loading" ? "Gönderiliyor..." : "Rezervasyon Talebi Gönder"}
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={styles.submitBtn}
            style={{ flex: 1, background: "transparent", color: "#D4AF37", border: "1px solid #D4AF37" }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </form>
    </div>
  );
}
