// src/components/grid/ScheduleGridView.jsx
import React, { useState, useEffect } from "react";
import { COLORS } from "../../utils/theme";
import MasterGrid from "./MasterGrid";
import TeacherGrid from "./TeacherGrid";
import RoomGrid from "./RoomGrid";

export default function ScheduleGridView({ schedule, config, setSchedule, onRegenerate, onBackToConfig }) {
  const [vm, setVm] = useState("grid"); // View Mode
  const [dragItem, setDI] = useState(null);
  const [fDept, setFD] = useState("all");
  const [hist, setHist] = useState([]);
  const [hIdx, setHI] = useState(-1);
  const [notif, setNotif] = useState(null);
  const [editSection, setEditSection] = useState(null);

  const secs = schedule.sections || [];
  const confs = schedule.conflicts || [];
  const depts = [...new Set(secs.map(s => s.department))];
  const logs = schedule.logs || [];

  const notify = (m, t = "info") => { setNotif({ m, t }); setTimeout(() => setNotif(null), 3000); };
  
  const pushH = ns => { 
    const h = hist.slice(0, hIdx + 1); 
    h.push(JSON.parse(JSON.stringify(ns))); 
    setHist(h); setHI(h.length - 1); 
  };

  useEffect(() => { 
    if (secs.length > 0 && hist.length === 0) pushH(secs); 
  }, [secs, hist.length]);

  const undo = () => { 
    if (hIdx > 0) { 
      setSchedule({ ...schedule, sections: hist[hIdx - 1] }); 
      setHI(hIdx - 1); 
      notify("↩ Undone"); 
    } 
  };

  // Drag and Drop Logic
  const onDS = s => { if (!s.locked) setDI(s); };
  const onDrop = tp => {
    if (!dragItem) return;
    const ns = secs.map(s => s.id === dragItem.id ? { ...s, period: tp, hasConflict: false, conflictReason: "" } : s);
    const tc = ns.find(s => s.id !== dragItem.id && s.period === tp && s.teacher === dragItem.teacher && s.teacher);
    if (tc) notify(`⚠️ Teacher ${dragItem.teacherName} double-booked P${tp}`, "warning");
    pushH(ns); 
    setSchedule({ ...schedule, sections: ns }); 
    setDI(null);
  };
  
  const togLock = id => { 
    const ns = secs.map(s => s.id === id ? { ...s, locked: !s.locked } : s); 
    setSchedule({ ...schedule, sections: ns }); 
  };

  const fSecs = secs.filter(s => fDept === "all" || s.department === fDept);

  const viewTabs = [
    { id: "grid", label: "📋 Master Grid" },
    { id: "teachers", label: "👨‍🏫 Teachers" },
    { id: "rooms", label: "🏫 Rooms" },
    { id: "conflicts", label: `⚠️ Issues (${confs.length})` },
    { id: "logs", label: "🔍 Logs" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 55px)" }}>
      {notif && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, padding: "12px 20px", borderRadius: 10, background: notif.t === "warning" ? COLORS.warning : COLORS.primary, color: COLORS.white, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {notif.m}
        </div>
      )}

      {/* Top Action Bar */}
      <div style={{ background: COLORS.white, padding: "8px 16px", borderBottom: `1px solid ${COLORS.lightGray}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onBackToConfig} style={btnStyle(COLORS.lightGray, COLORS.text)}>← Config</button>
          <button onClick={undo} disabled={hIdx <= 0} style={btnStyle(COLORS.lightGray, COLORS.text, hIdx <= 0)}>↩ Undo</button>
          <button onClick={onRegenerate} style={btnStyle("transparent", COLORS.primary, false, `1px solid ${COLORS.primary}`)}>🔀 Regenerate</button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ background: COLORS.offWhite, padding: "6px 16px", borderBottom: `1px solid ${COLORS.lightGray}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
          {viewTabs.map(v => (
            <div key={v.id} onClick={() => setVm(v.id)} style={{
              padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
              background: vm === v.id ? COLORS.primary : "transparent",
              color: vm === v.id ? COLORS.white : COLORS.text, fontWeight: vm === v.id ? 600 : 400,
            }}>{v.label}</div>
          ))}
        </div>
        <select value={fDept} onChange={e => setFD(e.target.value)} style={{ padding: "4px 8px", fontSize: 12, borderRadius: 4, border: `1px solid ${COLORS.lightGray}` }}>
          <option value="all">All Depts</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: 16, overflow: "auto", background: COLORS.offWhite }}>
        
        {vm === "grid" && (
          <MasterGrid 
            schedule={schedule} fSecs={fSecs} 
            dragItem={dragItem} onDragStart={onDS} onDrop={onDrop} 
            togLock={togLock} setEditSection={setEditSection} 
          />
        )}
        
        {vm === "teachers" && <TeacherGrid schedule={schedule} config={config} fDept={fDept} />}
        
        {vm === "rooms" && <RoomGrid schedule={schedule} />}

        {vm === "conflicts" && (
          <div>
            <h3 style={{ color: COLORS.danger }}>Identified Scheduling Conflicts</h3>
            {confs.map((con, i) => (
              <div key={i} style={{ padding: 12, marginBottom: 8, background: COLORS.white, borderLeft: `4px solid ${COLORS.danger}`, borderRadius: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <span style={{ fontWeight: 600 }}>{con.type.toUpperCase()}: </span>{con.message}
              </div>
            ))}
            {confs.length === 0 && <p>No conflicts detected! ✅</p>}
          </div>
        )}

        {/* The New Structured Logger View */}
        {vm === "logs" && (
          <div style={{ background: COLORS.consoleBg, color: COLORS.consoleText, padding: 20, borderRadius: 8, minHeight: 400, overflowY: "auto", fontFamily: "monospace", fontSize: 12 }}>
            <h3 style={{ color: COLORS.white, marginTop: 0, marginBottom: 12 }}>Algorithm Evaluation Logs ({logs.length})</h3>
            <p style={{ color: COLORS.midGray, marginBottom: 16 }}>Shows detailed constraint evaluations and cost scores from the greedy loop.</p>
            {logs.map((l, i) => (
              <div key={i} style={{ marginBottom: 6, borderLeft: `3px solid ${l.level === "ERROR" ? COLORS.danger : l.level === "WARN" ? COLORS.warning : COLORS.success}`, paddingLeft: 10, opacity: l.level === "INFO" ? 0.8 : 1 }}>
                <strong style={{ color: l.level === "ERROR" ? "#FF6B6B" : l.level === "WARN" ? "#FFD93D" : "#6BCB77" }}>{l.level}:</strong>
                <span style={{ marginLeft: 8 }}>{l.msg}</span>
                {l.data && (
                  <pre style={{ margin: "4px 0 0 40px", background: "#00000040", padding: 8, borderRadius: 4, fontSize: 10, whiteSpace: "pre-wrap", color: "#A8B2D1" }}>
                    {JSON.stringify(l.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// Quick inline helper for buttons to reduce boilerplate
const btnStyle = (bg, color, disabled = false, border = "none") => ({
  background: bg, color: color, padding: "6px 14px", borderRadius: 6, border: border,
  fontWeight: 600, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1
});
