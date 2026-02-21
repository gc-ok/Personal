// src/core/ResourceTracker.js

export class ResourceTracker {
  constructor(teachers, rooms, maxLoad) {
    this.teacherSchedule = {}; 
    this.roomSchedule = {};    
    this.teacherLoad = {};     
    this.roomOwners = {};
    
    // In block/trimesters, maxLoad is per term.
    this.maxLoad = maxLoad; 

    teachers.forEach(t => {
      this.teacherSchedule[t.id] = {};
      // Track loads independently for every possible term
      this.teacherLoad[t.id] = { FY: 0, S1: 0, S2: 0, T1: 0, T2: 0, T3: 0, A: 0, B: 0 };
    });
    rooms.forEach(r => {
      this.roomSchedule[r.id] = {};
    });
  }

  setRoomOwner(roomId, teacherId) {
    this.roomOwners[roomId] = teacherId;
  }

  blockTeacher(teacherId, timeSlotId, reason = "BLOCKED") {
    if (!this.teacherSchedule[teacherId]) return;
    this.teacherSchedule[teacherId][timeSlotId] = reason;
  }

  isTeacherAvailable(teacherId, timeSlotId) {
    if (!this.teacherSchedule[teacherId]) return false;
    return !this.teacherSchedule[teacherId][timeSlotId];
  }

  isRoomAvailable(roomId, timeSlotId) {
    if (!this.roomSchedule[roomId]) return false;
    return !this.roomSchedule[roomId][timeSlotId];
  }

  // UPDATED: Now requires the term being queried
  getTeacherLoad(teacherId, term = 'FY') {
    return this.teacherLoad[teacherId]?.[term] || 0;
  }

  // UPDATED: Now increments the specific term's load
  assignPlacement(section, timeSlotId, teacherId, coTeacherId, roomId, term = 'FY') {
    if (teacherId) {
      this.teacherSchedule[teacherId][timeSlotId] = section.id;
      this.teacherLoad[teacherId][term]++;
    }
    if (coTeacherId) {
      this.teacherSchedule[coTeacherId][timeSlotId] = section.id;
      this.teacherLoad[coTeacherId][term]++;
    }
    if (roomId) {
      this.roomSchedule[roomId][timeSlotId] = section.id;
    }
    section.period = timeSlotId;
    section.term = term; // Tag the section with its term
  }
}
