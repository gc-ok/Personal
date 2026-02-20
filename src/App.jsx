// src/App.jsx
import React, { useState } from "react";
import { COLORS } from "./utils/theme";
import { generateSchedule } from "./core/engine";
import ScheduleGridView from "./components/grid/ScheduleGridView";
import { Logo, Btn } from "./components/ui/CoreUI";

import { 
  SchoolTypeStep, ScheduleTypeStep, BellScheduleStep, LunchStep, 
  PlanPLCStep, WINTimeStep, DataInputStep, GenericInputStep, 
  CSVUploadStep, ConstraintsStep 
} from "./views/WizardSteps";

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
