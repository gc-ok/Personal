// src/components/grid/MasterGrid.jsx
import React, { useState } from "react";
import { COLORS, PERIOD_COLORS } from "../../utils/theme";
import { PeriodHeader } from "./TeacherGrid";

// Helper function to generate dynamic color based on department string
const getDeptColor = (deptName) => {
  if (!deptName) return "#94a3b8"; // fallback gray
  const hash = String(deptName).split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

// Reusable Section Card for the Drag-and-Drop grid
export const SecCard = ({ section: s, dragItem, onDragStart, togLock, setEditSection }) => {
  const deptColor = getDeptColor(s.department);
  
  // Keep conflict colors if there is an issue, otherwise use the department color
  const bg = s.hasConflict ? "#FFF0F0" : `${deptColor}15`; 
  const borderLeftColor = s.hasConflict ? COLORS.danger : deptColor;
  const borderOtherColor = s.hasConflict ? COLORS.danger : s.locked ? COLORS.accent : "transparent";

  const waveBadge = s.lunchWave ? (
    <span style={{ fontSize: 8, background: COLORS.warning, color: COLORS.text, padding: "1px 3px", borderRadius: 3, marginLeft: 4 }}>
      W{s.lunchWave}
    </span>
  ) : null;

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); setEditSection(s); }}
      draggable={!s.locked} 
      onDragStart={() => onDragStart(s)} 
      style={{
        padding: "4px 6px", 
        marginBottom: 2, 
        borderRadius: "0 4px 4px 0", // Flat left edge for the thick border
        border: `1px solid ${borderOtherColor}`,
        borderLeft: `4px solid ${borderLeftColor}`,
        background: bg, 
        cursor: "pointer", 
        fontSize: 10,
        opacity: dragItem?.id === s.id ? 0.3 : 1, 
        color: COLORS.text,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{s.courseName}</span>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {waveBadge}
          {s.hasConflict && <span title={s.conflictReason} style={{ cursor: "help" }}>⚠️</span>}
          <span onClick={e => { e.stopPropagation(); togLock(s.id); }} style={{ cursor: "pointer", fontSize: 10 }}>{s.locked ? "🔒" : "🔓"}</span>
        </div>
      </div>
      <div style={{ color: COLORS.textLight, fontSize: 9, marginTop: 1 }}>
        {s.teacherName || "TBD"} {s.coTeacherName ? `& ${s.coTeacherName}` : ""} · {s.roomName || "—"}
      </div>
      <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 600, marginTop: 1 }}>
        👥 {s.enrollment}/{s.maxSize}
      </div>
    </div>
  );
};

export default function MasterGrid({ 
  schedule, fSecs, dragItem, onDragStart, onDrop, togLock, setEditSection 
}) {
  const { periodList: allP = [], periodStudentData: psd = {}, stats } = schedule;
  const studentCount = stats?.totalStudents || 0;

  const StudentBar = ({ pid }) => {
    const data = psd[pid];
    if (!data) return null;
    const pctClass = studentCount > 0 ? Math.round(data.seatsInClass / studentCount * 100) : 0;
    const isWave = data.atLunch === "Waves";
    const pctLunch = isWave ? 0 : (studentCount > 0 ? Math.round(data.atLunch / studentCount * 100) : 0);
    const pctMissing = studentCount > 0 ? Math.round(data.unaccounted / studentCount * 100) : 0;
    
    return (
      <div style={{ padding: "3px 4px", borderBottom: `1px solid ${COLORS.lightGray}`, borderRight: `1px solid ${COLORS.lightGray}`, background: data.unaccounted > 50 ? "#FFF8F8" : "#F8FFF8" }}>
        <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: COLORS.lightGray }}>
          <div style={{ width: `${pctClass}%`, background: COLORS.success }} title={`In class: ${data.seatsInClass}`} />
          <div style={{ width: `${pctLunch}%`, background: COLORS.warning }} title={`At lunch: ${data.atLunch}`} />
          {pctMissing > 0 && <div style={{ width: `${pctMissing}%`, background: COLORS.danger }} title={`Unaccounted: ${data.unaccounted}`} />}
        </div>
        <div style={{ fontSize: 8, color: COLORS.textLight, marginTop: 2, display: "flex", justifyContent: "space-between" }}>
          <span>📚{data.seatsInClass}</span>
          {data.atLunch > 0 && <span>🥗{data.atLunch}</span>}
          {data.unaccounted > 0 && <span style={{ color: COLORS.danger, fontWeight: 700 }}>❓{data.unaccounted}</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `130px repeat(${allP.length}, minmax(120px, 1fr))`, gap: 0, minWidth: 130 + allP.length * 120 }}>
        
        <div style={{ padding: 8, background: COLORS.primaryDark, color: COLORS.white, fontWeight: 700, fontSize: 12, borderRadius: "8px 0 0 0", display: "flex", alignItems: "center" }}>Course / Period</div>
        {allP.map((p, i) => <PeriodHeader key={p.id} p={p} isLast={i === allP.length - 1} />)}

        <div style={{ padding: "4px 8px", background: COLORS.offWhite, borderBottom: `2px solid ${COLORS.primary}`, borderRight: `1px solid ${COLORS.lightGray}`, fontSize: 10, fontWeight: 700, color: COLORS.primary, display: "flex", alignItems: "center" }}>
          👥 {studentCount} Students
        </div>
        
        {allP.map(p => {
          const isTeaching = p.type === "class" || p.type === "split_lunch" || p.type === "multi_lunch";
          if (!isTeaching) {
            const isLunch = p.type === "unit_lunch";
            return (
              <div 
                key={`sa-${p.id}`} 
                onClick={() => {
                  setEditSection({
                    id: `manual-${Date.now()}`,
                    courseName: "New School-Wide Activity",
                    period: p.id,
                    department: "General",
                    enrollment: studentCount,
                    maxSize: studentCount,
                    locked: true
                  });
                }}
                style={{ 
                  padding: "3px 4px", 
                  borderBottom: `2px solid ${COLORS.primary}`, 
                  borderRight: `1px solid ${COLORS.lightGray}`, 
                  background: isLunch ? `${COLORS.warning}15` : COLORS.offWhite, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  cursor: "pointer" 
                }}
              >
                <span style={{ fontSize: 9, color: isLunch ? COLORS.warning : COLORS.midGray, fontWeight: 600 }}>
                  {isLunch ? `🥗 All ${studentCount}` : `${p.type.toUpperCase()} +`}
                </span>
              </div>
            );
          }
          return <StudentBar key={`sa-${p.id}`} pid={p.id} />;
        })}

        {[...new Set(fSecs.map(s => s.courseId))].map((cid, ri) => {
          const cs = fSecs.filter(s => s.courseId === cid);
          const isCore = cs[0]?.isCore;
          
          return (
            <React.Fragment key={cid}>
              <div style={{
                padding: "6px 8px", background: PERIOD_COLORS[ri % PERIOD_COLORS.length],
                borderBottom: `1px solid ${COLORS.lightGray}`, fontWeight: 600, fontSize: 11,
                display: "flex", flexDirection: "column", justifyContent: "center", color: COLORS.text,
              }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cs[0]?.courseName || cid}</div>
                <div style={{ fontSize: 9, color: COLORS.textLight, marginTop: 2 }}>
                  {isCore ? "CORE" : "ELECT"} · {cs.length} sec · {cs.reduce((s, x) => s + x.enrollment, 0)} enrolled
                </div>
              </div>
              
              {allP.map(p => {
                const ps = cs.filter(s => s.period === p.id);
                const isNT = p.type === "unit_lunch" || p.type === "win";
                
                return (
                  <div key={`${cid}-${p.id}`}
                    onDragOver={e => !isNT && e.preventDefault()}
                    onDrop={() => !isNT && onDrop(p.id)}
                    style={{
                      padding: 3, minHeight: 44,
                      borderBottom: `1px solid ${COLORS.lightGray}`, borderRight: `1px solid ${COLORS.lightGray}`,
                      background: isNT ? "#F0F0F0" : dragItem ? `${COLORS.accentLight}30` : COLORS.white,
                      backgroundImage: isNT ? "repeating-linear-gradient(45deg, #e5e5e5 0, #e5e5e5 1px, transparent 0, transparent 50%)" : "none",
                      backgroundSize: "8px 8px",
                    }}>
                    {ps.map(s => (
                      <SecCard 
                        key={s.id} section={s} dragItem={dragItem} 
                        onDragStart={onDragStart} togLock={togLock} 
                        setEditSection={setEditSection} 
                      />
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
