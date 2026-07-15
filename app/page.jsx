"use client";

import { useEffect, useState } from "react";

const ITEM_LABELS = {
  code_of_conduct: "Does the undertaking have a code of conduct or human rights policy for its own workforce?",
  covers_child_labour: "Does this cover child labour?",
  covers_forced_labour: "Does this cover forced labour?",
  covers_human_trafficking: "Does this cover human trafficking?",
  covers_discrimination: "Does this cover discrimination?",
  covers_accident_prevention: "Does this cover accident prevention?",
  covers_other: "Does this cover other?",
  complaints_mechanism: "Does the undertaking have a complaints-handling mechanism for its own workforce?",
};

const ALLOWS_SPECIFY = new Set(["covers_other"]);

const STATE_CONFIG = {
  elaboracao:  { label: "Elaboração",       color: "#555",  bg: "#f0f0f0" },
  aprovacao:   { label: "Ag. aprovação",    color: "#8a6000", bg: "#fff8e1" },
  aprovado:    { label: "Aprovado",         color: "#1a6e1a", bg: "#e8f5e9" },
};

const PROVENANCE_CONFIG = {
  novo:                  { label: "Novo" },
  herdado_sem_alteracao: { label: "Herdado" },
  herdado_e_editado:     { label: "Herdado e editado" },
};

function StateBadge({ state, provenance }) {
  const s = STATE_CONFIG[state] ?? STATE_CONFIG.elaboracao;
  const p = PROVENANCE_CONFIG[provenance];
  return (
    <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", background: s.bg, color: s.color, fontWeight: 600 }}>
        {s.label}
      </span>
      {p && (
        <span style={{ fontSize: "0.75rem", color: "#888" }}>{p.label}</span>
      )}
    </span>
  );
}

function AnswerRow({ answer, onChange, disabled }) {
  const label = ITEM_LABELS[answer.item_code] ?? answer.item_code;
  const showSpecify = ALLOWS_SPECIFY.has(answer.item_code) && answer.value === "YES";

  return (
    <div style={{ marginBottom: "1rem", opacity: disabled ? 0.6 : 1 }}>
      <p style={{ marginBottom: "0.25rem" }}>
        <strong>{label}</strong>
      </p>
      <label style={{ marginRight: "1rem" }}>
        <input type="radio" name={answer.item_code} value="YES"
          checked={answer.value === "YES"} disabled={disabled}
          onChange={() => onChange(answer.item_code, "value", "YES")} /> YES
      </label>
      <label>
        <input type="radio" name={answer.item_code} value="NO"
          checked={answer.value === "NO"} disabled={disabled}
          onChange={() => onChange(answer.item_code, "value", "NO")} /> NO
      </label>
      {showSpecify && (
        <div style={{ marginTop: "0.25rem" }}>
          <input type="text" placeholder="Please specify" disabled={disabled}
            value={answer.specify ?? ""}
            onChange={(e) => onChange(answer.item_code, "specify", e.target.value)}
            style={{ width: "100%", maxWidth: "400px" }} />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [answers, setAnswers] = useState([]);
  const [meta, setMeta] = useState({ state: "elaboracao", provenance: "novo" });
  const [status, setStatus] = useState("");
  const [xhtml, setXhtml] = useState("");
  const [showXhtml, setShowXhtml] = useState(false);
  const [noContext, setNoContext] = useState(null); // null | "undertaking" | "period"

  async function load() {
    const res = await fetch("/api/block/b8");
    if (res.status === 400) {
      const data = await res.json();
      setNoContext(data.error?.includes("undertaking") ? "undertaking" : "period");
      return;
    }
    const data = await res.json();
    setAnswers(data.answers ?? []);
    setMeta(data._meta ?? { state: "elaboracao", provenance: "novo" });
  }

  useEffect(() => { load(); }, []);

  function handleChange(itemCode, field, val) {
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.item_code !== itemCode) return a;
        const updated = { ...a, [field]: val };
        if (field === "value" && val === "NO") updated.specify = null;
        return updated;
      })
    );
  }

  async function handleSave() {
    setStatus("A guardar…");
    const res = await fetch("/api/block/b8", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionnaire_code: "B8", answers }),
    });
    if (res.ok) {
      await load();
      setStatus("Guardado.");
    } else {
      const data = await res.json();
      setStatus(data.error ?? "Erro ao guardar.");
    }
  }

  async function handleTransition(action) {
    const labels = { submit: "A submeter…", approve: "A aprovar…", reject: "A rejeitar…" };
    setStatus(labels[action]);
    const res = await fetch("/api/block/b8/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await load();
      setStatus("");
    } else {
      const data = await res.json();
      setStatus(data.error ?? "Erro.");
    }
  }

  async function handleToggleXhtml() {
    if (!showXhtml) {
      const res = await fetch("/api/block/b8/xhtml");
      setXhtml(await res.text());
    }
    setShowXhtml((v) => !v);
  }

  if (noContext === "undertaking") {
    return (
      <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
        <p style={{ color: "#999" }}>Sem empresa activa. Seleccione uma empresa no menu ou contacte o administrador.</p>
      </div>
    );
  }

  if (noContext === "period") {
    return (
      <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
        <p style={{ color: "#999" }}>
          Sem período activo. <a href="/periods">Criar o primeiro período de reporte →</a>
        </p>
      </div>
    );
  }

  const editable = meta.state === "elaboracao";

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1>VSME B8 — Code of Conduct &amp; Human Rights</h1>

      <StateBadge state={meta.state} provenance={meta.provenance} />

      {answers.map((answer) => (
        <AnswerRow key={answer.item_code} answer={answer} onChange={handleChange} disabled={!editable} />
      ))}

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        {editable && <button onClick={handleSave}>Guardar</button>}
        {editable && <button onClick={() => handleTransition("submit")}>Submeter para aprovação</button>}
        {meta.state === "aprovacao" && (
          <>
            <button onClick={() => handleTransition("approve")} style={{ background: "#e8f5e9" }}>Aprovar</button>
            <button onClick={() => handleTransition("reject")}>Rejeitar</button>
          </>
        )}
        <button onClick={handleToggleXhtml}>{showXhtml ? "Ocultar XHTML" : "Ver XHTML"}</button>
        {status && <span style={{ color: "gray", fontSize: "0.9rem" }}>{status}</span>}
      </div>

      {showXhtml && (
        <pre style={{ marginTop: "1.5rem", background: "#f4f4f4", padding: "1rem", overflowX: "auto", fontSize: "0.8rem" }}>
          {xhtml}
        </pre>
      )}
    </div>
  );
}
