"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getFuelOptions, UNITS_BY_STATE } from "@/lib/fuelConverter";

// ── Shared style constants ────────────────────────────────────────────────────

const TH = {
  padding: "0.35rem 0.6rem",
  background: "#f5f5f5",
  border: "1px solid #ddd",
  textAlign: "left",
  fontSize: "0.85rem",
};
const TD = { padding: "0.3rem 0.5rem", border: "1px solid #ddd" };

// ── Shared UI primitives ──────────────────────────────────────────────────────

const STATE_CONFIG = {
  elaboracao: { label: "Elaboração",    color: "#555",    bg: "#f0f0f0" },
  aprovacao:  { label: "Ag. aprovação", color: "#8a6000", bg: "#fff8e1" },
  aprovado:   { label: "Aprovado",      color: "#1a6e1a", bg: "#e8f5e9" },
};

const PROVENANCE_CONFIG = {
  novo:                  { label: "Novo" },
  herdado_sem_alteracao: { label: "Herdado" },
  herdado_e_editado:     { label: "Herdado e editado" },
};

// ── DerivedValues — exibe campos calculados no backend ────────────────────────

const DERIVED_LABELS = {
  total_tco2e:        { label: "Total tCO₂e", unit: "tCO2e" },
  total_mwh:          { label: "Total MWh", unit: "MWh" },
  total_headcount:    { label: "Total efectivo", unit: null },
  total_fte:          { label: "Total ETI", unit: null },
  total_pct_total:    { label: "Total % do total", unit: "%" },
  total_quantity:     { label: "Total quantidade", unit: "toneladas" },
  total_quantity_ton: { label: "Total (toneladas)", unit: "toneladas" },
  total_quantity_kg:  { label: "Total (kg)", unit: "kg" },
  pay_gap_pct:        { label: "Diferença salarial por género", unit: "%" },
};

function DerivedValues({ derived }) {
  const entries = Object.entries(derived).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return null;
  return (
    <div style={{
      margin: "1rem 0",
      padding: "0.6rem 0.9rem",
      background: "#f0f4ff",
      border: "1px solid #c7d7f5",
      borderRadius: "4px",
      fontSize: "0.85rem",
    }}>
      <span style={{ fontWeight: 600, color: "#3550a0", marginRight: "0.75rem" }}>
        Calculado automaticamente
      </span>
      {entries.map(([key, value]) => {
        const meta = DERIVED_LABELS[key] ?? { label: key, unit: null };
        return (
          <span key={key} style={{ marginRight: "1.25rem", color: "#333" }}>
            {meta.label}:{" "}
            <strong>{typeof value === "number" ? value.toLocaleString("pt-PT") : value}</strong>
            {meta.unit && <span style={{ color: "#888" }}> {meta.unit}</span>}
          </span>
        );
      })}
    </div>
  );
}

function StateBadge({ state, provenance }) {
  const s = STATE_CONFIG[state] ?? STATE_CONFIG.elaboracao;
  const p = PROVENANCE_CONFIG[provenance];
  return (
    <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
      <span style={{
        padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem",
        background: s.bg, color: s.color, fontWeight: 600,
      }}>
        {s.label}
      </span>
      {p && <span style={{ fontSize: "0.75rem", color: "#888" }}>{p.label}</span>}
    </span>
  );
}

function ConfidentialityToggle({ value, onChange, disabled }) {
  return (
    <div style={{
      margin: "0.75rem 0", padding: "0.5rem 0.75rem",
      background: value ? "#fff3cd" : "#f8f9fa",
      border: "1px solid #dee2e6", borderRadius: "4px",
    }}>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: disabled ? "default" : "pointer" }}>
        <input type="checkbox" checked={value} disabled={disabled}
          onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: "0.85rem", color: value ? "#856404" : "#555" }}>
          Omitido por confidencialidade
        </span>
      </label>
    </div>
  );
}

function WorkflowButtons({ meta, onSave, onTransition, onToggleXhtml, showXhtml, status }) {
  const editable = meta.state === "elaboracao";
  return (
    <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
      {editable && <button onClick={onSave}>Guardar</button>}
      {editable && <button onClick={() => onTransition("submit")}>Submeter para aprovação</button>}
      {meta.state === "aprovacao" && (
        <>
          <button onClick={() => onTransition("approve")} style={{ background: "#e8f5e9" }}>Aprovar</button>
          <button onClick={() => onTransition("reject")}>Rejeitar</button>
        </>
      )}
      <button onClick={onToggleXhtml}>{showXhtml ? "Ocultar XHTML" : "Ver XHTML"}</button>
      {status && <span style={{ color: "gray", fontSize: "0.9rem" }}>{status}</span>}
    </div>
  );
}

// ── MiniQuestionnaire sub-editor ──────────────────────────────────────────────
// Renders the items tree, handling ConditionalSection nodes at render time.

function MiniQuestionnaireEditor({ definition, content, onChange, disabled }) {
  const answers = content.answers ?? [];
  const answerMap = Object.fromEntries(answers.map((a) => [a.item_code, a]));

  function handleAnswerChange(itemCode, field, val) {
    onChange({
      ...content,
      answers: answers.map((a) => {
        if (a.item_code !== itemCode) return a;
        const updated = { ...a, [field]: val };
        if (field === "value" && val === "NO") updated.specify = null;
        return updated;
      }),
    });
  }

  function renderNode(node, depth = 0) {
    if (node.node_type === "conditional_section") {
      const parentAnswer = answerMap[node.condition_item_code];
      if (parentAnswer?.value !== node.condition_value) return null;
      return (
        <div key={`cond-${node.condition_item_code}-${depth}`}
          style={{ marginLeft: "1.5rem", borderLeft: "2px solid #e0e0e0", paddingLeft: "1rem" }}>
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    const answer = answerMap[node.item_code] ?? { item_code: node.item_code, value: null, specify: null };
    const showSpecify = node.allows_specify && answer.value === "YES";

    if (node.value_type === "numeric") {
      return (
        <div key={node.item_code} style={{ marginBottom: "1rem", opacity: disabled ? 0.6 : 1 }}>
          <p style={{ marginBottom: "0.25rem" }}>
            <strong>{node.label}</strong>
            {node.unit && <span style={{ color: "#888", fontSize: "0.8rem" }}> ({node.unit})</span>}
          </p>
          <input
            type="number" step="any" disabled={disabled}
            value={answer.value ?? ""}
            onChange={(e) =>
              handleAnswerChange(node.item_code, "value",
                e.target.value === "" ? null : parseFloat(e.target.value))
            }
            style={{ width: "160px", padding: "0.3rem 0.5rem" }}
          />
        </div>
      );
    }

    return (
      <div key={node.item_code} style={{ marginBottom: "1rem", opacity: disabled ? 0.6 : 1 }}>
        <p style={{ marginBottom: "0.25rem" }}><strong>{node.label}</strong></p>
        <label style={{ marginRight: "1rem" }}>
          <input type="radio" name={node.item_code} value="YES"
            checked={answer.value === "YES"} disabled={disabled}
            onChange={() => handleAnswerChange(node.item_code, "value", "YES")} /> Sim
        </label>
        <label>
          <input type="radio" name={node.item_code} value="NO"
            checked={answer.value === "NO"} disabled={disabled}
            onChange={() => handleAnswerChange(node.item_code, "value", "NO")} /> Não
        </label>
        {showSpecify && (
          <div style={{ marginTop: "0.25rem" }}>
            <input
              type="text" placeholder="Por favor especifique" disabled={disabled}
              value={answer.specify ?? ""}
              onChange={(e) => handleAnswerChange(node.item_code, "specify", e.target.value)}
              style={{ width: "100%", maxWidth: "400px" }}
            />
          </div>
        )}
      </div>
    );
  }

  return <div>{(definition.items ?? []).map((node) => renderNode(node))}</div>;
}

// ── FuelCalculator — calculadora auxiliar de combustível (spec §6.1) ──────────
// Suporta múltiplos combustíveis em simultâneo.
// Chama POST /api/calc/fuel-converter por linha e agrega os totais.

const FUEL_OPTIONS = getFuelOptions();
const newRow = () => ({ id: Math.random().toString(36).slice(2, 9), fuel_code: "", quantity: "", unit: "", result: null, error: "", loading: false });

function FuelCalculator({ code, content, onChange, disabled }) {
  const storageKey = `fuel_calc_${code}`;
  const syncedRef  = useRef(null);

  const [rows, setRows] = useState(() => {
    // 1. sessionStorage — preserva linhas dentro da mesma sessão do browser
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // 2. content._calc — formato actual (entries array)
    const calc = content._calc;
    if (Array.isArray(calc?.entries) && calc.entries.length > 0) {
      return calc.entries.map((e) => ({
        id:        Math.random().toString(36).slice(2, 9),
        fuel_code: e.fuel_code,
        quantity:  String(e.quantity),
        unit:      e.input_unit,
        result:    { gj: e.gj, mwh: e.mwh, tco2e: e.tco2e, param_version: calc.param_version },
        error:     "",
        loading:   false,
      }));
    }
    // 3. content._calc — formato antigo (entrada única)
    if (calc?.fuel_code) {
      return [{
        id:        Math.random().toString(36).slice(2, 9),
        fuel_code: calc.fuel_code,
        quantity:  String(calc.quantity),
        unit:      calc.input_unit,
        result:    { gj: calc.gj, mwh: calc.gj / 3.6, tco2e: calc.tco2e, param_version: calc.param_version },
        error:     "",
        loading:   false,
      }];
    }
    return [newRow()];
  });

  const [open, setOpen] = useState(false);

  // Persiste linhas em sessionStorage sempre que mudam
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(rows)); } catch {}
  }, [rows, storageKey]);

  // Sincroniza content._calc sempre que há linhas calculadas,
  // para que o Guardar as preserve mesmo sem clicar "Usar total".
  useEffect(() => {
    const calcRows = rows.filter((r) => r.result);
    if (calcRows.length === 0) return;
    const key = calcRows.map((r) => `${r.fuel_code}:${r.quantity}:${r.unit}`).join("|");
    if (syncedRef.current === key) return;
    syncedRef.current = key;
    const param_version = calcRows[0].result.param_version;
    const total_gj    = calcRows.reduce((s, r) => s + r.result.gj,    0);
    const total_mwh   = calcRows.reduce((s, r) => s + r.result.mwh,   0);
    const total_tco2e = calcRows.reduce((s, r) => s + r.result.tco2e, 0);
    onChange((prev) => ({
      ...prev,
      _calc: {
        entries: calcRows.map((r) => ({
          fuel_code:  r.fuel_code,
          quantity:   parseFloat(r.quantity),
          input_unit: r.unit,
          gj:         r.result.gj,
          mwh:        r.result.mwh,
          tco2e:      r.result.tco2e,
        })),
        total_gj:      Math.round(total_gj    * 1e6) / 1e6,
        total_mwh:     Math.round(total_mwh   * 1e6) / 1e6,
        total_tco2e:   Math.round(total_tco2e * 1e6) / 1e6,
        param_version,
      },
    }));
  }, [rows]);

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => r.id !== id ? r : { ...r, ...patch }));
  }

  function handleFuelChange(id, code) {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const prevState = FUEL_OPTIONS.find((f) => f.fuel_code === r.fuel_code)?.state;
      const newState  = FUEL_OPTIONS.find((f) => f.fuel_code === code)?.state;
      return { ...r, fuel_code: code, unit: newState !== prevState ? "" : r.unit, result: null, error: "" };
    }));
  }

  async function handleCalcRow(id) {
    const row = rows.find((r) => r.id === id);
    if (!row || !row.fuel_code || !row.quantity || !row.unit) return;
    updateRow(id, { loading: true, error: "", result: null });
    try {
      const res = await fetch("/api/calc/fuel-converter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fuel_code: row.fuel_code, quantity: parseFloat(row.quantity), unit: row.unit }),
      });
      const data = await res.json();
      if (!res.ok) { updateRow(id, { loading: false, error: data.error ?? "Erro." }); return; }
      updateRow(id, { loading: false, result: data });
    } catch {
      updateRow(id, { loading: false, error: "Erro de rede." });
    }
  }

  const calculatedRows = rows.filter((r) => r.result);
  const total_gj    = calculatedRows.reduce((s, r) => s + r.result.gj,    0);
  const total_mwh   = calculatedRows.reduce((s, r) => s + r.result.mwh,   0);
  const total_tco2e = calculatedRows.reduce((s, r) => s + r.result.tco2e, 0);
  const hasResults  = calculatedRows.length > 0;

  function handleUse() {
    if (!hasResults) return;
    const param_version = calculatedRows[0].result.param_version;
    onChange({
      ...content,
      value: Math.round(total_mwh * 1e6) / 1e6,
      _calc: {
        entries: calculatedRows.map((r) => ({
          fuel_code:  r.fuel_code,
          quantity:   parseFloat(r.quantity),
          input_unit: r.unit,
          gj:         r.result.gj,
          mwh:        r.result.mwh,
          tco2e:      r.result.tco2e,
        })),
        total_gj:      Math.round(total_gj    * 1e6) / 1e6,
        total_mwh:     Math.round(total_mwh   * 1e6) / 1e6,
        total_tco2e:   Math.round(total_tco2e * 1e6) / 1e6,
        param_version,
      },
    });
    setOpen(false);
  }

  const fmt3  = (n) => n.toLocaleString("pt-PT", { maximumFractionDigits: 3 });
  const fmt4  = (n) => n.toLocaleString("pt-PT", { maximumFractionDigits: 4 });

  return (
    <div style={{ margin: "0.75rem 0", border: "1px solid #d0d7e3", borderRadius: "4px", background: "#f8f9ff" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ padding: "0.5rem 0.75rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#3550a0", fontWeight: 600, userSelect: "none" }}
      >
        <span>Calculadora de combustível</span>
        <span style={{ fontSize: "0.75rem", color: "#888" }}>{open ? "▲ Fechar" : "▼ Abrir"}</span>
      </div>

      {open && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid #d0d7e3" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "0.5rem" }}>
            <thead>
              <tr>
                {["Combustível", "Quantidade", "Unidade", "GJ", "MWh", "tCO2e", ""].map((h) => (
                  <th key={h} style={{ ...TH, background: "#eef0fb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const fuel = FUEL_OPTIONS.find((f) => f.fuel_code === row.fuel_code);
                const units = fuel ? (UNITS_BY_STATE[fuel.state] ?? []) : [];
                const canCalc = row.fuel_code && row.quantity && row.unit;
                return (
                  <tr key={row.id}>
                    <td style={TD}>
                      <select
                        value={row.fuel_code}
                        onChange={(e) => handleFuelChange(row.id, e.target.value)}
                        style={{ width: "100%", padding: "0.2rem 0.3rem", border: "none", background: "transparent", minWidth: "170px" }}
                      >
                        <option value="">— seleccione —</option>
                        {FUEL_OPTIONS.map((f) => (
                          <option key={f.fuel_code} value={f.fuel_code}>{f.fuel_name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={TD}>
                      <input
                        type="number" step="any" min="0" disabled={!row.fuel_code}
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, { quantity: e.target.value, result: null })}
                        style={{ width: "90px", padding: "0.2rem 0.3rem", border: "none", background: "transparent" }}
                      />
                    </td>
                    <td style={TD}>
                      <select
                        value={row.unit} disabled={!row.fuel_code}
                        onChange={(e) => updateRow(row.id, { unit: e.target.value, result: null })}
                        style={{ padding: "0.2rem 0.3rem", border: "none", background: "transparent" }}
                      >
                        <option value="">—</option>
                        {units.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{ ...TD, color: row.result ? "#333" : "#bbb", textAlign: "right" }}>
                      {row.result ? fmt3(row.result.gj) : "—"}
                    </td>
                    <td style={{ ...TD, color: row.result ? "#333" : "#bbb", textAlign: "right" }}>
                      {row.result ? fmt3(row.result.mwh) : "—"}
                    </td>
                    <td style={{ ...TD, color: row.result ? "#333" : "#bbb", textAlign: "right" }}>
                      {row.result ? fmt4(row.result.tco2e) : "—"}
                    </td>
                    <td style={{ ...TD, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => handleCalcRow(row.id)}
                        disabled={!canCalc || row.loading}
                        style={{ fontSize: "0.78rem", padding: "0.15rem 0.5rem", marginRight: "0.25rem" }}
                      >
                        {row.loading ? "…" : "Calcular"}
                      </button>
                      {rows.length > 1 && (
                        <button
                          onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                          style={{ color: "#c00", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                        >✕</button>
                      )}
                      {row.error && <span style={{ color: "#c00", fontSize: "0.75rem", display: "block" }}>{row.error}</span>}
                    </td>
                  </tr>
                );
              })}

              {hasResults && (
                <tr style={{ fontWeight: 600, background: "#eef0fb" }}>
                  <td style={TD} colSpan={3}>TOTAL</td>
                  <td style={{ ...TD, textAlign: "right" }}>{fmt3(total_gj)}</td>
                  <td style={{ ...TD, textAlign: "right" }}>{fmt3(total_mwh)}</td>
                  <td style={{ ...TD, textAlign: "right" }}>{fmt4(total_tco2e)}</td>
                  <td style={TD}></td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setRows((prev) => [...prev, newRow()])} style={{ fontSize: "0.85rem" }}>
              + Adicionar combustível
            </button>
            {hasResults && !disabled && (
              <button
                onClick={handleUse}
                style={{ padding: "0.3rem 0.75rem", background: "#3550a0", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Usar total ({fmt3(total_mwh)} MWh)
              </button>
            )}
          </div>

          {content._calc && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: "0.5rem 0 0" }}>
              Valor actual: {content._calc.entries?.length ?? 1} fonte(s) — {content._calc.param_version}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── NumericMetric sub-editor ──────────────────────────────────────────────────

function NumericMetricEditor({ definition, content, onChange, disabled }) {
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>
          Valor{definition.unit ? ` (${definition.unit})` : ""}
        </label>
        <input
          type="number" step="any" disabled={disabled}
          value={content.value ?? ""}
          onChange={(e) =>
            onChange({ ...content, value: e.target.value === "" ? null : parseFloat(e.target.value) })
          }
          style={{ width: "200px", padding: "0.35rem 0.5rem" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>Nota</label>
        <textarea
          disabled={disabled} rows={3}
          value={content.note ?? ""}
          onChange={(e) => onChange({ ...content, note: e.target.value })}
          style={{ width: "100%", maxWidth: "500px", padding: "0.35rem 0.5rem" }}
        />
      </div>
    </div>
  );
}

// ── StructuredTable sub-editor ────────────────────────────────────────────────

function StructuredTableEditor({ definition, content, onChange, disabled }) {
  const rows = definition.rows ?? [];
  const cols = definition.columns ?? [];
  const cells = content.cells ?? {};

  function setCell(rowCode, colCode, value) {
    onChange({ ...content, cells: { ...cells, [`${rowCode}::${colCode}`]: value } });
  }

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th style={TH}>—</th>
          {cols.map((col) => (
            <th key={col.col_code} style={TH}>
              {col.label}{col.unit && <span style={{ color: "#888" }}> ({col.unit})</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.row_code}>
            <td style={{ ...TD, fontWeight: 600, background: "#fafafa" }}>{row.label}</td>
            {cols.map((col) => {
              const key = `${row.row_code}::${col.col_code}`;
              const val = cells[key] ?? col.default_value ?? "";
              return (
                <td key={col.col_code} style={TD}>
                  <input
                    type={col.value_type === "numeric" ? "number" : "text"}
                    step={col.value_type === "numeric" ? "any" : undefined}
                    disabled={disabled}
                    value={val === null ? "" : val}
                    onChange={(e) =>
                      setCell(row.row_code, col.col_code,
                        col.value_type === "numeric"
                          ? (e.target.value === "" ? null : parseFloat(e.target.value))
                          : e.target.value
                      )
                    }
                    style={{ width: "100%", padding: "0.25rem 0.35rem", border: "none", background: "transparent" }}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── RepeatableTable sub-editor ────────────────────────────────────────────────
// Also used for RepeatableTableWithTotals — pass `totals` prop to show totals row.

function RepeatableTableEditor({ definition, content, onChange, disabled, totals }) {
  const cols = definition.columns ?? [];
  const rows = content.rows ?? [];

  function addRow() {
    const newRow = {
      row_id: Math.random().toString(36).slice(2, 9),
      values: Object.fromEntries(cols.map((c) => [c.col_code, c.default_value ?? null])),
    };
    onChange({ ...content, rows: [...rows, newRow] });
  }

  function removeRow(rowId) {
    onChange({ ...content, rows: rows.filter((r) => r.row_id !== rowId) });
  }

  function setCell(rowId, colCode, value) {
    onChange({
      ...content,
      rows: rows.map((r) =>
        r.row_id !== rowId ? r : { ...r, values: { ...r.values, [colCode]: value } }
      ),
    });
  }

  return (
    <div>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "0.75rem" }}>
        <thead>
          <tr>
            {cols.map((col) => (
              <th key={col.col_code} style={TH}>
                {col.label}{col.unit && <span style={{ color: "#888" }}> ({col.unit})</span>}
              </th>
            ))}
            {!disabled && <th style={TH}></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.row_id}>
              {cols.map((col) => {
                const val = row.values?.[col.col_code] ?? col.default_value ?? "";
                return (
                  <td key={col.col_code} style={TD}>
                    <input
                      type={col.value_type === "numeric" ? "number" : "text"}
                      step={col.value_type === "numeric" ? "any" : undefined}
                      disabled={disabled}
                      value={val === null ? "" : val}
                      onChange={(e) =>
                        setCell(row.row_id, col.col_code,
                          col.value_type === "numeric"
                            ? (e.target.value === "" ? null : parseFloat(e.target.value))
                            : e.target.value
                        )
                      }
                      style={{ width: "100%", padding: "0.25rem 0.35rem", border: "none", background: "transparent" }}
                    />
                  </td>
                );
              })}
              {!disabled && (
                <td style={TD}>
                  <button
                    onClick={() => removeRow(row.row_id)}
                    style={{ color: "#c00", background: "none", border: "none", cursor: "pointer" }}
                  >✕</button>
                </td>
              )}
            </tr>
          ))}

          {totals && rows.length > 0 && (
            <tr style={{ fontWeight: 600, background: "#f0f4f0" }}>
              {cols.map((col, i) => (
                <td key={col.col_code} style={TD}>
                  {i === 0
                    ? "TOTAL"
                    : (totals[col.col_code] != null
                        ? totals[col.col_code].toLocaleString("pt-PT")
                        : "")}
                </td>
              ))}
              {!disabled && <td style={TD}></td>}
            </tr>
          )}
        </tbody>
      </table>

      {!disabled && (
        <button onClick={addRow} style={{ fontSize: "0.85rem" }}>+ Adicionar linha</button>
      )}
    </div>
  );
}

// ── TimeSeriesComparative sub-editor ──────────────────────────────────────────

function TimeSeriesEditor({ definition, content, onChange, disabled }) {
  const entries = content.entries ?? [];

  function addEntry() {
    onChange({
      ...content,
      entries: [...entries, {
        entry_id: Math.random().toString(36).slice(2, 9),
        period_label: "",
        value: null,
      }],
    });
  }

  function removeEntry(entryId) {
    onChange({ ...content, entries: entries.filter((e) => e.entry_id !== entryId) });
  }

  function setField(entryId, field, value) {
    onChange({
      ...content,
      entries: entries.map((e) =>
        e.entry_id !== entryId ? e : { ...e, [field]: value }
      ),
    });
  }

  return (
    <div>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "0.75rem" }}>
        <thead>
          <tr>
            <th style={TH}>Período</th>
            <th style={TH}>
              {definition.value_label ?? "Valor"}
              {definition.unit && <span style={{ color: "#888" }}> ({definition.unit})</span>}
            </th>
            {!disabled && <th style={TH}></th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.entry_id}>
              <td style={TD}>
                <input
                  type="text" disabled={disabled}
                  value={entry.period_label}
                  onChange={(e) => setField(entry.entry_id, "period_label", e.target.value)}
                  style={{ width: "100%", padding: "0.25rem 0.35rem", border: "none", background: "transparent" }}
                />
              </td>
              <td style={TD}>
                <input
                  type="number" step="any" disabled={disabled}
                  value={entry.value ?? ""}
                  onChange={(e) =>
                    setField(entry.entry_id, "value",
                      e.target.value === "" ? null : parseFloat(e.target.value))
                  }
                  style={{ width: "100%", padding: "0.25rem 0.35rem", border: "none", background: "transparent" }}
                />
              </td>
              {!disabled && (
                <td style={TD}>
                  <button
                    onClick={() => removeEntry(entry.entry_id)}
                    style={{ color: "#c00", background: "none", border: "none", cursor: "pointer" }}
                  >✕</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button onClick={addEntry} style={{ fontSize: "0.85rem" }}>+ Adicionar período</button>
      )}
    </div>
  );
}

// ── Narrative sub-editor ──────────────────────────────────────────────────────

function NarrativeEditor({ definition, content, onChange, disabled }) {
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>
          {definition.text_label ?? "Texto"}
        </label>
        <textarea
          disabled={disabled} rows={8}
          value={content.text ?? ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          style={{ width: "100%", maxWidth: "700px", padding: "0.35rem 0.5rem", fontFamily: "inherit" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>Nota</label>
        <textarea
          disabled={disabled} rows={2}
          value={content.note ?? ""}
          onChange={(e) => onChange({ ...content, note: e.target.value })}
          style={{ width: "100%", maxWidth: "700px", padding: "0.35rem 0.5rem", fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}

// ── Main DisclosureEditor ─────────────────────────────────────────────────────

export default function DisclosureEditor({ definition }) {
  const [content, setContent] = useState(null);
  const [meta, setMeta] = useState({ state: "elaboracao", provenance: "novo" });
  const [status, setStatus] = useState("");
  const [xhtml, setXhtml] = useState("");
  const [showXhtml, setShowXhtml] = useState(false);
  const [noContext, setNoContext] = useState(null); // null | "undertaking" | "period"
  const [derived, setDerived] = useState({});
  const debounceRef = useRef(null);

  const apiBase = `/api/block/${definition.code}`;

  const load = useCallback(async () => {
    const res = await fetch(apiBase);
    if (res.status === 400) {
      const data = await res.json();
      setNoContext(data.error?.includes("undertaking") ? "undertaking" : "period");
      return;
    }
    if (!res.ok) { setStatus("Erro ao carregar."); return; }
    const data = await res.json();
    const { _meta, ...rest } = data;
    setContent(rest);
    setMeta(_meta ?? { state: "elaboracao", provenance: "novo" });
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  // Debounce: chama /api/calc/[code] 400ms após cada alteração ao content
  useEffect(() => {
    if (!content) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/calc/${definition.code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(content),
        });
        if (res.ok) {
          const data = await res.json();
          setDerived(data.derived ?? {});
        }
      } catch {
        // falha silenciosa — não bloqueia a edição
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [content, definition.code]);

  async function handleSave() {
    setStatus("A guardar…");
    const res = await fetch(apiBase, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    if (res.ok) { await load(); setStatus("Guardado."); }
    else {
      const d = await res.json();
      const err = d.error;
      setStatus(typeof err === "string" ? err : "Erro de validação.");
    }
  }

  async function handleTransition(action) {
    const labels = { submit: "A submeter…", approve: "A aprovar…", reject: "A rejeitar…" };
    setStatus(labels[action] ?? "");
    const res = await fetch(`${apiBase}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) { await load(); setStatus(""); }
    else { const d = await res.json(); setStatus(d.error ?? "Erro."); }
  }

  async function handleToggleXhtml() {
    if (!showXhtml) {
      const res = await fetch(`${apiBase}/xhtml`);
      setXhtml(await res.text());
    }
    setShowXhtml((v) => !v);
  }

  if (noContext === "undertaking") {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
        <p style={{ color: "#999" }}>Sem empresa activa. Seleccione uma empresa no menu ou contacte o administrador.</p>
      </div>
    );
  }
  if (noContext === "period") {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
        <p style={{ color: "#999" }}>
          Sem período activo. <a href="/periods">Criar o primeiro período de reporte</a>
        </p>
      </div>
    );
  }
  if (!content) {
    return <p style={{ margin: "2rem", fontFamily: "sans-serif" }}>A carregar…</p>;
  }

  const isConfidential = !!content.omitido_por_confidencialidade;
  const editable = meta.state === "elaboracao" && !isConfidential;

  // Para RepeatableTableWithTotals: os totais vêm do backend (derived),
  // mapeamos derived.total_{col_code} → totals[col_code] para o sub-editor.
  let totals = null;
  if (definition.block_type === "repeatable_table_with_totals") {
    totals = {};
    for (const [key, val] of Object.entries(derived)) {
      if (key.startsWith("total_")) {
        totals[key.slice("total_".length)] = val;
      }
    }
  }

  function renderSubEditor() {
    if (isConfidential) {
      return (
        <p style={{ color: "#856404", fontStyle: "italic", padding: "1rem 0" }}>
          Este bloco foi marcado como omitido por confidencialidade. Edição desactivada.
        </p>
      );
    }

    switch (definition.block_type) {
      case "mini_questionnaire":
        return <MiniQuestionnaireEditor definition={definition} content={content}
          onChange={setContent} disabled={!editable} />;
      case "numeric_metric":
        return (
          <>
            {definition.calculator === "fuel_converter" && (
              <FuelCalculator code={definition.code} content={content} onChange={setContent} disabled={!editable} />
            )}
            <NumericMetricEditor definition={definition} content={content}
              onChange={setContent} disabled={!editable} />
          </>
        );
      case "structured_table":
        return <StructuredTableEditor definition={definition} content={content}
          onChange={setContent} disabled={!editable} />;
      case "repeatable_table":
        return <RepeatableTableEditor definition={definition} content={content}
          onChange={setContent} disabled={!editable} totals={null} />;
      case "repeatable_table_with_totals":
        return <RepeatableTableEditor definition={definition} content={content}
          onChange={setContent} disabled={!editable} totals={totals} />;
      case "time_series_comparative":
        return <TimeSeriesEditor definition={definition} content={content}
          onChange={setContent} disabled={!editable} />;
      case "narrative":
        return <NarrativeEditor definition={definition} content={content}
          onChange={setContent} disabled={!editable} />;
      default:
        return <p style={{ color: "#c00" }}>Unknown block type: {definition.block_type}</p>;
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <p style={{ fontSize: "0.85rem", color: "#888", margin: "0 0 0.25rem" }}>
        <a href="/disclosures" style={{ color: "#888" }}>← Divulgações</a>
      </p>
      <h1 style={{ fontSize: "1.3rem", marginTop: "0.25rem" }}>{definition.title}</h1>

      <StateBadge state={meta.state} provenance={meta.provenance} />

      <ConfidentialityToggle
        value={isConfidential}
        onChange={(val) => setContent((prev) => ({ ...prev, omitido_por_confidencialidade: val }))}
        disabled={meta.state !== "elaboracao"}
      />

      {renderSubEditor()}

      <DerivedValues derived={derived} />

      <WorkflowButtons
        meta={meta}
        onSave={handleSave}
        onTransition={handleTransition}
        onToggleXhtml={handleToggleXhtml}
        showXhtml={showXhtml}
        status={status}
      />

      {showXhtml && (
        <pre style={{
          marginTop: "1.5rem", background: "#f4f4f4", padding: "1rem",
          overflowX: "auto", fontSize: "0.8rem",
        }}>
          {xhtml}
        </pre>
      )}
    </div>
  );
}
