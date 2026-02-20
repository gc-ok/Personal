// src/App.jsx
import React, { useState, useEffect } from "react";
import { COLORS } from "./utils/theme";
import { generateSchedule } from "./core/engine";
import ScheduleGridView from "./components/grid/ScheduleGridView";

// ==========================================
// 1. GENERIC UI COMPONENTS & STYLES
// ==========================================
const INPUT_STYLE = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${COLORS.lightGray}`, fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "'Segoe UI', system-ui, sans-serif",
  backgroundColor: COLORS.white, color: COLORS.text, colorScheme: "light",
};
const SELECT_STYLE = { ...INPUT_STYLE, appearance: "auto" };
const SMALL_INPUT = { ...INPUT_STYLE, width: 60, padding: "7px 8px", textAlign: "center" };

const toMins = t => { if (!t) return 480; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = mins => {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const Logo = ({ size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <img src="https://gceducationanalytics.com/images/gceducationlogo.png" alt="GC Education Analytics" style={{ height: size, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
  </div>
);

const Btn = ({ children, variant = "primary", onClick, disabled, style, small }) => {
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

const Card = ({ children, style, onClick, selected }) => (
  <div onClick={onClick} style={{
    background: COLORS.white, borderRadius: 12, padding: 20, color: COLORS.text,
    border: selected ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.lightGray}`,
    boxShadow: selected ? `0 0 0 3px ${COLORS.accentLight}` : "0 1px 3px rgba(0,0,0,0.06)",
    cursor: onClick ? "pointer" : "default", transition: "all 0.2s", ...style,
  }}>{children}</div>
);

const NumInput = ({ label, value, onChange, min, max, helperText, style: sx }) => {
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

const TimeInput = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}</label>}
    <input type="time" value={value || ""} onChange={e => onChange(e.target.value)} style={INPUT_STYLE} />
  </div>
);

const Sel = ({ label, value, onChange, options, helperText }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}</label>}
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={SELECT_STYLE}>
      {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {helperText && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 3 }}>{helperText}</div>}
  </div>
);

const Toggle = ({ label, checked, onChange, description }) => (
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

const Tabs = ({ tabs, active, onChange }) => (
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

// ==========================================
// 2. WIZARD STEPS
// ==========================================
function SchoolTypeStep({ config: c, setConfig, onNext }) {
  const types = [
    { id: "elementary", l: "Elementary School", i: "🏫", d: "Grades K-5/6. Self-contained classrooms with specials rotation." },
    { id: "middle", l: "Middle School", i: "🏛️", d: "Grades 6-8. Students rotate between classrooms." },
    { id: "high", l: "High School", i: "🎓", d: "Grades 9-12. Full departmentalized scheduling." },
    { id: "k8", l: "K-8 School", i: "📚", d: "Combined elementary and middle." },
    { id: "k12", l: "K-12 School", i: "🏫🎓", d: "All grades. Complex mixed structure." },
    { id: "6_12", l: "6-12 School", i: "🏛️🎓", d: "Combined middle and high school." },
  ];
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>What type of school?</h2>
      <p style={{ color: COLORS.textLight, marginBottom: 20, fontSize: 14 }}>Select what best describes your school.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {types.map(t => (
          <Card key={t.id} selected={c.schoolType === t.id} onClick={() => setConfig({ ...c, schoolType: t.id })}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{t.i}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.l}</div>
            <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{t.d}</div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={onNext} disabled={!c.schoolType}>Continue →</Btn>
      </div>
    </div>
  );
}

function ScheduleTypeStep({ config: c, setConfig, onNext, onBack }) {
  const all = [
    { id: "traditional", l: "Traditional", i: "📋", d: "Same classes every day, 6-8 periods.", b: "Simplicity" },
    { id: "ab_block", l: "A/B Block", i: "🔄", d: "Alternating A/B days. Longer periods.", b: "Labs & Arts" },
    { id: "4x4_block", l: "4×4 Block", i: "4️⃣", d: "4 courses/semester. 90 min daily.", b: "Accelerated credits" },
    { id: "modified_block", l: "Modified Block", i: "🔀", d: "Mix of traditional and block days.", b: "Hybrid needs" },
    { id: "rotating_drop", l: "Rotating/Drop", i: "🔃", d: "Periods rotate. One drops daily.", b: "Equity" },
    { id: "elementary_self", l: "Self-Contained", i: "👩‍🏫", d: "Homeroom all day + specials.", b: "K-2" },
    { id: "elementary_dept", l: "Departmentalized", i: "🚶", d: "Upper elem rotation.", b: "Grades 3-5" },
    { id: "ms_team", l: "Team-Based", i: "👥", d: "Interdisciplinary teams.", b: "Collaboration" },
  ];
  const valid = all.filter(t => {
    if (c.schoolType === "elementary") return ["traditional","elementary_self","elementary_dept","rotating_drop"].includes(t.id);
    if (c.schoolType === "middle") return ["traditional","ab_block","ms_team","modified_block","rotating_drop"].includes(t.id);
    if (c.schoolType === "high") return ["traditional","ab_block","4x4_block","modified_block","rotating_drop"].includes(t.id);
    return true;
  });
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Choose schedule type</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {valid.map(t => (
          <Card key={t.id} selected={c.scheduleType === t.id} onClick={() => setConfig({ ...c, scheduleType: t.id })}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{t.i}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t.l}</div>
            <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.5, marginBottom: 6 }}>{t.d}</div>
            <div style={{ fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>Best for: {t.b}</div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!c.scheduleType}>Continue →</Btn>
      </div>
    </div>
  );
}

function BellScheduleStep({ config: c, setConfig, onNext, onBack }) {
  const [mode, setMode] = useState(c.scheduleMode || "period_length");
  const [start, setStart] = useState(c.schoolStart || "08:00");
  const [end, setEnd] = useState(c.schoolEnd || "15:00");
  const [count, setCount] = useState(c.periodsCount || 7);
  const [len, setLen] = useState(c.periodLength || 50);
  const [pass, setPass] = useState(c.passingTime || 5);

  const calculateBaseTimeline = () => {
    const sMin = toMins(start);
    let calculatedPeriods = [];
    let calculatedLen = len;
    let calculatedEnd = end;

    if (mode === "time_frame") {
      const eMin = toMins(end);
      const totalTime = eMin - sMin;
      const totalPassing = Math.max(0, count - 1) * pass;
      const availableForClass = Math.max(0, totalTime - totalPassing);
      calculatedLen = Math.max(10, Math.floor(availableForClass / count));
      
      let cur = sMin;
      for (let i = 0; i < count; i++) {
        calculatedPeriods.push({
          id: i + 1, label: `Period ${i + 1}`,
          startMin: cur, endMin: cur + calculatedLen,
          startTime: toTime(cur), endTime: toTime(cur + calculatedLen),
          duration: calculatedLen
        });
        cur += calculatedLen + pass;
      }
    } else {
      let cur = sMin;
      for (let i = 0; i < count; i++) {
        calculatedPeriods.push({
          id: i + 1, label: `Period ${i + 1}`,
          startMin: cur, endMin: cur + len,
          startTime: toTime(cur), endTime: toTime(cur + len),
          duration: len
        });
        cur += len + pass;
      }
      calculatedEnd = toTime(cur - pass);
    }
    return { periods: calculatedPeriods, resultLen: calculatedLen, resultEnd: calculatedEnd };
  };

  const handleNext = () => {
    const calc = calculateBaseTimeline();
    setConfig({
      ...c, scheduleMode: mode, schoolStart: start,
      schoolEnd: mode === "time_frame" ? end : calc.resultEnd, 
      periodsCount: count,
      periodLength: mode === "time_frame" ? calc.resultLen : len,
      passingTime: pass, periods: calc.periods
    });
    onNext();
  };

  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Bell Schedule Logic</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, maxWidth: 600 }}>
        <Card selected={mode === "time_frame"} onClick={() => setMode("time_frame")} style={{ flex: 1, textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Fit to Timeframe</div>
        </Card>
        <Card selected={mode === "period_length"} onClick={() => setMode("period_length")} style={{ flex: 1, textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📏</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Exact Length</div>
        </Card>
      </div>

      <div style={{ maxWidth: 500 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TimeInput label="Base Start Time" value={start} onChange={setStart} />
          {mode === "time_frame" && <TimeInput label="Base End Time" value={end} onChange={setEnd} />}
          {mode === "period_length" && <NumInput label="Period Duration (min)" value={len} onChange={setLen} min={10} max={120} />}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <NumInput label="Number of Periods" value={count} onChange={setCount} min={1} max={15} style={{ flex: 1 }} />
          <NumInput label="Passing Time (min)" value={pass} onChange={setPass} min={0} max={20} style={{ flex: 1 }} />
        </div>
      </div>
      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", maxWidth: 600 }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={handleNext}>Continue →</Btn>
      </div>
    </div>
  );
}

function LunchStep({ config: c, setConfig, onNext, onBack }) {
  const pc = c.periodsCount || 7;
  const periods = c.periods || [];
  
  const [style, setStyle] = useState(c.lunchConfig?.style || "unit");
  const [lunchPeriod, setLunchPeriod] = useState(c.lunchConfig?.lunchPeriod || 3);
  const [duration, setDuration] = useState(c.lunchConfig?.lunchDuration || 30);
  const [waves, setWaves] = useState(c.lunchConfig?.numWaves || 3);
  const [minClassTime, setMinClassTime] = useState(c.lunchConfig?.minClassTime || 45);

  const selectedPeriod = periods.find(p => p.id === lunchPeriod);
  const requiredDuration = style === "split" ? Math.max((duration * waves), (minClassTime + duration)) : duration;
  const isTooShort = selectedPeriod && selectedPeriod.duration < requiredDuration;

  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Lunch Configuration</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Card selected={style === "unit"} onClick={() => setStyle("unit")}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🍎</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Unit Lunch</div>
        </Card>
        <Card selected={style === "split"} onClick={() => setStyle("split")}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🌊</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Split Period (Waves)</div>
        </Card>
      </div>

      <div style={{ maxWidth: 550 }}>
        <Sel label={style === "unit" ? "Which period is Lunch?" : "Which period contains waves?"} value={lunchPeriod} onChange={v => setLunchPeriod(parseInt(v))} options={periods.map(p => ({ value: p.id, label: `${p.label} (${p.duration}m)` }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <NumInput label="Lunch Duration (min)" value={duration} onChange={setDuration} min={15} max={60} />
            {style === "split" && <NumInput label="Number of Waves" value={waves} onChange={setWaves} min={2} max={4} />}
        </div>
        {style === "split" && <NumInput label="Min. Class Time (min)" value={minClassTime} onChange={setMinClassTime} min={20} max={120} />}
            
        {isTooShort && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: "#FFF4E5", border: `1px solid ${COLORS.warning}`, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: COLORS.warning, marginBottom: 8 }}>⚠️ Timeline Adjustment Needed</div>
                Period {lunchPeriod} is currently <strong>{selectedPeriod.duration} min</strong>. Needs to be <strong>{requiredDuration} min</strong>.
            </div>
        )}
      </div>

      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={() => { setConfig({ ...c, lunchConfig: { style, lunchPeriod, lunchDuration: duration, numWaves: style === "split" ? waves : 1, minClassTime } }); onNext(); }} disabled={isTooShort}>Continue →</Btn>
      </div>
    </div>
  );
}

function PlanPLCStep({ config: c, setConfig, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Plan Periods & PLC</h2>
      <div style={{ maxWidth: 650 }}>
        <NumInput label="Plan periods per day per teacher" min={0} max={3} value={c.planPeriodsPerDay ?? 1} onChange={v => setConfig({ ...c, planPeriodsPerDay: v })} />
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext}>Continue →</Btn>
      </div>
    </div>
  );
}

function WINTimeStep({ config: c, setConfig, onNext, onBack }) {
  const pc = c.periodsCount || 7;
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>WIN Time (What I Need)</h2>
      <div style={{ maxWidth: 600 }}>
        <Toggle label="Include WIN time" checked={c.winEnabled || false} onChange={v => setConfig({ ...c, winEnabled: v })} />
        {c.winEnabled && <NumInput label="Which period is WIN?" min={1} max={pc} value={c.winPeriod ?? 2} onChange={v => setConfig({ ...c, winPeriod: v })} />}
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext}>Continue →</Btn>
      </div>
    </div>
  );
}

function DataInputStep({ config: c, setConfig, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>How to input data?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 600 }}>
        <Card selected={c.inputMode === "generic"} onClick={() => setConfig({ ...c, inputMode: "generic" })}>
          <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>✏️</div>
          <div style={{ fontWeight: 700, fontSize: 15, textAlign: "center" }}>Quick Setup</div>
        </Card>
        <Card selected={c.inputMode === "csv"} onClick={() => setConfig({ ...c, inputMode: "csv" })}>
          <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>📁</div>
          <div style={{ fontWeight: 700, fontSize: 15, textAlign: "center" }}>CSV Upload</div>
        </Card>
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!c.inputMode}>Continue →</Btn>
      </div>
    </div>
  );
}

function GenericInputStep({ config: c, setConfig, onNext, onBack }) {
  const [depts, setDepts] = useState(c.departments || [
    { id: "english", name: "English/ELA", teacherCount: 4, required: true, roomType: "regular" },
    { id: "math", name: "Math", teacherCount: 4, required: true, roomType: "regular" },
    { id: "science", name: "Science", teacherCount: 3, required: true, roomType: "lab" },
    { id: "social", name: "Social Studies", teacherCount: 3, required: true, roomType: "regular" },
    { id: "pe", name: "PE", teacherCount: 2, required: false, roomType: "gym" },
  ]);
  const [sc, setSc] = useState(c.studentCount ?? 800);
  const [rc, setRc] = useState(c.roomCount ?? 25);
  const [lc, setLc] = useState(c.labCount ?? 2);
  const [gc, setGc] = useState(c.gymCount ?? 1);
  const [ms, setMs] = useState(c.maxClassSize ?? 30);

  const upD = (i, f, v) => { const d = [...depts]; d[i] = { ...d[i], [f]: v }; setDepts(d); };

  const cont = () => {
    const teachers = [], courses = [], rooms = [];
    const tl = Math.max(1, (c.periodsCount || 7) - (c.planPeriodsPerDay || 1) - (c.lunchConfig?.style !== 'split' ? 1 : 0));
    
    depts.forEach(dept => {
      const tc = dept.teacherCount || 1;
      for (let i = 0; i < tc; i++) teachers.push({ id: `${dept.id}_t${i + 1}`, name: `${dept.name} Teacher ${i + 1}`, departments: [dept.id] });
      const sectionMax = dept.id.includes("pe") ? Math.max(ms, 40) : ms;
      const sectionsNeeded = dept.required ? Math.max(tc * tl, Math.ceil(sc / sectionMax)) : tc * tl;
      courses.push({ id: `${dept.id}_101`, name: dept.name, department: dept.id, sections: Math.max(1, sectionsNeeded), maxSize: sectionMax, required: dept.required, roomType: dept.roomType || "regular" });
    });
    for (let i = 0; i < rc; i++) rooms.push({ id: `room_${i + 1}`, name: `Room ${101 + i}`, type: "regular" });
    for (let i = 0; i < lc; i++) rooms.push({ id: `lab_${i + 1}`, name: `Lab ${i + 1}`, type: "lab" });
    for (let i = 0; i < gc; i++) rooms.push({ id: `gym_${i + 1}`, name: `Gym ${i + 1}`, type: "gym" });
    
    setConfig({ ...c, departments: depts, studentCount: sc, roomCount: rc, labCount: lc, gymCount: gc, maxClassSize: ms, teachers, courses, rooms });
    onNext();
  };

  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Quick Setup</h2>
      <div style={{ maxWidth: 750 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <NumInput label="Total Students" min={10} max={5000} value={sc} onChange={setSc} />
          <NumInput label="Max Class Size" min={10} max={50} value={ms} onChange={setMs} />
        </div>
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>🏫 Rooms</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <NumInput label="Regular" min={1} max={100} value={rc} onChange={setRc} />
          <NumInput label="Labs" min={0} max={20} value={lc} onChange={setLc} />
          <NumInput label="Gyms" min={0} max={5} value={gc} onChange={setGc} />
        </div>
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>👨‍🏫 Departments</h3>
        {depts.map((d, i) => (
          <div key={d.id} style={{ display: "flex", gap: 8, padding: 10, background: COLORS.offWhite, borderRadius: 8, marginBottom: 8, alignItems: "center" }}>
            <input value={d.name} onChange={e => upD(i, "name", e.target.value)} style={{ ...INPUT_STYLE, flex: 2 }} />
            <input type="number" value={d.teacherCount} onChange={e => upD(i, "teacherCount", parseInt(e.target.value) || 1)} style={SMALL_INPUT} />
            <select value={d.roomType || "regular"} onChange={e => upD(i, "roomType", e.target.value)} style={{ ...SELECT_STYLE, width: "auto" }}>
              <option value="regular">Room</option><option value="lab">Lab</option><option value="gym">Gym</option>
            </select>
          </div>
        ))}
        <Btn variant="ghost" small onClick={() => setDepts([...depts, { id: `d_${Date.now()}`, name: "New", teacherCount: 1, required: false, roomType: "regular" }])}>+ Add Dept</Btn>
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={cont}>Continue →</Btn>
      </div>
    </div>
  );
}

function CSVUploadStep({ config: c, setConfig, onNext, onBack }) {
  const [af, setAf] = useState("teachers");
  const fts = [{ id: "teachers", label: "Teachers" }, { id: "courses", label: "Courses" }, { id: "rooms", label: "Rooms" }];
  
  // NOTE: Kept minimal for orchestrator example. You can inject the full CSV parsing logic from your previous file here.
  const cont = () => { onNext(); };

  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Upload CSV Data</h2>
      <Tabs tabs={fts} active={af} onChange={setAf} />
      <p style={{ color: COLORS.textLight }}>Select files to map to the internal arrays.</p>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={cont}>Continue →</Btn>
      </div>
    </div>
  );
}

function ConstraintsStep({ config: c, setConfig, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Constraints</h2>
      <p style={{ color: COLORS.textLight, marginBottom: 20, fontSize: 14 }}>Optional hard rules.</p>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={() => { setConfig({ ...c }); onNext(); }}>⚡ Generate Schedule →</Btn>
      </div>
    </div>
  );
}

// ==========================================
// 3. ROOT APP
// ==========================================
function buildScheduleConfig(config) {
  const pc = config.periodsCount || 7;
  return {
    ...config,
    periods: config.periods || [],
    schoolStart: config.schoolStart || "08:00",
    periodLength: config.periodLength || 50,
    passingTime: config.passingTime || 5,
    lunchConfig: {
      style: config.lunchConfig?.style || "unit",
      lunchPeriod: config.lunchConfig?.lunchPeriod ?? Math.ceil(pc / 2),
      lunchDuration: config.lunchConfig?.lunchDuration || 30,
      numWaves: config.lunchConfig?.numWaves || 1,
      minClassTime: config.lunchConfig?.minClassTime || 45
    },
    winConfig: {
      enabled: config.winEnabled || false,
      winPeriod: config.winPeriod,
    },
    teachers: config.teachers || [],
    courses: config.courses || [],
    rooms: config.rooms || [],
    constraints: config.constraints || [],
    studentCount: config.studentCount || 800,
    maxClassSize: config.maxClassSize || 30,
    planPeriodsPerDay: config.planPeriodsPerDay ?? 1,
  };
}

export default function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({});
  const [schedule, setSchedule] = useState(null);

  const steps = ["School Type", "Schedule Type", "Bell Schedule", "Lunch", "Plan & PLC", "WIN Time", "Data Input", config.inputMode === "csv" ? "CSV Upload" : "Quick Setup", "Constraints"];

  const gen = () => {
    const result = generateSchedule(buildScheduleConfig(config));
    setSchedule(result);
    setStep(99);
  };

  const regen = () => {
    if (!schedule) return;
    const locked = schedule.sections.filter(s => s.locked);
    const lockConstraints = locked.map(s => ({ type: "lock_period", sectionId: s.id, period: s.period, priority: "must" }));
    const result = generateSchedule({
      ...buildScheduleConfig(config),
      constraints: [...(config.constraints || []), ...lockConstraints],
    });
    setSchedule(result);
  };

  const rootStyle = { minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'Segoe UI', system-ui, sans-serif", colorScheme: "light", color: COLORS.text };

  if (step === 99 && schedule) {
    return (
      <div style={rootStyle}>
        <div style={{ background: COLORS.white, padding: "10px 20px", borderBottom: `1px solid ${COLORS.lightGray}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo size={30} />
            <div style={{ fontSize: 13, color: COLORS.textLight }}>
              {config.schoolType} · {config.scheduleType?.replace(/_/g, " ")} · {config.periodsCount || 7} periods
            </div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>
            {schedule.stats?.scheduledCount}/{schedule.stats?.totalSections} scheduled · {schedule.stats?.conflictCount} conflicts
          </div>
        </div>
        
        {/* NEW MODULAR COMPONENT */}
        <ScheduleGridView
          schedule={schedule}
          config={config}
          setSchedule={setSchedule}
          onRegenerate={regen}
          onBackToConfig={() => setStep(9)}
        />
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <div style={{ background: COLORS.white, padding: "14px 24px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
        <Logo size={36} />
      </div>
      
      {step > 0 && (
        <div style={{ background: COLORS.white, padding: "10px 24px", borderBottom: `1px solid ${COLORS.lightGray}`, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {steps.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div onClick={() => i + 1 <= step && setStep(i + 1)} style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap",
                  cursor: i + 1 <= step ? "pointer" : "default",
                  background: i + 1 === step ? COLORS.primary : i + 1 < step ? COLORS.accentLight : COLORS.lightGray,
                  color: i + 1 === step ? COLORS.white : i + 1 < step ? COLORS.primary : COLORS.midGray,
                  fontWeight: i + 1 === step ? 700 : 500,
                }}>{label}</div>
                {i < steps.length - 1 && <div style={{ width: 12, height: 2, background: i + 1 < step ? COLORS.accent : COLORS.lightGray, margin: "0 2px" }} />}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "30px 24px" }}>
        {step === 0 && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Logo size={80} /></div>
            <h1 style={{ fontSize: 28, color: COLORS.primary, marginBottom: 8 }}>K-12 Master Scheduler</h1>
            <p style={{ fontSize: 15, color: COLORS.textLight, maxWidth: 480, margin: "0 auto 30px", lineHeight: 1.6 }}>Build your master schedule in minutes. Configure, generate, and fine-tune.</p>
            <Btn onClick={() => setStep(1)} style={{ padding: "14px 32px", fontSize: 16 }}>🚀 Start New Project</Btn>
          </div>
        )}
        {step === 1 && <SchoolTypeStep config={config} setConfig={setConfig} onNext={() => setStep(2)} />}
        {step === 2 && <ScheduleTypeStep config={config} setConfig={setConfig} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <BellScheduleStep config={config} setConfig={setConfig} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <LunchStep config={config} setConfig={setConfig} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {step === 5 && <PlanPLCStep config={config} setConfig={setConfig} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {step === 6 && <WINTimeStep config={config} setConfig={setConfig} onNext={() => setStep(7)} onBack={() => setStep(5)} />}
        {step === 7 && <DataInputStep config={config} setConfig={setConfig} onNext={() => setStep(8)} onBack={() => setStep(6)} />}
        {step === 8 && config.inputMode === "csv" && <CSVUploadStep config={config} setConfig={setConfig} onNext={() => setStep(9)} onBack={() => setStep(7)} />}
        {step === 8 && config.inputMode !== "csv" && <GenericInputStep config={config} setConfig={setConfig} onNext={() => setStep(9)} onBack={() => setStep(7)} />}
        {step === 9 && <ConstraintsStep config={config} setConfig={setConfig} onNext={gen} onBack={() => setStep(8)} />}
      </div>
    </div>
  );
}
