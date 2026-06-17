"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OptOutForm() {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  
  const [phone, setPhone] = useState(phoneParam);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Talebiniz alındı. Artık size kampanya ve etkinlik bilgilendirme mesajları gönderilmeyecektir.");
      } else {
        setStatus("error");
        setMessage(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "10vh auto", padding: "2rem", fontFamily: "sans-serif", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h1 style={{ color: "#333", fontSize: "1.5rem", marginBottom: "1rem" }}>Abonelikten Çık</h1>
      
      {status === "success" ? (
        <div style={{ color: "#155724", background: "#d4edda", padding: "1.5rem", borderRadius: "8px", border: "1px solid #c3e6cb" }}>
          <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ color: "#666", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            HayalMest etkinlik, kampanya ve duyuru listesinden çıkmak için telefon numaranızı doğrulayın.
          </p>
          
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
            required
            style={{
              width: "100%",
              padding: "0.8rem",
              fontSize: "1rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              marginBottom: "1rem",
              boxSizing: "border-box"
            }}
          />
          
          {status === "error" && (
            <p style={{ color: "#721c24", background: "#f8d7da", padding: "0.8rem", borderRadius: "6px", fontSize: "0.9rem", marginTop: 0, marginBottom: "1rem" }}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "0.8rem",
              background: "#d32f2f",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              opacity: status === "loading" ? 0.7 : 1
            }}
          >
            {status === "loading" ? "İşleniyor..." : "Abonelikten Çık"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function OptOutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: "20px" }}>
      <Suspense fallback={<div style={{ textAlign: "center", marginTop: "10vh" }}>Yükleniyor...</div>}>
        <OptOutForm />
      </Suspense>
    </div>
  );
}
