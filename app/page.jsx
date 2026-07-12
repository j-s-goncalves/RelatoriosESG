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

function AnswerRow({ answer, onChange }) {
  const label = ITEM_LABELS[answer.item_code] ?? answer.item_code;
  const showSpecify = ALLOWS_SPECIFY.has(answer.item_code) && answer.value === "YES";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ marginBottom: "0.25rem" }}>
        <strong>{label}</strong>
      </p>
      <label style={{ marginRight: "1rem" }}>
        <input
          type="radio"
          name={answer.item_code}
          value="YES"
          checked={answer.value === "YES"}
          onChange={() => onChange(answer.item_code, "value", "YES")}
        />{" "}
        YES
      </label>
      <label>
        <input
          type="radio"
          name={answer.item_code}
          value="NO"
          checked={answer.value === "NO"}
          onChange={() => onChange(answer.item_code, "value", "NO")}
        />{" "}
        NO
      </label>
      {showSpecify && (
        <div style={{ marginTop: "0.25rem" }}>
          <input
            type="text"
            placeholder="Please specify"
            value={answer.specify ?? ""}
            onChange={(e) => onChange(answer.item_code, "specify", e.target.value)}
            style={{ width: "100%", maxWidth: "400px" }}
          />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [answers, setAnswers] = useState([]);
  const [status, setStatus] = useState("");
  const [xhtml, setXhtml] = useState("");
  const [showXhtml, setShowXhtml] = useState(false);

  useEffect(() => {
    fetch("/api/block/b8")
      .then((r) => r.json())
      .then((data) => setAnswers(data.answers));
  }, []);

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
    setStatus("Saving...");
    const res = await fetch("/api/block/b8", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionnaire_code: "B8", answers }),
    });
    setStatus(res.ok ? "Saved." : "Error saving.");
  }

  async function handleToggleXhtml() {
    if (!showXhtml) {
      const res = await fetch("/api/block/b8/xhtml");
      setXhtml(await res.text());
    }
    setShowXhtml((v) => !v);
  }

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1>VSME B8 — Code of Conduct &amp; Human Rights</h1>

      {answers.map((answer) => (
        <AnswerRow key={answer.item_code} answer={answer} onChange={handleChange} />
      ))}

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <button onClick={handleSave}>Guardar</button>
        <button onClick={handleToggleXhtml}>{showXhtml ? "Ocultar XHTML" : "Ver XHTML"}</button>
        {status && <span style={{ color: "gray" }}>{status}</span>}
      </div>

      {showXhtml && (
        <pre style={{ marginTop: "1.5rem", background: "#f4f4f4", padding: "1rem", overflowX: "auto", fontSize: "0.8rem" }}>
          {xhtml}
        </pre>
      )}
    </div>
  );
}
