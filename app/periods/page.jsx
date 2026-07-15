"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATE_LABELS = {
  elaboracao: "Elaboração",
  aprovacao: "Ag. aprovação",
  aprovado: "Aprovado",
};

export default function PeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [form, setForm] = useState({ label: "", start_date: "", end_date: "", clone_from_period_id: "" });
  const [status, setStatus] = useState("");
  const router = useRouter();

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/periods");
    if (res.ok) setPeriods(await res.json());
  }

  async function handleCreate(e) {
    e.preventDefault();
    setStatus("");
    const body = {
      label: form.label,
      start_date: form.start_date,
      end_date: form.end_date,
      clone_from_period_id: form.clone_from_period_id ? parseInt(form.clone_from_period_id, 10) : null,
    };
    const res = await fetch("/api/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setForm({ label: "", start_date: "", end_date: "", clone_from_period_id: "" });
      await load();
      // Activate the new period
      await fetch("/api/session/period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_id: created.id }),
      });
      router.refresh();
      setStatus("Período criado e activado.");
    } else {
      setStatus("Erro ao criar período.");
    }
  }

  async function handleActivate(id) {
    await fetch("/api/session/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period_id: id }),
    });
    router.refresh();
    setStatus("Período activo alterado.");
  }

  // Suggest label based on dates
  function handleDateChange(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (next.start_date && next.end_date && !next.label) {
        const year = next.start_date.slice(0, 4);
        const endYear = next.end_date.slice(0, 4);
        next.label = year === endYear ? year : `${year}/${endYear}`;
      }
      return next;
    });
  }

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <h1>Períodos de reporte</h1>

      <form onSubmit={handleCreate} style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "4px", marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Novo período</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <label style={{ flex: 1, minWidth: "120px" }}>
            <span style={{ fontSize: "0.8rem", color: "#555" }}>Data início</span><br />
            <input type="date" required value={form.start_date}
              onChange={(e) => handleDateChange("start_date", e.target.value)}
              style={{ width: "100%", padding: "0.35rem" }} />
          </label>
          <label style={{ flex: 1, minWidth: "120px" }}>
            <span style={{ fontSize: "0.8rem", color: "#555" }}>Data fim</span><br />
            <input type="date" required value={form.end_date}
              onChange={(e) => handleDateChange("end_date", e.target.value)}
              style={{ width: "100%", padding: "0.35rem" }} />
          </label>
          <label style={{ flex: 1, minWidth: "100px" }}>
            <span style={{ fontSize: "0.8rem", color: "#555" }}>Rótulo</span><br />
            <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              required placeholder="ex. 2024"
              style={{ width: "100%", padding: "0.35rem" }} />
          </label>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            <span style={{ fontSize: "0.8rem", color: "#555" }}>
              Carry-forward: copiar blocos aprovados de
            </span><br />
            <select value={form.clone_from_period_id}
              onChange={(e) => setForm((f) => ({ ...f, clone_from_period_id: e.target.value }))}
              style={{ padding: "0.35rem", minWidth: "200px" }}>
              <option value="">— nenhum (período novo) —</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit">Criar período</button>
        {status && <span style={{ marginLeft: "1rem", color: "gray", fontSize: "0.85rem" }}>{status}</span>}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "0.5rem 0" }}>Rótulo</th>
            <th style={{ padding: "0.5rem 0" }}>Início</th>
            <th style={{ padding: "0.5rem 0" }}>Fim</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem 0" }}><strong>{p.label}</strong></td>
              <td style={{ padding: "0.5rem 0", color: "#555" }}>{p.start_date}</td>
              <td style={{ padding: "0.5rem 0", color: "#555" }}>{p.end_date}</td>
              <td style={{ padding: "0.5rem 0", textAlign: "right" }}>
                <button onClick={() => handleActivate(p.id)}>Activar</button>
              </td>
            </tr>
          ))}
          {periods.length === 0 && (
            <tr><td colSpan={4} style={{ padding: "1rem 0", color: "#999" }}>Nenhum período criado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
