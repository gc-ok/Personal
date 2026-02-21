// src/core/strategies/ScheduleStrategies.js

export class BaseStrategy {
  constructor(tracker, config, logger) {
    this.tracker = tracker;
    this.config = config;
    this.logger = logger;
    this.conflicts = [];
    this.secsInPeriod = {};
  }
  
  execute(sections, periodList, rooms) {
    throw new Error("Execute method must be implemented by subclass");
  }
}

export class StandardStrategy extends BaseStrategy {
  execute(sections, periodList, rooms) {
    const teachingPeriodIds = periodList.map(p => p.id);
    teachingPeriodIds.forEach(id => this.secsInPeriod[`FY-ALL-${id}`] = 0);

    const placementOrder = [...sections].filter(s => !s.locked && !s.hasConflict).sort((a,b) => {
      return a.isCore === b.isCore ? 0 : a.isCore ? -1 : 1;
    });

    placementOrder.forEach(sec => {
      let bestSlot = null;
      let minCost = Infinity;
      let periodEvaluations = []; 
      
      const shuffled = [...teachingPeriodIds].sort(()=>Math.random()-0.5);

      for(const pid of shuffled) {
        if(pid === "WIN") continue;
        const timeSlotId = `FY-ALL-${pid}`; // Universal ID format
        
        let cost = 0;
        let fails = [];
        let softFails = []; // Track penalties that don't cause an outright rejection

        // 1. HARD CONSTRAINTS (Must Reject)
        if (!this.tracker.isTeacherAvailable(sec.teacher, timeSlotId)) fails.push("Teacher booked");
        if (sec.coTeacher && !this.tracker.isTeacherAvailable(sec.coTeacher, timeSlotId)) fails.push("Co-Teacher booked");

        if (fails.length > 0) {
          periodEvaluations.push({ period: timeSlotId, cost: Infinity, reasons: fails });
          continue; // Early exit, period is impossible
        }

        // 2. SOFT CONSTRAINTS (Adds to Cost Score)
        if (this.tracker.getTeacherLoad(sec.teacher, 'FY') >= this.tracker.maxLoad) { 
          cost += 500; softFails.push("Exceeds target load"); 
        }
        if (sec.room && !this.tracker.isRoomAvailable(sec.room, timeSlotId)) { 
          cost += 100; softFails.push("Preferred room occupied"); 
        }
        const sibs = sections.filter(s => s.courseId === sec.courseId && s.period === timeSlotId).length;
        if (!sec.isCore && sibs > 0) { 
          cost += 200; softFails.push("Elective overlap"); 
        }

        cost += (this.secsInPeriod[timeSlotId] || 0) * 10;
        periodEvaluations.push({ period: timeSlotId, cost, reasons: softFails });

        if(cost < minCost) { minCost = cost; bestSlot = timeSlotId; }
      }

      if (bestSlot) {
        this.secsInPeriod[bestSlot]++;
        
        // Resolve final room
        let finalRoom = sec.room;
        if (!finalRoom || !this.tracker.isRoomAvailable(finalRoom, bestSlot)) {
          const availableRooms = rooms.filter(r => r.type === sec.roomType && this.tracker.isRoomAvailable(r.id, bestSlot));
          // Dynamic floater mapping
          availableRooms.sort((a, b) => (!!this.tracker.roomOwners[b.id] ? 1 : 0) - (!!this.tracker.roomOwners[a.id] ? 1 : 0));
          if(availableRooms.length > 0) finalRoom = availableRooms[0].id; 
        }

        if(finalRoom) { sec.roomName = rooms.find(r=>r.id===finalRoom)?.name; }
        
        this.tracker.assignPlacement(sec, bestSlot, sec.teacher, sec.coTeacher, finalRoom, 'FY');
        this.logger.logPlacement(sec, bestSlot, minCost, periodEvaluations);
      } else {
        sec.hasConflict = true; sec.conflictReason = "Scheduling Gridlock"; 
        this.conflicts.push({ type: "unscheduled", message: `${sec.courseName} S${sec.sectionNum}: No valid period found`, sectionId: sec.id });
        this.logger.logFailure(sec, periodEvaluations);
      }
    });

    return this.conflicts;
  }
}

// src/core/strategies/ScheduleStrategies.js
// (Keep BaseStrategy and StandardStrategy above this)

export class ABStrategy extends BaseStrategy {
  execute(sections, periodList, rooms) {
    const timeSlots = [];
    
    // 1. Generate the A/B Universal TimeSlots
    // If periodList has 4 blocks, this creates FY-A-1, FY-B-1, FY-A-2, FY-B-2, etc.
    periodList.forEach(p => {
      if (p.id === "WIN" || p.type === "win") return;
      
      const aSlot = `FY-A-${p.id}`;
      const bSlot = `FY-B-${p.id}`;
      timeSlots.push(aSlot, bSlot);
      
      this.secsInPeriod[aSlot] = 0;
      this.secsInPeriod[bSlot] = 0;
    });

    // 2. Sort sections (Core first)
    const placementOrder = [...sections].filter(s => !s.locked && !s.hasConflict).sort((a,b) => {
      return a.isCore === b.isCore ? 0 : a.isCore ? -1 : 1;
    });

    // 3. Greedy Placement across both A and B days simultaneously
    placementOrder.forEach(sec => {
      let bestSlot = null;
      let minCost = Infinity;
      let periodEvaluations = []; 
      
      const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);

      for (const slotId of shuffledSlots) {
        let cost = 0;
        let fails = [];
        let softFails = [];

        // 1. HARD CONSTRAINTS
        if (!this.tracker.isTeacherAvailable(sec.teacher, slotId)) fails.push("Teacher booked");
        if (sec.coTeacher && !this.tracker.isTeacherAvailable(sec.coTeacher, slotId)) fails.push("Co-Teacher booked");

        if (fails.length > 0) {
          periodEvaluations.push({ period: slotId, cost: Infinity, reasons: fails });
          continue;
        }

        // 2. SOFT CONSTRAINTS
        if (this.tracker.getTeacherLoad(sec.teacher, 'FY') >= this.tracker.maxLoad) { 
          cost += 500; softFails.push("Exceeds A/B target load"); 
        }
        if (sec.room && !this.tracker.isRoomAvailable(sec.room, slotId)) { 
          cost += 100; softFails.push("Preferred room occupied"); 
        }
        const sibs = sections.filter(s => s.courseId === sec.courseId && s.period === slotId).length;
        if (!sec.isCore && sibs > 0) { 
          cost += 200; softFails.push("Elective overlap"); 
        }

        cost += (this.secsInPeriod[slotId] || 0) * 10;
        periodEvaluations.push({ period: slotId, cost, reasons: softFails });

        if (cost < minCost) { minCost = cost; bestSlot = slotId; }
      }

      // 4. Finalize Placement
      if (bestSlot) {
        this.secsInPeriod[bestSlot]++;
        
        let finalRoom = sec.room;
        if (!finalRoom || !this.tracker.isRoomAvailable(finalRoom, bestSlot)) {
          const availableRooms = rooms.filter(r => r.type === sec.roomType && this.tracker.isRoomAvailable(r.id, bestSlot));
          availableRooms.sort((a, b) => (!!this.tracker.roomOwners[b.id] ? 1 : 0) - (!!this.tracker.roomOwners[a.id] ? 1 : 0));
          if(availableRooms.length > 0) finalRoom = availableRooms[0].id; 
        }

        if(finalRoom) { sec.roomName = rooms.find(r=>r.id===finalRoom)?.name; }
        
        this.tracker.assignPlacement(sec, bestSlot, sec.teacher, sec.coTeacher, finalRoom, 'FY');
        this.logger.logPlacement(sec, bestSlot, minCost, periodEvaluations);
      } else {
        sec.hasConflict = true; sec.conflictReason = "A/B Scheduling Gridlock"; 
        this.conflicts.push({ type: "unscheduled", message: `${sec.courseName} S${sec.sectionNum}: No valid A/B slot found`, sectionId: sec.id });
        this.logger.logFailure(sec, periodEvaluations);
      }
    });

    return this.conflicts;
  }
}

// --- src/core/strategies/ScheduleStrategies.js (APPEND TO BOTTOM) ---

export class Block4x4Strategy extends BaseStrategy {
  execute(sections, periodList, rooms) {
    const timeSlots = [];
    
    // 1. Generate Semester 1 and Semester 2 Universal TimeSlots
    periodList.forEach(p => {
      if (p.id === "WIN" || p.type === "win") return;
      const s1Slot = `S1-ALL-${p.id}`;
      const s2Slot = `S2-ALL-${p.id}`;
      timeSlots.push(s1Slot, s2Slot);
      this.secsInPeriod[s1Slot] = 0;
      this.secsInPeriod[s2Slot] = 0;
    });

    const placementOrder = [...sections].filter(s => !s.locked && !s.hasConflict).sort((a,b) => {
      return a.isCore === b.isCore ? 0 : a.isCore ? -1 : 1;
    });

    placementOrder.forEach(sec => {
      let bestSlot = null;
      let minCost = Infinity;
      let periodEvaluations = []; 
      
      const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);

      for (const slotId of shuffledSlots) {
        let cost = 0;
        let fails = [];
        let softFails = [];
        
        const term = slotId.startsWith("S1") ? "S1" : "S2";

        // 1. HARD CONSTRAINTS
        if (!this.tracker.isTeacherAvailable(sec.teacher, slotId)) fails.push("Teacher booked");
        if (sec.coTeacher && !this.tracker.isTeacherAvailable(sec.coTeacher, slotId)) fails.push("Co-Teacher booked");

        if (fails.length > 0) {
          periodEvaluations.push({ period: slotId, cost: Infinity, reasons: fails });
          continue;
        }

        // 2. SOFT CONSTRAINTS
        if (this.tracker.getTeacherLoad(sec.teacher, term) >= this.tracker.maxLoad) { 
          cost += 500; softFails.push(`Exceeds ${term} target load`); 
        }
        if (sec.room && !this.tracker.isRoomAvailable(sec.room, slotId)) { 
          cost += 100; softFails.push("Preferred room occupied"); 
        }

        // 3. TERM BALANCING (Keep Fall/Spring loads even for departments)
        const s1Count = sections.filter(s => s.courseId === sec.courseId && s.period?.startsWith("S1")).length;
        const s2Count = sections.filter(s => s.courseId === sec.courseId && s.period?.startsWith("S2")).length;
        
        if (term === "S1" && s1Count > s2Count) cost += 150; 
        if (term === "S2" && s2Count > s1Count) cost += 150; 

        cost += (this.secsInPeriod[slotId] || 0) * 10;
        periodEvaluations.push({ period: slotId, cost, reasons: softFails });

        if (cost < minCost) { minCost = cost; bestSlot = slotId; }
      }

      if (bestSlot) {
        this.secsInPeriod[bestSlot]++;
        const term = bestSlot.startsWith("S1") ? "S1" : "S2";
        
        let finalRoom = sec.room;
        if (!finalRoom || !this.tracker.isRoomAvailable(finalRoom, bestSlot)) {
          const availableRooms = rooms.filter(r => r.type === sec.roomType && this.tracker.isRoomAvailable(r.id, bestSlot));
          availableRooms.sort((a, b) => (!!this.tracker.roomOwners[b.id] ? 1 : 0) - (!!this.tracker.roomOwners[a.id] ? 1 : 0));
          if(availableRooms.length > 0) finalRoom = availableRooms[0].id; 
        }

        if(finalRoom) sec.roomName = rooms.find(r=>r.id===finalRoom)?.name;
        this.tracker.assignPlacement(sec, bestSlot, sec.teacher, sec.coTeacher, finalRoom, term);
        this.logger.logPlacement(sec, bestSlot, minCost, periodEvaluations);
      } else {
        sec.hasConflict = true; sec.conflictReason = "Semester Block Gridlock"; 
        this.conflicts.push({ type: "unscheduled", message: `${sec.courseName} S${sec.sectionNum}: No valid S1/S2 slot found`, sectionId: sec.id });
        this.logger.logFailure(sec, periodEvaluations);
      }
    });

    return this.conflicts;
  }
}

export class TrimesterStrategy extends BaseStrategy {
  execute(sections, periodList, rooms) {
    const timeSlots = [];
    
    // 1. Generate T1, T2, and T3 TimeSlots
    periodList.forEach(p => {
      if (p.id === "WIN" || p.type === "win") return;
      const t1Slot = `T1-ALL-${p.id}`;
      const t2Slot = `T2-ALL-${p.id}`;
      const t3Slot = `T3-ALL-${p.id}`;
      timeSlots.push(t1Slot, t2Slot, t3Slot);
      this.secsInPeriod[t1Slot] = 0;
      this.secsInPeriod[t2Slot] = 0;
      this.secsInPeriod[t3Slot] = 0;
    });

    const placementOrder = [...sections].filter(s => !s.locked && !s.hasConflict).sort((a,b) => {
      return a.isCore === b.isCore ? 0 : a.isCore ? -1 : 1;
    });

    placementOrder.forEach(sec => {
      let bestSlot = null;
      let minCost = Infinity;
      let periodEvaluations = []; 
      
      const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);

      for (const slotId of shuffledSlots) {
        let cost = 0;
        let fails = [];
        let softFails = [];
        
        const term = slotId.startsWith("T1") ? "T1" : slotId.startsWith("T2") ? "T2" : "T3";

        // 1. HARD CONSTRAINTS
        if (!this.tracker.isTeacherAvailable(sec.teacher, slotId)) fails.push("Teacher booked");
        if (sec.coTeacher && !this.tracker.isTeacherAvailable(sec.coTeacher, slotId)) fails.push("Co-Teacher booked");

        if (fails.length > 0) {
          periodEvaluations.push({ period: slotId, cost: Infinity, reasons: fails });
          continue;
        }

        // 2. SOFT CONSTRAINTS
        if (this.tracker.getTeacherLoad(sec.teacher, term) >= this.tracker.maxLoad) { 
          cost += 500; softFails.push(`Exceeds ${term} target load`); 
        }
        if (sec.room && !this.tracker.isRoomAvailable(sec.room, slotId)) { 
          cost += 100; softFails.push("Preferred room occupied"); 
        }

        // 3. TRIMESTER BALANCING
        const t1Count = sections.filter(s => s.courseId === sec.courseId && s.period?.startsWith("T1")).length;
        const t2Count = sections.filter(s => s.courseId === sec.courseId && s.period?.startsWith("T2")).length;
        const t3Count = sections.filter(s => s.courseId === sec.courseId && s.period?.startsWith("T3")).length;
        
        // Prevent all sections of a class ending up in one trimester
        if (term === "T1" && t1Count > (t2Count + t3Count)/2) cost += 150; 
        if (term === "T2" && t2Count > (t1Count + t3Count)/2) cost += 150; 
        if (term === "T3" && t3Count > (t1Count + t2Count)/2) cost += 150; 

        cost += (this.secsInPeriod[slotId] || 0) * 10;
        periodEvaluations.push({ period: slotId, cost, reasons: softFails });

        if (cost < minCost) { minCost = cost; bestSlot = slotId; }
      }

      if (bestSlot) {
        this.secsInPeriod[bestSlot]++;
        const term = bestSlot.startsWith("T1") ? "T1" : bestSlot.startsWith("T2") ? "T2" : "T3";
        
        let finalRoom = sec.room;
        if (!finalRoom || !this.tracker.isRoomAvailable(finalRoom, bestSlot)) {
          const availableRooms = rooms.filter(r => r.type === sec.roomType && this.tracker.isRoomAvailable(r.id, bestSlot));
          availableRooms.sort((a, b) => (!!this.tracker.roomOwners[b.id] ? 1 : 0) - (!!this.tracker.roomOwners[a.id] ? 1 : 0));
          if(availableRooms.length > 0) finalRoom = availableRooms[0].id; 
        }

        if(finalRoom) sec.roomName = rooms.find(r=>r.id===finalRoom)?.name;
        this.tracker.assignPlacement(sec, bestSlot, sec.teacher, sec.coTeacher, finalRoom, term);
        this.logger.logPlacement(sec, bestSlot, minCost, periodEvaluations);
      } else {
        sec.hasConflict = true; sec.conflictReason = "Trimester Gridlock"; 
        this.conflicts.push({ type: "unscheduled", message: `${sec.courseName} S${sec.sectionNum}: No valid Trimester slot found`, sectionId: sec.id });
        this.logger.logFailure(sec, periodEvaluations);
      }
    });

    return this.conflicts;
  }
}
