# K-12 Master Schedule Generator (GC Education Analytics)

A completely in-browser, fully client-side React application for building, evaluating, and fine-tuning K-12 school master schedules. Designed with a modular architecture to handle the extreme edge-cases of educational time management.

## 🏗️ Architecture
The codebase has been refactored from a monolithic `App.jsx` into a maintainable, feature-driven structure:
* `src/core/engine.js`: The greedy scheduling algorithm, constraint evaluator, and structured logger.
* `src/components/grid/`: The visual output layers (Master Grid, Teacher Grid, Room Grid).
* `src/components/ui/CoreUI.jsx`: Reusable buttons, inputs, and layout wrappers.
* `src/views/WizardSteps.jsx`: The state-driven setup forms to map school data before generation.
* `src/App.jsx`: The primary orchestrator routing between setup state and the final grid view.

## ✨ Core Features Implemented
* **Smart Bell Schedule Math:** Auto-calculates period lengths based on hard start/end times, or strictly adheres to fixed minute requirements.
* **Advanced Lunch Configurations:** Supports Unit lunches (whole school stops), Split Lunch Waves (automatically balances departments across fractional blocks while protecting minimum seat time), and Multi-Period Lunches (balances teachers across multiple full-class periods).
* **Dynamic WIN Time (What I Need):** Can inject standalone intervention blocks mid-morning and cascade-shift all subsequent bell times, or absorb an existing period.
* **Common PLC Engine:** Groups teachers by department and enforces a "hard block" on a shared period, ensuring teams get a common prep before their classes are scheduled.
* **Stateful Manual Editing:** Fully integrated drag-and-drop. Moving a section instantly updates room availability, teacher loads, and conflict checkers without regenerating the whole schedule.
* **Structured Constraint Logger:** A developer-focused log view tracing the exact "Cost Score" of every section placement, explicitly showing why a period failed (e.g., "Exceeds target load", "Preferred room occupied").
* **Floating Teachers & Dynamic Room Allocation:** Explicit `isFloater` toggles for teachers. The algorithm dynamically maps them to the rooms of teachers who are currently on their Plan or PLC period to maximize spatial efficiency.
* **Part-Time Staff & Custom Availability:** Granular control allowing explicit `UNAVAILABLE` blocking for specific teachers (e.g., "Mornings Only"). The engine seeds these into the constraint matrix before the greedy loop begins.
* **Co-Teaching & Inclusion Models:** Supports dual-teacher assignments via `coTeacherId`. The greedy evaluation loop simultaneously runs hard constraints (`teacherBlocked`, `teacherSchedule`) against both educators before placing the section.

## 🚀 The Roadmap: Future Features & Logic Targets

### 1. Singletons & Double-Blocked Courses
* **The Issue:** The current engine only handles single-period courses.
* **The Fix:** Add properties to the Section object (`isDoubleBlock: true`, `singletonPriority: 1`). The engine must evaluate consecutive periods (e.g., P4 and P5 must be open simultaneously). Crucially, the engine's sorting logic must be updated to schedule singletons and double-blocks *first* before highly populated core classes eat up available slots.

### 2. True Student Cohort Matrixing & Pathway Tracking
* **The Issue:** The current algorithm focuses on *Seat Coverage* (making sure 800 seats exist in Period 1). It does not track actual student schedules or specific graduation pathway requirements.
* **The Fix:** Advanced feature implementation. We will need to define `Student` objects or "Cohorts" (e.g., "9th Grade Honors" or specific career pathway groups). If a cohort needs AP Bio and Band, the engine must utilize a conflict matrix to add massive cost penalties if it schedules those two singletons in the same period, forcing students to choose.

### 3. "Pre-Flight" Mathematical Validation (Heuristics)
* **The Concept:** Before the greedy loop even starts, the engine should run a mathematical diagnostic. If a school requests 40 sections of Math but only has 4 Math teachers and a target load of 5 classes a day (max capacity = 20), the engine should instantly flag the mathematical impossibility rather than throwing generic placement gridlocks. 

### 4. Schedule Versioning & Scenario Planning
* **The Concept:** Master scheduling is trial and error. The UI should support saving "Draft A" and "Draft B" in local state. This would allow a user to toggle between two completely different generated grids to compare which has fewer conflicts or better cost scores.

### 5. SIS Data Integration (Export/Import)
* **The Concept:** To be production-ready for a live building, the final step must be taking the generated `sections` array and formatting it into standardized CSV exports that map directly to the import schemas of major Student Information Systems (e.g., PowerSchool, Infinite Campus, or custom data analytics pipelines).
