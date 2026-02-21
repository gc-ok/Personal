// src/views/wizard/steps/PlanPLCStep.jsx
import React from "react";
import { COLORS } from "../../../utils/theme";
import { Btn, Card, NumInput, TimeInput, Sel, Toggle, Tabs, SMALL_INPUT } from "../../../components/ui/CoreUI";

export function PlanPLCStep({ config: c, setConfig, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ color: COLORS.primary, marginBottom: 6 }}>Plan Periods & PLC</h2>
      <div style={{ maxWidth: 650 }}>
        <NumInput label="Plan periods per day per teacher" min={0} max={3} value={c.planPeriodsPerDay ?? 1} onChange={v => setConfig({ ...c, planPeriodsPerDay: v })} helperText="Most schools: 1" />
        <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.lightGray}`, paddingTop: 20 }}>
          <Toggle label="Include PLC time" checked={c.plcEnabled || false} onChange={v => setConfig({ ...c, plcEnabled: v })} description="Collaborative teacher team time" />
          {c.plcEnabled && <Sel label="PLC frequency" value={c.plcFrequency || "weekly"} onChange={v => setConfig({ ...c, plcFrequency: v })} options={[{value:"daily",label:"Daily"},{value:"weekly",label:"Weekly"}]} />}
        </div>
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext}>Continue →</Btn>
      </div>
    </div>
  );
}
