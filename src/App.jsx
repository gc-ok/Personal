// src/App.jsx
import React, { useState } from "react";
import { COLORS } from "./utils/theme";
import { generateSchedule } from "./core/engine";
import ScheduleGridView from "./components/grid/ScheduleGridView";
import WizardController from "./views/wizard/WizardController";
import { Logo } from "./components/ui/CoreUI"; // Note: Adjusted to match your CoreUI path

export function buildScheduleConfig(config) {
  const pc = config.periodsCount || 7;
  const periodsConfig = (Array.isArray(config.periods) && config.periods.length > 0) ? config.periods : []; 

  return {
    ...config,
    periods: periodsConfig,
    schoolStart: config.schoolStart || "08:00",
    periodLength: config.periodLength || 50,
    passingTime: config.passingTime || 5,
    lunchConfig: {
      style: config.lunchConfig?.style || config.lunchStyle || "unit",
      lunchPeriod: config.lunchConfig?.lunchPeriod ?? config.lunchPeriod ?? Math.ceil(pc / 2),
      lunchPeriods: config.lunchConfig?.lunchPeriods || config.lunchPeriods || [],
      lunchDuration: config.lunchConfig?.lunchDuration || config.lunchDuration || 30,
      numWaves: config.lunchConfig?.numWaves || config.numLunchWaves || 1,
      minClassTime: config.lunchConfig?.minClassTime || config.minClassTime || 45
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

export default function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({});
  const [schedule, setSchedule] = useState(null);

  const gen = () => {
    const result = generateSchedule(buildScheduleConfig(config));
    setSchedule(result);
    setStep(99);
  };

  const regen = () => {
    if (!schedule) return;
    const lockedSections = schedule.sections.filter(s => s.locked);
    const manualSections = schedule.sections.filter(s => s.isManual && !s.locked);
    const sizeOverrides = schedule.sections
        .filter(s => s.enrollment !== s.maxSize && !s.isManual)
        .map(s => ({ sectionId: s.id, enrollment: s.enrollment }));

    const result = generateSchedule({ ...buildScheduleConfig(config), lockedSections, manualSections });
    
    if (sizeOverrides.length > 0) {
        result.sections = result.sections.map(sec => {
            const override = sizeOverrides.find(o => o.sectionId === sec.id);
            if (override) return { ...sec, enrollment: override.enrollment };
            return sec;
        });
    }
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
        <ScheduleGridView schedule={schedule} config={config} setSchedule={setSchedule} onRegenerate={regen} onBackToConfig={() => setStep(9)} />
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <WizardController step={step} setStep={setStep} config={config} setConfig={setConfig} onComplete={gen} />
    </div>
  );
}
