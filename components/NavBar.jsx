"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const LINK = { textDecoration: "none", color: "#333" };

export default function NavBar({ user, undertakings, activeUndertakingId, periods, activePeriodId }) {
  const router = useRouter();

  async function handleUndertakingChange(e) {
    await fetch("/api/session/undertaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ undertaking_id: parseInt(e.target.value, 10) }),
    });
    router.refresh();
  }

  async function handlePeriodChange(e) {
    await fetch("/api/session/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period_id: parseInt(e.target.value, 10) }),
    });
    router.refresh();
  }

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      gap: "1.25rem",
      padding: "0.75rem 1.5rem",
      borderBottom: "1px solid #e0e0e0",
      fontFamily: "sans-serif",
      fontSize: "0.9rem",
    }}>
      <strong>RelatoriosESG</strong>

      {undertakings.length > 0 && (
        <select value={activeUndertakingId ?? ""} onChange={handleUndertakingChange} style={{ padding: "0.25rem 0.4rem" }}>
          {undertakings.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      )}

      {periods.length > 0 && (
        <select value={activePeriodId ?? ""} onChange={handlePeriodChange} style={{ padding: "0.25rem 0.4rem" }}>
          {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      )}

      {periods.length === 0 && undertakings.length > 0 && (
        <a href="/periods" style={{ ...LINK, color: "#c00", fontSize: "0.8rem" }}>⚠ Sem período activo</a>
      )}

      <a href="/" style={LINK}>Relatório</a>
      <a href="/master" style={LINK}>Mestre</a>
      <a href="/periods" style={LINK}>Períodos</a>
      <a href="/undertakings" style={LINK}>Empresas</a>
      <a href="/users" style={LINK}>Utilizadores</a>

      <span style={{ marginLeft: "auto", color: "#666" }}>{user.name}</span>
      <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ cursor: "pointer" }}>Sair</button>
    </nav>
  );
}
