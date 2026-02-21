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

# 🗺️ Strategic Roadmap: Advanced Scheduling & Instructional Models

This roadmap outlines the transition from a **mechanical seat-placer** to a **strategic instructional tool**. Implementation requires expanding the core engine beyond its current department-centric, single-day greedy logic.

---

## 1. Secondary High-School Models (Temporal Complexity)
The current engine assumes a single repeating daily bell schedule. These models require expanding the logic to handle multiple "Day Types" or "Terms."

* **A/B Alternating Day Schedule:**
    * **Concept:** 8 classes total; Periods 1, 3, 5, 7 on "A Days" and 2, 4, 6, 8 on "B Days."
    * **Integration:** Update `periodList` in `engine.js` to include a `dayCycle` attribute (A/B/Both). The greedy placement loop must check teacher/room availability across both day types simultaneously.
* **4x4 Block (Semester) Schedule:**
    * **Concept:** Students take 4 intensive 90-minute classes in the Fall and 4 different classes in the Spring.
    * **Integration:** Introduce a `term` property (S1/S2) to the `Section` object. The generator must run two passes to balance teacher loads across the full year.
* **Trimester Models:**
    * **Concept:** Three 12-week terms allowing for mid-year remediation or acceleration.
    * **Integration:** Requires a three-pass generation logic with a shared "Constraint Matrix" to track year-long teacher burnout and room fatigue.

---

## 2. Interdisciplinary Teaming & Cohort Rotation
Current logic schedules by department rather than student group. This section is critical for Middle Schools and "Freshman Academies."

* **The Concept:** A "Team" of ~100 students (e.g., 9th Grade Blue Team) shares the same four core teachers. These teachers must share a PLC period, and the students must rotate exclusively among these four rooms in a closed loop.
* **The "Team Block" Logic:**
    * Define a `Cohort` object: `{ id: '9-BLUE', teacherIds: ['T1', 'T2', 'T3', 'T4'], corePeriods: 4 }`.
    * **Phase-Based Scheduling:** The engine must reserve the "Team Block" (e.g., Periods 1-4) first. If Teacher A is teaching the Blue Cohort in P1, then Teachers B, C, and D must *also* be teaching that cohort or be on their shared Team PLC.
    * **Rotation Logic:** Implement a "Bucket" system ensuring that within the block, every student in the cohort has exactly one seat in Math, Science, ELA, and Social Studies.



---

## 3. Elementary & Strategic Grouping Models
Focuses on "reducing fragmentation" and protecting core instructional time.

* **Parallel Block Scheduling:**
    * **Concept:** A grade level is split; half the students are in "Extension/Intervention" with specialists while the other half are in "Core" to lower the student-teacher ratio.
    * **Integration:** Requires "Section Grouping" where two sections (Core and Intervention) are hard-linked to the same period in different rooms.
* **Teacher Teaming (Cohorting):**
    * **Concept:** A team of 2–3 teachers "owns" a large cohort. They have a 3-hour block to move students between rooms flexibly based on daily data.
    * **Integration:** Schedule the 3-hour "Team Block" as a single entity. Internal sub-schedules are handled as secondary, manual fine-tuning.

---

## 4. Instructional Leadership Features
Beyond making the schedule "fit," the tool should help administrators make instructional decisions.

* **Strategic Staffing Assignments:**
    * **Concept:** Matching high-effect teachers with high-need students (e.g., veteran leads in "Tier 3 Algebra").
    * **Integration:** Add a `TeacherSkill` score. Modify the `minCost` calculation in `engine.js` to provide a "Negative Cost" (bonus) when a priority match is made.
* **Dynamic RTI (Response to Intervention):**
    * **Concept:** Moving from a static "WIN" period to a data-driven one where students are re-grouped every few weeks.
    * **Integration:** Implement a "Flex Period" generator that creates temporary, non-locked sections for "Flex Fridays" or "I/E" blocks.

---

## 5. Technical Infrastructure Updates
To support the above, the following core changes are required in `src/core/`:

* **3D Conflict Matrix:** Expand `teacherBlocked` and `roomSchedule` to handle `[Day][Period][Room/Teacher]`.
* **Student Logic:** Move from "Seat Count" tracking to actual `Student` objects to allow for "Cohort-Based Conflict Checking".
* **Pre-Flight Mathematical Validation:** A diagnostic module to check `(Total Sections / Teacher Capacity)` before the `Greedy Placement Loop` begins to prevent gridlock.
