"use client";

import { useEffect, useState } from "react";

const IDENTIFIER_TYPES = ["LEI", "NIF", "EUID", "OTHER"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: "1rem", borderBottom: "1px solid #ddd", paddingBottom: "0.25rem", marginTop: "2rem" }}>
      {children}
    </h2>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>{label}</label>
      {children}
    </div>
  );
}

const INPUT = { padding: "0.35rem 0.5rem", width: "100%", boxSizing: "border-box" };
const INPUT_SM = { padding: "0.35rem 0.5rem", boxSizing: "border-box" };

export default function MasterPage() {
  const [master, setMaster] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [mRes, hRes] = await Promise.all([
      fetch("/api/master"),
      fetch("/api/master/history"),
    ]);
    const mData = await mRes.json();
    const hData = await hRes.json();
    setMaster(mData.content);
    setHistory(hData);
  }

  async function handleSave() {
    setStatus("A guardar…");
    const res = await fetch("/api/master", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(master),
    });
    if (res.ok) {
      await load();
      setStatus("Nova versão guardada.");
    } else {
      const data = await res.json();
      setStatus("Erro: " + JSON.stringify(data.error));
    }
  }

  function setField(path, value) {
    setMaster((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  // Generic list helpers
  function addItem(listKey, template) {
    setMaster((prev) => ({ ...prev, [listKey]: [...(prev[listKey] ?? []), { id: uid(), ...template }] }));
  }

  function removeItem(listKey, id) {
    setMaster((prev) => ({ ...prev, [listKey]: prev[listKey].filter((x) => x.id !== id) }));
  }

  function updateItem(listKey, id, field, value) {
    setMaster((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((x) => x.id === id ? { ...x, [field]: value } : x),
    }));
  }

  function addCert() {
    setMaster((prev) => ({
      ...prev,
      sustainability_certifications: [
        ...(prev.sustainability_certifications ?? []),
        { has_certification: false, description: "" },
      ],
    }));
  }

  function removeCert(index) {
    setMaster((prev) => ({
      ...prev,
      sustainability_certifications: prev.sustainability_certifications.filter((_, i) => i !== index),
    }));
  }

  function updateCert(index, field, value) {
    setMaster((prev) => ({
      ...prev,
      sustainability_certifications: prev.sustainability_certifications.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  }

  function addNace() {
    setMaster((prev) => ({ ...prev, nace_codes: [...(prev.nace_codes ?? []), ""] }));
  }

  function removeNace(index) {
    setMaster((prev) => ({ ...prev, nace_codes: prev.nace_codes.filter((_, i) => i !== index) }));
  }

  function updateNace(index, value) {
    setMaster((prev) => ({
      ...prev,
      nace_codes: prev.nace_codes.map((c, i) => i === index ? value : c),
    }));
  }

  if (!master) return <p style={{ margin: "2rem", fontFamily: "sans-serif" }}>A carregar…</p>;

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Dados Mestre da Empresa</h1>
        <button onClick={() => setShowHistory((v) => !v)} style={{ fontSize: "0.8rem" }}>
          {showHistory ? "Ocultar histórico" : `Histórico (${history.length} versões)`}
        </button>
      </div>

      {showHistory && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "0.3rem 0" }}>Válido desde</th>
              <th style={{ textAlign: "left", padding: "0.3rem 0" }}>Válido até</th>
            </tr>
          </thead>
          <tbody>
            {history.map((v) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.3rem 0" }}>{new Date(v.valid_from).toLocaleString("pt-PT")}</td>
                <td style={{ padding: "0.3rem 0", color: v.valid_to ? "#333" : "#090" }}>
                  {v.valid_to ? new Date(v.valid_to).toLocaleString("pt-PT") : "actual"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Identificação */}
      <SectionTitle>Identificação da entidade</SectionTitle>
      <Field label="Nome legal">
        <input style={INPUT} value={master.legal_name} onChange={(e) => setField("legal_name", e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Field label="Tipo de identificador">
          <select
            style={{ ...INPUT_SM, width: "auto" }}
            value={master.entity_identifier?.type ?? "NIF"}
            onChange={(e) => setField("entity_identifier.type", e.target.value)}
          >
            {IDENTIFIER_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Valor do identificador">
          <input
            style={INPUT}
            value={master.entity_identifier?.value ?? ""}
            onChange={(e) => setField("entity_identifier.value", e.target.value)}
          />
        </Field>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Field label="Forma legal">
          <input style={INPUT} value={master.legal_form} onChange={(e) => setField("legal_form", e.target.value)} />
        </Field>
        <Field label="Moeda (ISO 4217)">
          <select
            style={{ ...INPUT_SM, width: "auto" }}
            value={master.currency}
            onChange={(e) => setField("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="País principal (ISO 3166-1)">
          <input
            style={{ ...INPUT_SM, width: "60px" }}
            maxLength={2}
            value={master.main_country}
            onChange={(e) => setField("main_country", e.target.value.toUpperCase())}
            placeholder="PT"
          />
        </Field>
      </div>

      {/* Códigos NACE */}
      <SectionTitle>Códigos NACE</SectionTitle>
      {master.nace_codes.map((code, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <input
            style={{ ...INPUT_SM, flex: 1 }}
            value={code}
            onChange={(e) => updateNace(i, e.target.value)}
            placeholder="ex. A01.11"
          />
          <button onClick={() => removeNace(i)}>✕</button>
        </div>
      ))}
      <button onClick={addNace} style={{ fontSize: "0.85rem" }}>+ Código NACE</button>

      {/* Subsidiárias */}
      <SectionTitle>Subsidiárias</SectionTitle>
      {master.subsidiaries.map((s) => (
        <div key={s.id} style={{ border: "1px solid #eee", padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "4px" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <input
              style={{ ...INPUT_SM, flex: 2 }}
              placeholder="Nome"
              value={s.name}
              onChange={(e) => updateItem("subsidiaries", s.id, "name", e.target.value)}
            />
            <input
              style={{ ...INPUT_SM, flex: 3 }}
              placeholder="Morada"
              value={s.address}
              onChange={(e) => updateItem("subsidiaries", s.id, "address", e.target.value)}
            />
            <button onClick={() => removeItem("subsidiaries", s.id)}>✕</button>
          </div>
        </div>
      ))}
      <button onClick={() => addItem("subsidiaries", { name: "", address: "" })} style={{ fontSize: "0.85rem" }}>
        + Subsidiária
      </button>

      {/* Sites */}
      <SectionTitle>Sites / Localizações</SectionTitle>
      {master.sites.map((s) => (
        <div key={s.id} style={{ border: "1px solid #eee", padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "4px" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <input
              style={{ ...INPUT_SM, flex: 3 }}
              placeholder="Morada"
              value={s.address}
              onChange={(e) => updateItem("sites", s.id, "address", e.target.value)}
            />
            <input
              style={{ ...INPUT_SM, flex: 1 }}
              placeholder="Cód. postal"
              value={s.postal_code}
              onChange={(e) => updateItem("sites", s.id, "postal_code", e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={{ ...INPUT_SM, flex: 2 }}
              placeholder="Cidade"
              value={s.city}
              onChange={(e) => updateItem("sites", s.id, "city", e.target.value)}
            />
            <input
              style={{ ...INPUT_SM, width: "60px" }}
              placeholder="País"
              maxLength={2}
              value={s.country}
              onChange={(e) => updateItem("sites", s.id, "country", e.target.value.toUpperCase())}
            />
            <input
              style={{ ...INPUT_SM, width: "90px" }}
              placeholder="GPS lat"
              type="number"
              step="any"
              value={s.gps_lat ?? ""}
              onChange={(e) => updateItem("sites", s.id, "gps_lat", e.target.value ? parseFloat(e.target.value) : null)}
            />
            <input
              style={{ ...INPUT_SM, width: "90px" }}
              placeholder="GPS lon"
              type="number"
              step="any"
              value={s.gps_lon ?? ""}
              onChange={(e) => updateItem("sites", s.id, "gps_lon", e.target.value ? parseFloat(e.target.value) : null)}
            />
            <button onClick={() => removeItem("sites", s.id)}>✕</button>
          </div>
        </div>
      ))}
      <button
        onClick={() => addItem("sites", { address: "", postal_code: "", city: "", country: "", gps_lat: null, gps_lon: null })}
        style={{ fontSize: "0.85rem" }}
      >
        + Site
      </button>

      {/* Certificações */}
      <SectionTitle>Certificações / Labels de sustentabilidade</SectionTitle>
      {master.sustainability_certifications.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.4rem" }}>
          <label style={{ whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={c.has_certification}
              onChange={(e) => updateCert(i, "has_certification", e.target.checked)}
            />{" "}
            Tem certificação
          </label>
          <input
            style={{ ...INPUT_SM, flex: 1 }}
            placeholder="Descrição (ex. ISO 14001)"
            value={c.description}
            onChange={(e) => updateCert(i, "description", e.target.value)}
          />
          <button onClick={() => removeCert(i)}>✕</button>
        </div>
      ))}
      <button onClick={addCert} style={{ fontSize: "0.85rem" }}>+ Certificação</button>

      {/* Guardar */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <button onClick={handleSave} style={{ padding: "0.4rem 1.2rem" }}>Guardar nova versão</button>
        {status && <span style={{ color: "gray", fontSize: "0.9rem" }}>{status}</span>}
      </div>
    </div>
  );
}
