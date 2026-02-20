// src/components/grid/TeacherGrid.jsx
import React from "react";
import { COLORS } from "../../utils/theme";

// Generic Period Header Component (can be moved to a Shared file later)
export const PeriodHeader = ({ p, isLast }) => {
  const bgMap = { class: COLORS.primary, split_lunch: COLORS.secondary, unit_lunch: COLORS.warning, win: COLORS.darkGray };
  return (
    <div style={{
      padding: "6px 4px", textAlign: "center", fontWeight: 700, fontSize: 11, color: COLORS.white,
      borderRadius: isLast ? "0 8px 0 0" : 0, background: bgMap[p.type] || COLORS.primary,
      display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 54,
    }}>
      <div>{p.label}</div>
      <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.9, marginTop: 2 }}>{p.startTime} – {p.endTime}</div>
      {p.type !== "class" && <div style={{ fontSize: 8, opacity: 0.8, textTransform: "uppercase", marginTop: 1 }}>{p.type.replace("_", " ")}</div>}
    </div>
  );
};

export default function TeacherGrid({ schedule, config, fDept }) {
  const { periodList: allP = [], teachers = [], sections: secs = [], teacherSchedule = {} } = schedule;
  const numWaves = config?.lunchConfig?.numWaves || 3;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${allP.length}, minmax(140px, 1fr))`, gap: 0, minWidth: 160 + allP.length * 140 }}>
        <div style={{ padding: 8, background: COLORS.primary, color: COLORS.white, fontWeight: 700, borderRadius: "8px 0 0 0", fontSize: 12 }}>Teacher</div>
        
        {allP.map((p, i) => <PeriodHeader key={p.id} p={p} isLast={i === allP.length - 1} />)}
        
        {teachers.filter(t => fDept === "all" || (t.departments || []).includes(fDept)).map(t => (
          <React.Fragment key={t.id}>
            <div style={{ padding: "6px 8px", background: COLORS.offWhite, borderBottom: `1px solid ${COLORS.lightGray}`, fontSize: 12, fontWeight: 600, color: COLORS.text, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div>{t.name}</div>
              <div style={{ fontSize: 9, color: COLORS.textLight }}>{(t.departments || []).join(", ")}</div>
            </div>
            
            {allP.map(p => {
              const s = secs.find(x => x.teacher === t.id && x.period === p.id);
              const status = teacherSchedule?.[t.id]?.[p.id];
              const isLunch = status === "LUNCH";
              const isNT = p.type === "unit_lunch" || p.type === "win";

              return (
                <div key={`${t.id}-${p.id}`} style={{ padding: 4, borderBottom: `1px solid ${COLORS.lightGray}`, borderRight: `1px solid ${COLORS.lightGray}`, minHeight: 50, background: isNT ? "#F1F5F9" : isLunch ? `${COLORS.warning}12` : COLORS.white, display: "flex", alignItems: "stretch" }}>
                  
                  {/* BUG FIX: Visualizing the Staggered Lunch Waves */}
                  {s && p.type === "split_lunch" && s.lunchWave ? (
                    <div style={{ display: "flex", width: "100%", gap: 4 }}>
                      {Array.from({ length: numWaves }).map((_, wIdx) => {
                        const waveNum = wIdx + 1;
                        const isEatingNow = s.lunchWave === waveNum;
                        
                        return (
                          <div key={wIdx} style={{
                            flex: 1, borderRadius: 4, padding: "2px",
                            background: isEatingNow ? `${COLORS.warning}20` : COLORS.accentLight,
                            border: `1px solid ${isEatingNow ? COLORS.warning : COLORS.accent}`,
                            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center"
                          }}>
                            {isEatingNow ? (
                              <span style={{ fontSize: 9, color: COLORS.warning, fontWeight: 700 }}>🥗 W{waveNum}</span>
                            ) : (
                              <>
                                <span style={{ fontSize: 9, fontWeight: 600, color: COLORS.primaryDark, width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{s.courseName}</span>
                                <span style={{ fontSize: 7, color: COLORS.primaryDark }}>{s.roomName}</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : s ? (
                    <div style={{ width: "100%", background: COLORS.accentLight, color: COLORS.primaryDark, padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <span>{s.courseName}</span>
                      <span style={{ fontSize: 9, fontWeight: 400 }}>{s.roomName} · 👥{s.enrollment}</span>
                    </div>
                  ) : isLunch ? (
                    <div style={{ width: "100%", color: COLORS.warning, fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>🥗 LUNCH</div>
                  ) : isNT ? (
                    <div style={{ width: "100%", color: COLORS.midGray, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.type.toUpperCase()}</div>
                  ) : (
                    <div style={{ width: "100%", color: COLORS.midGray, fontSize: 10, fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center" }}>📝 Plan</div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
