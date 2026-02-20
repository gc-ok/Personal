// src/views/WizardSteps.jsx
import React, { useState } from "react";
import { COLORS } from "../utils/theme";
import { Btn, Card, NumInput, TimeInput, Sel, Toggle, Tabs, SMALL_INPUT } from "../components/ui/CoreUI";

// Time Utilities
const toMins = t => { if (!t) return 480; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = mins => {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export function SchoolTypeStep({ config: c, setConfig, onNext }) {
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

export function ScheduleTypeStep({ config: c, setConfig, onNext, onBack }) {
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

export function BellScheduleStep({ config: c, setConfig, onNext, onBack }) {
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

export function LunchStep({ config: c, setConfig, onNext, onBack }) {
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

export function PlanPLCStep({ config: c, setConfig, onNext, onBack }) {
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

export function WINTimeStep({ config: c, setConfig, onNext, onBack }) {
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

export function DataInputStep({ config: c, setConfig, onNext, onBack }) {
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

export function GenericInputStep({ config: c, setConfig, onNext, onBack }) {
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
            <input value={d.name} onChange={e => upD(i, "name", e.target.value)} style={{ flex: 2, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`, fontSize: 14 }} />
            <input type="number" value={d.teacherCount} onChange={e => upD(i, "teacherCount", parseInt(e.target.value) || 1)} style={SMALL_INPUT} />
            <select value={d.roomType || "regular"} onChange={e => upD(i, "roomType", e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`, fontSize: 14 }}>
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

export function CSVUploadStep({ config: c, setConfig, onNext, onBack }) {
  const [af, setAf] = useState("teachers");
  const fts = [{ id: "teachers", label: "Teachers" }, { id: "courses", label: "Courses" }, { id: "rooms", label: "Rooms" }];
  
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Upload CSV Data</h2>
      <Tabs tabs={fts} active={af} onChange={setAf} />
      <p style={{ color: COLORS.textLight }}>Select files to map to the internal arrays.</p>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={() => onNext()}>Continue →</Btn>
      </div>
    </div>
  );
}

export function ConstraintsStep({ config: c, setConfig, onNext, onBack }) {
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
