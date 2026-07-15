"use client";

import { useEffect, useState } from "react";

function UserRow({ user, undertakings, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, email: user.email, password: "" });
  const [userUndertakings, setUserUndertakings] = useState(null);
  const [status, setStatus] = useState("");

  async function loadUserUndertakings() {
    const res = await fetch(`/api/users/${user.id}/undertakings`);
    const data = await res.json();
    setUserUndertakings(data.map((u) => u.id));
  }

  function startEdit() {
    setEditing(true);
    loadUserUndertakings();
  }

  function toggleUndertaking(id) {
    setUserUndertakings((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setStatus("");
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.password ? form : { name: form.name, email: form.email }),
    });
    if (!res.ok) { setStatus("Erro ao actualizar utilizador."); return; }

    await fetch(`/api/users/${user.id}/undertakings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ undertaking_ids: userUndertakings }),
    });

    setEditing(false);
    setStatus("");
    onUpdated();
  }

  async function handleDelete() {
    if (!confirm(`Eliminar o utilizador "${user.name}"?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) onUpdated();
    else {
      const data = await res.json();
      alert(data.error ?? "Erro ao eliminar.");
    }
  }

  if (!editing) {
    return (
      <tr style={{ borderBottom: "1px solid #eee" }}>
        <td style={{ padding: "0.5rem 0" }}>{user.name}</td>
        <td style={{ padding: "0.5rem 0", color: "#666" }}>{user.email}</td>
        <td style={{ padding: "0.5rem 0", textAlign: "right" }}>
          <button onClick={startEdit} style={{ marginRight: "0.5rem" }}>Editar</button>
          <button onClick={handleDelete}>Eliminar</button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
      <td colSpan={3} style={{ padding: "0.75rem 0" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nome"
            style={{ flex: 1, padding: "0.3rem" }}
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            style={{ flex: 1, padding: "0.3rem" }}
          />
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Nova password (opcional)"
            type="password"
            style={{ flex: 1, padding: "0.3rem" }}
          />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <strong style={{ fontSize: "0.85rem" }}>Empresas autorizadas:</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
            {userUndertakings === null ? (
              <span style={{ color: "#999" }}>A carregar…</span>
            ) : (
              undertakings.map((u) => (
                <label key={u.id} style={{ fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={userUndertakings.includes(u.id)}
                    onChange={() => toggleUndertaking(u.id)}
                  />{" "}
                  {u.name}
                </label>
              ))
            )}
          </div>
        </div>
        {status && <p style={{ color: "red", margin: "0 0 0.5rem" }}>{status}</p>}
        <button onClick={handleSave} style={{ marginRight: "0.5rem" }}>Guardar</button>
        <button onClick={() => setEditing(false)}>Cancelar</button>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [undertakings, setUndertakings] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [u, ut] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/undertakings").then((r) => r.json()),
    ]);
    setUsers(u);
    setUndertakings(ut);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setStatus("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "" });
      await loadAll();
      setStatus("Utilizador criado.");
    } else {
      setStatus("Erro ao criar utilizador.");
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <h1>Utilizadores</h1>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Nome"
          required
          style={{ flex: 1, minWidth: "140px", padding: "0.4rem" }}
        />
        <input
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email"
          type="email"
          required
          style={{ flex: 1, minWidth: "180px", padding: "0.4rem" }}
        />
        <input
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Password (mín. 8 caracteres)"
          type="password"
          required
          minLength={8}
          style={{ flex: 1, minWidth: "180px", padding: "0.4rem" }}
        />
        <button type="submit">Criar</button>
      </form>

      {status && <p style={{ color: "gray", marginBottom: "1rem" }}>{status}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "0.5rem 0" }}>Nome</th>
            <th style={{ padding: "0.5rem 0" }}>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} undertakings={undertakings} onUpdated={loadAll} />
          ))}
          {users.length === 0 && (
            <tr><td colSpan={3} style={{ padding: "1rem 0", color: "#999" }}>Nenhum utilizador registado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
