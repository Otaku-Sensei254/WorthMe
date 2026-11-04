import React, { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const PhonePromptModal = () => {
  const { user, setUser } = useContext(UserContext);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.phone) return null;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/users/phone`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: `+254${phone}` }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.errors?.phone?.[0] || result?.error || "Could not save your phone number.");
      }

      setUser(result);
      localStorage.setItem("user", JSON.stringify(result));
    } catch (requestError) {
      setError(requestError.message || "Could not save your phone number.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "grid", placeItems: "center", zIndex: 2000 }}>
      <div style={{ width: "min(420px, calc(100vw - 32px))", background: "#111", color: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
        <h2 style={{ marginTop: 0 }}>Add your phone number</h2>
        <p>Your Google account did not provide a phone number. Enter it to complete your WorthMe profile.</p>
        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ display: "block", marginBottom: 6 }}>Phone number</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>+254</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{9}"
                maxLength="9"
                placeholder="712345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 9))}
                required
                style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
              />
            </div>
          </label>
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit" disabled={saving || phone.length !== 9} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: "#fff", color: "#000", fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save phone number"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhonePromptModal;
