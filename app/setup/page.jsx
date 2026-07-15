"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", undertaking_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json();
      setError(data.error ?? "Erro ao configurar.");
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "5rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <h1>Configuração inicial</h1>
      <p style={{ color: "#666" }}>Cria o primeiro utilizador e empresa.</p>
      <form onSubmit={handleSubmit}>
        <fieldset style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
          <legend>Utilizador administrador</legend>
          <div style={{ marginBottom: "0.75rem" }}>
            <label>Nome<br />
              <input name="name" value={form.name} onChange={handleChange} required style={{ width: "100%", boxSizing: "border-box" }} />
            </label>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label>Email<br />
              <input name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: "100%", boxSizing: "border-box" }} />
            </label>
          </div>
          <div>
            <label>Password (mín. 8 caracteres)<br />
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} style={{ width: "100%", boxSizing: "border-box" }} />
            </label>
          </div>
        </fieldset>
        <fieldset style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
          <legend>Primeira empresa</legend>
          <label>Nome da empresa<br />
            <input name="undertaking_name" value={form.undertaking_name} onChange={handleChange} required style={{ width: "100%", boxSizing: "border-box" }} />
          </label>
        </fieldset>
        {error && <p style={{ color: "red" }}>{typeof error === "string" ? error : "Erro de validação."}</p>}
        <button type="submit" disabled={loading} style={{ padding: "0.4rem 1.2rem" }}>
          {loading ? "A configurar…" : "Configurar"}
        </button>
      </form>
    </div>
  );
}
