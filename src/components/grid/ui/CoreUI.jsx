// src/components/ui/CoreUI.jsx
import React, { useState, useEffect } from "react";
import { COLORS } from "../../utils/theme";

const INPUT_STYLE = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${COLORS.lightGray}`, fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "'Segoe UI', system-ui, sans-serif",
  backgroundColor: COLORS.white, color: COLORS.text, colorScheme: "light",
};
const SELECT_STYLE = { ...INPUT_STYLE, appearance: "auto" };
export const SMALL_INPUT = { ...INPUT_STYLE, width: 60, padding: "7px 8px", textAlign: "center" };

export const Logo = ({ size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <img src="https://gceducationanalytics.com/images/gceducationlogo.png" alt="GC Education Analytics" style={{ height: size, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
  </div>
);

export const Btn = ({ children, variant = "primary", onClick, disabled, style, small }) => {
  const v = {
    primary: { background: COLORS.primary, color: COLORS.white },
    secondary: { background: COLORS.lightGray, color: COLORS.text },
    accent: { background: COLORS.accent, color: COLORS.white },
    danger: { background: COLORS.danger, color: COLORS.white },
    success: { background: COLORS.success, color: COLORS.white },
    ghost: { background: "transparent", color: COLORS.primary, border: `1px solid ${COLORS.primary}` },
    warning: { background: COLORS.warning, color: COLORS.white },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "6px 14px" : "10px 22px", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: small ? 13 : 14,
      fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "all 0.2s",
      opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6,
      ...v[variant], ...style,
    }}>{children}</button>
  );
};

export const Card = ({ children, style, onClick, selected }) => (
  <div onClick={onClick} style={{
    background: COLORS.white, borderRadius: 12, padding: 20, color: COLORS.text,
    border: selected ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.lightGray}`,
    boxShadow: selected ? `0 0 0 3px ${COLORS.accentLight}` : "0 1px 3px rgba(0,0,0,0.06)",
    cursor: onClick ? "pointer" : "default", transition: "all 0.2s", ...style,
  }}>{children}</div>
);

export const NumInput = ({ label, value, onChange, min, max, helperText, style: sx }) => {
  const [lv, setLv] = useState(String(value ?? ""));
  useEffect(() => { setLv(String(value ?? "")); }, [value]);
  const hc = e => { const r = e.target.value; setLv(r); if (r === "" || r === "-") return; const n = parseInt(r, 10); if (!isNaN(n)) onChange(n); };
  const hb = () => { if (lv === "" || isNaN(parseInt(lv, 10))) { const f = min ?? 0; setLv(String(f)); onChange(f); } };
  return (
    <div style={{ marginBottom: 14, ...sx }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}</label>}
      <input type="number" value={lv} onChange={hc} onBlur={hb} min={min} max={max} style={INPUT_STYLE} />
      {helperText && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 3 }}>{helperText}</div>}
    </div>
  );
};

export const TimeInput = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}</label>}
    <input type="time" value={value || ""} onChange={e => onChange(e.target.value)} style={INPUT_STYLE} />
  </div>
);

export const Sel = ({ label, value, onChange, options, helperText }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}</label>}
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={SELECT_STYLE}>
      {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {helperText && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 3 }}>{helperText}</div>}
  </div>
);

export const Toggle = ({ label, checked, onChange, description }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, cursor: "pointer" }} onClick={() => onChange(!checked)}>
    <div style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 1, background: checked ? COLORS.primary : COLORS.lightGray, transition: "background 0.2s", position: "relative" }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: COLORS.white, position: "absolute", top: 2, left: checked ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
    <div>
      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{label}</div>
      {description && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>{description}</div>}
    </div>
  </div>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, borderBottom: `2px solid ${COLORS.lightGray}`, marginBottom: 18, overflowX: "auto" }}>
    {tabs.map(t => (
      <div key={t.id} onClick={() => onChange(t.id)} style={{
        padding: "10px 18px", cursor: "pointer", fontSize: 14, whiteSpace: "nowrap",
        fontWeight: active === t.id ? 700 : 500, color: active === t.id ? COLORS.primary : COLORS.textLight,
        borderBottom: active === t.id ? `3px solid ${COLORS.primary}` : "3px solid transparent", marginBottom: -2,
      }}>{t.label}</div>
    ))}
  </div>
);
