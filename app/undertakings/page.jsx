"use client";

import { useEffect, useState } from "react";

export default function UndertakingsPage() {
  const [undertakings, setUndertakings] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/undertakings");
    setUndertakings(await res.json());
  }

  async function handleCreate(e) {
    e.preventDefault();
    setStatus("");
    const res = await fetch("/api/undertakings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) { setNewName(""); await load(); setStatus("Empresa criada."); }
    else setStatus("Erro ao criar empresa.");
  }

  function startEdit(u) { setEditingId(u.id); setEditName(u.name); }
  function cancelEdit() { setEditingId(null); setEditName(""); }

  async function handleUpdate(id) {
    setStatus("");
    const res = await fetch(`/api/undertakings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) { cancelEdit(); await load(); setStatus("Empresa actualizada."); }
    else setStatus("Erro ao actualizar empresa.");
  }

  async function handleDelete(id) {
    if (!confirm("Eliminar esta empresa? Esta acção não pode ser desfeita.")) return;
    setStatus("");
    const res = await fetch(`/api/undertakings/${id}`, { method: "DELETE" });
    if (res.ok) { await load(); setStatus("Empresa eliminada."); }
    else setStatus("Erro ao eliminar empresa.");
  }

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <h1>Empresas</h1>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da empresa"
          required
          style={{ flex: 1, padding: "0.4rem" }}
        />
        <button type="submit">Criar</button>
      </form>

      {status && <p style={{ color: "gray", marginBottom: "1rem" }}>{status}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "0.5rem 0" }}>Nome</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {undertakings.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem 0" }}>
                {editingId === u.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ padding: "0.3rem", width: "100%" }}
                  />
                ) : (
                  u.name
                )}
              </td>
              <td style={{ padding: "0.5rem 0", textAlign: "right", whiteSpace: "nowrap" }}>
                {editingId === u.id ? (
                  <>
                    <button onClick={() => handleUpdate(u.id)} style={{ marginRight: "0.5rem" }}>Guardar</button>
                    <button onClick={cancelEdit}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(u)} style={{ marginRight: "0.5rem" }}>Editar</button>
                    <button onClick={() => handleDelete(u.id)}>Eliminar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {undertakings.length === 0 && (
            <tr><td colSpan={2} style={{ padding: "1rem 0", color: "#999" }}>Nenhuma empresa registada.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
