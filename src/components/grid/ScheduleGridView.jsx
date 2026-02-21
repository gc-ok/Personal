// src/components/grid/ScheduleGridView.jsx
import React, { useState, useEffect } from "react";
import { COLORS } from "../../utils/theme";
import MasterGrid from "./MasterGrid";
import TeacherGrid from "./TeacherGrid";
import RoomGrid from "./RoomGrid";
import { generateSchedule } from "../../core/engine"; // Imported for refactoring

// --- STYLES & HELPERS ---
const inputStyle = { width: "100%", padding: "10px", marginTop: 4, borderRadius: 6, border: `1px solid ${COLORS.lightGray}`, fontSize: 14, outline: "none" };

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };

const modalContentStyle = { background: COLORS.white, padding: 24, borderRadius: 12, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" };

const btnStyle = (bg, color, disabled = false, border = "none") => ({
  background: bg, color: color, padding: "6px 14px", borderRadius: 6, border: border,
  fontWeight: 600, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1
});

// Helper to prep config for the engine (mirrors logic in App.jsx)
function buildScheduleConfig(config) {
  const pc = config.periodsCount || 7;
  return {
    ...config,
    periods: config.periods || [],
    schoolStart: config.schoolStart || "08:00",
    periodLength: config.periodLength || 50,
    passingTime: config.passingTime || 5,
    lunchConfig: {
      style: config.lunchConfig?.style || config.lunchStyle || "unit", // "unit", "split", "multi_period"
      lunchPeriod: config.lunchConfig?.lunchPeriod ?? config.lunchPeriod, // for unit/split
      lunchPeriods: config.lunchConfig?.lunchPeriods || config.lunchPeriods || [], // for multi_period arrays like [4, 5]
      lunchDuration: config.lunchConfig?.lunchDuration || 30,
      numWaves: config.lunchConfig?.numWaves || 1,
      minClassTime: config.lunchConfig?.minClassTime || 45
    },
    winConfig: {
      enabled: config.winEnabled || false,
      winPeriod: config.winPeriod,
      model: config.winModel || "uses_period",
      afterPeriod: config.winAfterPeriod || 1,
      winDuration: config.winDuration || 30,
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

// --- MODAL COMPONENTS ---

const EditTeacherModal = ({ teacher, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...teacher });
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, width: 400 }}>
        <h3 style={{ margin: "0 0 20px 0", color: COLORS.primary }}>Edit Teacher</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase" }}>Teacher Name
            <input name="name" value={formData.name} onChange={handleChange} style={inputStyle} />
          </label>
          <div style={{ padding: "12px", background: COLORS.offWhite, borderRadius: 8, border: `1px solid ${COLORS.lightGray}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" name="isFloater" checked={formData.isFloater || false} onChange={handleChange} />
              <strong>Is Floater (No Home Room)</strong>
            </label>
            <p style={{ fontSize: 11, color: COLORS.textLight, margin: "6px 0 0 0", lineHeight: 1.4 }}>
              Floaters do not get a dedicated home room. The engine will dynamically map their classes to rooms that are empty because the owning teacher is on Plan/PLC.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnStyle(COLORS.lightGray, COLORS.text)}>Cancel</button>
          <button onClick={() => onSave(formData)} style={btnStyle(COLORS.primary, COLORS.white)}>Save & Refactor Schedule</button>
        </div>
      </div>
    </div>
  );
};

const EditSectionModal = ({ section, schedule, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({ ...section });
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, width: 420 }}>
        <h3 style={{ margin: "0 0 20px 0", color: COLORS.primary }}>{section.id.includes('manual') ? "Add New Class" : "Edit Class"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase" }}>Course Name
            <input name="courseName" value={formData.courseName} onChange={handleChange} style={inputStyle} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase" }}>Period
              <select name="period" value={formData.period} onChange={handleChange} style={inputStyle}>
                {schedule.periodList.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase" }}>Size
              <input type="number" name="enrollment" value={formData.enrollment} onChange={handleChange} style={inputStyle} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase" }}>Main Teacher
              <select name="teacher" value={formData.teacher} onChange={handleChange} style={inputStyle}>
                {schedule.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase" }}>Co-Teacher (Inclusion)
              <select name="coTeacher" value={formData.coTeacher || ""} onChange={handleChange} style={inputStyle}>
                <option value="">-- None --</option>
                {schedule.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" name="locked" checked={formData.locked} onChange={handleChange} />
            <strong>Lock Class</strong>
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {!section.id.includes('manual') && (
            <button onClick={() => onDelete(section.id)} style={{ background: "transparent", color: COLORS.danger, border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>🗑️ Delete</button>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button onClick={onClose} style={btnStyle(COLORS.lightGray, COLORS.text)}>Cancel</button>
            <button onClick={() => onSave(formData)} style={btnStyle(COLORS.primary, COLORS.white)}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherAvailabilityModal = ({ teacher, periods, teacherAvail, onClose, onSave }) => {
  const currentBlock = teacherAvail.find(a => a.teacherId === teacher.id)?.blockedPeriods || [];
  const [blocked, setBlocked] = useState(currentBlock);

  const togglePeriod = (pid) => {
    setBlocked(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, width: 450 }}>
        <h3>Availability: {teacher.name}</h3>
        <p style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 20 }}>Toggle periods where this teacher is unavailable (Plan, Duty, etc).</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 25 }}>
          {periods.map(p => (
            <button key={p.id} onClick={() => togglePeriod(p.id)} style={{
              padding: '12px 8px', borderRadius: 8, border: `2px solid ${blocked.includes(p.id) ? COLORS.danger : COLORS.success}`,
              background: blocked.includes(p.id) ? `${COLORS.danger}10` : 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600
            }}>
              {p.label}<br/><span style={{ fontSize: 9, opacity: 0.7 }}>{blocked.includes(p.id) ? '🚫 BLOCKED' : '✅ OPEN'}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={btnStyle(COLORS.lightGray, COLORS.text)}>Cancel</button>
          <button onClick={() => onSave(blocked)} style={btnStyle(COLORS.primary, COLORS.white)}>Save Availability</button>
        </div>
      </div>
    </div>
  );
};

const PLCOrganizerModal = ({ teachers, periods, plcGroups, onClose, onSave }) => {
  const [groups, setGroups] = useState(plcGroups || []);
  const addGroup = () => setGroups([...groups, { id: `plc-${Date.now()}`, name: "New PLC Group", period: periods[0].id, teacherIds: [] }]);
  const updateGroup = (id, field, value) => setGroups(groups.map(g => g.id === id ? { ...g, [field]: value } : g));
  const removeGroup = (id) => setGroups(groups.filter(g => g.id !== id));

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, width: 800, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Organize PLC Groups</h2>
          <button onClick={addGroup} style={btnStyle(COLORS.success, COLORS.white)}>+ New Group</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {groups.map(group => (
            <div key={group.id} style={{ border: `1px solid ${COLORS.lightGray}`, padding: 15, borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 15, marginBottom: 12 }}>
                <input placeholder="Group Name" value={group.name} onChange={e => updateGroup(group.id, 'name', e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 2 }} />
                <select value={group.period} onChange={e => updateGroup(group.id, 'period', parseInt(e.target.value))} style={{ ...inputStyle, marginTop: 0, flex: 1 }}>
                  {periods.map(p => <option key={p.id} value={p.id}>Period {p.label}</option>)}
                </select>
                <button onClick={() => removeGroup(group.id)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}>🗑️</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {teachers.map(t => (
                  <div key={t.id} onClick={() => {
                    const newIds = group.teacherIds.includes(t.id) ? group.teacherIds.filter(id => id !== t.id) : [...group.teacherIds, t.id];
                    updateGroup(group.id, 'teacherIds', newIds);
                  }} style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${group.teacherIds.includes(t.id) ? COLORS.primary : COLORS.lightGray}`,
                    background: group.teacherIds.includes(t.id) ? COLORS.primary : 'white', color: group.teacherIds.includes(t.id) ? 'white' : COLORS.text
                  }}>
                    {t.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 25 }}>
          <button onClick={onClose} style={btnStyle(COLORS.lightGray, COLORS.text)}>Cancel</button>
          <button onClick={() => onSave(groups)} style={btnStyle(COLORS.primary, COLORS.white)}>Apply & Refactor Schedule</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function ScheduleGridView({ schedule, config, setSchedule, onRegenerate, onBackToConfig }) {
  const [vm, setVm] = useState("grid");
  const [dragItem, setDI] = useState(null);
  const [fDept, setFD] = useState("all");
  const [hist, setHist] = useState([]);
  const [hIdx, setHI] = useState(-1);
  const [notif, setNotif] = useState(null);
  const [editSection, setEditSection] = useState(null);

  // NEW STATES
  // Initialize with the engine's generated groups if they exist
  const [plcGroups, setPlcGroups] = useState(schedule.plcGroups || []);
  const [teacherAvail, setTeacherAvail] = useState([]); 
  const [showPLCModal, setShowPLCModal] = useState(false);
  const [availTeacher, setAvailTeacher] = useState(null);
  const [editTeacher, setEditTeacher] = useState(null); // <--- ADD THIS STATE

  // Add this useEffect to sync the state if the schedule is regenerated externally
  useEffect(() => {
    if (schedule.plcGroups) {
      setPlcGroups(schedule.plcGroups);
    }
  }, [schedule.plcGroups]);

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

  // REGENERATE LOGIC - Now accepts the arrays directly to avoid stale state!
  const triggerRegenWithConstraints = (updatedPLCs = plcGroups, updatedAvail = teacherAvail, updatedTeachers = schedule.teachers) => {
    const newConfig = {
      ...config,
      plcEnabled: updatedPLCs.length > 0,
      plcGroups: updatedPLCs,
      teacherAvailability: updatedAvail,
      teachers: updatedTeachers, // <--- PASS THE NEW TEACHERS HERE
      maxClassSize: config.maxClassSize + 1 
    };
    
    const result = generateSchedule(buildScheduleConfig(newConfig));
    setSchedule(result);
    pushH(result.sections);
    notify("Schedule refactored with new constraints", "success");
  };

  const addBlankClass = () => {
    const newSection = {
      id: `manual-${Date.now()}`, courseName: "New Manual Class", enrollment: 25, maxSize: 30, department: "General",
      teacher: schedule.teachers[0]?.id, teacherName: schedule.teachers[0]?.name,
      period: schedule.periodList[0]?.id, room: schedule.rooms[0]?.id, roomName: schedule.rooms[0]?.name, locked: true,
    };
    setEditSection(newSection);
  };

  const onDS = s => { if (!s.locked) setDI(s); };
  const onDrop = tp => {
    if (!dragItem) return;
    const ns = secs.map(s => s.id === dragItem.id ? { ...s, period: tp, hasConflict: false, conflictReason: "" } : s);
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
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, padding: "12px 20px", borderRadius: 10, background: notif.t === "warning" ? COLORS.warning : COLORS.primary, color: COLORS.white, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {notif.m}
        </div>
      )}

      {/* MODAL RENDERERS */}
      {editSection && (
        <EditSectionModal
          section={editSection} schedule={schedule} onClose={() => setEditSection(null)}
          onDelete={(id) => {
            const ns = secs.filter(s => s.id !== id);
            pushH(ns); setSchedule({ ...schedule, sections: ns }); setEditSection(null); notify("🗑️ Class removed");
          }}
          onSave={(updated) => {
            const exists = secs.find(s => s.id === updated.id);
            const teacherObj = schedule.teachers.find(t => t.id === updated.teacher);
            updated.teacherName = teacherObj?.name || "Unassigned";
            
            // --- NEW: Map the Co-Teacher Name ---
            updated.coTeacherName = updated.coTeacher ? schedule.teachers.find(t => t.id === updated.coTeacher)?.name : null;
            
            updated.period = parseInt(updated.period); updated.enrollment = parseInt(updated.enrollment);
            const ns = exists ? secs.map(s => s.id === updated.id ? updated : s) : [...secs, updated];
            pushH(ns); setSchedule({ ...schedule, sections: ns }); setEditSection(null); notify("✅ Schedule updated");
          }}
        />
      )}

      {editTeacher && (
        <EditTeacherModal
          teacher={editTeacher}
          onClose={() => setEditTeacher(null)}
          onSave={(updatedTeacher) => {
            const newTeachers = schedule.teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
            setEditTeacher(null);
            triggerRegenWithConstraints(plcGroups, teacherAvail, newTeachers);
          }}
        />
      )}

      {showPLCModal && (
        <PLCOrganizerModal
          teachers={schedule.teachers} periods={schedule.periodList} plcGroups={plcGroups}
          onClose={() => setShowPLCModal(false)}
          onSave={(newGroups) => {
            setPlcGroups(newGroups); 
            setShowPLCModal(false);
            // Pass the new groups directly into the engine!
            triggerRegenWithConstraints(newGroups, teacherAvail);
          }}
        />
      )}

      {availTeacher && (
        <TeacherAvailabilityModal
          teacher={availTeacher} periods={schedule.periodList} teacherAvail={teacherAvail}
          onClose={() => setAvailTeacher(null)}
          onSave={(blocked) => {
            const newAvail = [...teacherAvail.filter(a => a.teacherId !== availTeacher.id), { teacherId: availTeacher.id, blockedPeriods: blocked }];
            setTeacherAvail(newAvail); 
            setAvailTeacher(null);
            // Pass the new availability directly into the engine!
            triggerRegenWithConstraints(plcGroups, newAvail);
          }}
        />
      )}

      {/* ACTION BAR */}
      <div style={{ background: COLORS.white, padding: "8px 16px", borderBottom: `1px solid ${COLORS.lightGray}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onBackToConfig} style={btnStyle(COLORS.lightGray, COLORS.text)}>← Config</button>
          <button onClick={undo} disabled={hIdx <= 0} style={btnStyle(COLORS.lightGray, COLORS.text, hIdx <= 0)}>↩ Undo</button>
          <button onClick={onRegenerate} style={btnStyle("transparent", COLORS.primary, false, `1px solid ${COLORS.primary}`)}>🔀 Quick Regen</button>
          <button onClick={addBlankClass} style={btnStyle(COLORS.success, COLORS.white)}>➕ Add Class</button>
          
          {/* PLC ORGANIZER BUTTON */}
          <button onClick={() => setShowPLCModal(true)} style={btnStyle(COLORS.accent, COLORS.white)}>🤝 Organize PLCs</button>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textLight }}>
          {plcGroups.length} PLC Groups · {teacherAvail.length} Custom Availabilities
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

      <div style={{ flex: 1, padding: 16, overflow: "auto", background: COLORS.offWhite }}>
        {vm === "grid" && (
          <MasterGrid 
            schedule={schedule} fSecs={fSecs} dragItem={dragItem} 
            onDragStart={onDS} onDrop={onDrop} togLock={togLock} setEditSection={setEditSection} 
          />
        )}
        {vm === "teachers" && (
          <TeacherGrid 
            schedule={schedule} config={config} fDept={fDept} setEditSection={setEditSection} 
            onTeacherClick={(t) => setAvailTeacher(t)} // To trigger Avail modal
            onEditTeacher={(t) => setEditTeacher(t)}
          />
        )}
        {vm === "rooms" && <RoomGrid schedule={schedule} />}
        {vm === "conflicts" && (
          <div>
            <h3 style={{ color: COLORS.danger }}>Identified Scheduling Conflicts</h3>
            {confs.map((con, i) => (
              <div key={i} style={{ padding: 12, marginBottom: 8, background: COLORS.white, borderLeft: `4px solid ${COLORS.danger}`, borderRadius: 4 }}>
                <span style={{ fontWeight: 600 }}>{con.type.toUpperCase()}: </span>{con.message}
              </div>
            ))}
            {confs.length === 0 && <p>No conflicts detected! ✅</p>}
          </div>
        )}
        {vm === "logs" && (
          <div style={{ background: "#1e1e1e", color: "#d4d4d4", padding: 20, borderRadius: 8, fontFamily: "monospace", fontSize: 12 }}>
            <h3 style={{ color: "white", marginTop: 0 }}>Evaluation Logs</h3>
            {logs.map((l, i) => (
              <div key={i} style={{ marginBottom: 4, borderLeft: `3px solid ${l.level === "ERROR" ? COLORS.danger : COLORS.success}`, paddingLeft: 8 }}>
                <strong>{l.level}:</strong> {l.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
