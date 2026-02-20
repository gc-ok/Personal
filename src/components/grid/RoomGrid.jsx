// src/components/grid/RoomGrid.jsx
import React from "react";
import { COLORS } from "../../utils/theme";
import { PeriodHeader } from "./TeacherGrid"; // Reusing the header component

export default function RoomGrid({ schedule }) {
  const { periodList = [], rooms = [], sections = [] } = schedule;
  
  // BUG FIX: Only exclude unit_lunch. "win" is now included in teachP!
  const teachP = periodList.filter(p => p.type !== "unit_lunch");

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${teachP.length}, minmax(100px, 1fr))`, gap: 0, minWidth: 120 + teachP.length * 100 }}>
        
        <div style={{ padding: 8, background: COLORS.primary, color: COLORS.white, fontWeight: 700, borderRadius: "8px 0 0 0", fontSize: 12 }}>Room</div>
        
        {teachP.map((p, i) => <PeriodHeader key={p.id} p={p} isLast={i === teachP.length - 1} />)}
        
        {rooms.map(r => (
          <React.Fragment key={r.id}>
            <div style={{ padding: "6px 8px", background: COLORS.offWhite, borderBottom: `1px solid ${COLORS.lightGray}`, fontSize: 11, fontWeight: 600, color: COLORS.text, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div>{r.name}</div>
              <div style={{ color: COLORS.midGray, fontSize: 9 }}>{r.type.toUpperCase()}</div>
            </div>
            
            {teachP.map(p => {
              const s = sections.find(x => x.room === r.id && x.period === p.id);
              
              return (
                <div key={`${r.id}-${p.id}`} style={{ padding: 4, borderBottom: `1px solid ${COLORS.lightGray}`, borderRight: `1px solid ${COLORS.lightGray}`, minHeight: 40, background: s ? COLORS.white : "#FAFAFA", display: "flex" }}>
                  {s ? (
                    <div style={{ width: "100%", background: COLORS.purpleLight, color: COLORS.purple, padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <span>{s.courseName}</span>
                      <span style={{ fontSize: 8, fontWeight: 400 }}>{s.teacherName} · 👥{s.enrollment}</span>
                    </div>
                  ) : p.type === "win" ? (
                    <div style={{ width: "100%", color: COLORS.midGray, fontSize: 10, fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      Available
                    </div>
                  ) : null}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
