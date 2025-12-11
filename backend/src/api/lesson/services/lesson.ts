// src/api/lesson/services/lesson.ts

import { factories } from '@strapi/strapi';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type GenerateParams = {
  semesterId: number;
  clearExisting: boolean;
};

type UnassignedItem = {
  courseLoadId: number;
  reason: string;
};

type GenerateResult = {
  createdLessons: number;
  unassigned: UnassignedItem[];
};

type Task = {
  courseLoadId: number;
  groupId: number;
  subjectId: number;
  teacherId: number;
  weekType: string;        // all / odd / even / custom
  roomType?: string | null;
};

type PublicWeekParams = {
  groupSlug: string;
  date?: string;
};

type PublicScheduleLesson = {
  lessonId: number;
  pairNumber: number;
  time: string;
  subject: string;
  subjectShort: string | null;
  type: string | null;
  teacher: string | null;
  room: string | null;
  isOverride: boolean;
  overrideComment: string | null;
};

type PublicScheduleDay = {
  date: string;
  dayOfWeek: number; // 1–7 (1=понедельник)
  lessons: PublicScheduleLesson[];
};

type PublicScheduleWeek = {
  group: {
    id: number;
    name: string;
    slug: string;
    course: number | null;
    educationLevel?: string | null;
    educationForm?: string | null;
  };
  semester: {
    id: number;
    name: string;
    slug: string;
  };
  weekStart: string;           // YYYY-MM-DD (понедельник)
  weekNumber: number;
  weekParity: 'odd' | 'even';
  days: PublicScheduleDay[];
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(dateStr: string): Date {
  // предполагаем формат YYYY-MM-DD
  return new Date(dateStr);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function getWeekNumber(semesterStartStr: string, targetStr: string): number {
  const start = parseDate(semesterStartStr);
  const target = parseDate(targetStr);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  // первая неделя = 1
  return Math.floor(diffDays / 7) + 1;
}

function getWeekParity(weekNumber: number): 'odd' | 'even' {
  return weekNumber % 2 === 1 ? 'odd' : 'even';
}

function getWeekStartMonday(targetStr: string): Date {
  const target = parseDate(targetStr);
  const jsDay = target.getDay(); // 0=вс,1=пн,...6=сб
  const offset = (jsDay + 6) % 7; // 0=пн,1=вт,...6=вс
  return addDays(target, -offset);
}

function lessonMatchesWeek(lesson: any, weekNumber: number): boolean {
  const weekType: string = lesson.weekType || 'all';
  const startWeek: number | null = lesson.startWeek ?? null;
  const endWeek: number | null = lesson.endWeek ?? null;

  if (startWeek !== null && weekNumber < startWeek) return false;
  if (endWeek !== null && weekNumber > endWeek) return false;

  switch (weekType) {
    case 'odd':
      return weekNumber % 2 === 1;
    case 'even':
      return weekNumber % 2 === 0;
    case 'custom':
      // для custom доверяем startWeek/endWeek
      return true;
    case 'all':
    default:
      return true;
  }
}

function buildTimeRange(timeslot: any): string {
  const start: string = timeslot.startTime || '';
  const end: string = timeslot.endTime || '';

  const s = start.slice(0, 5); // HH:MM
  const e = end.slice(0, 5);
  return `${s}–${e}`;
}


export default factories.createCoreService('api::lesson.lesson', ({ strapi }) => ({
  async generate(params: GenerateParams): Promise<GenerateResult> {
    const { semesterId, clearExisting } = params;

    // 1. при необходимости чистим старые Lesson этого семестра
    if (clearExisting) {
      await strapi.db.query('api::lesson.lesson').deleteMany({
        where: {
          semestr: { id: semesterId },
        },
      });
    }

    // 2. подтягиваем данные

    const courseLoads = await strapi.entityService.findMany(
      'api::course-load.course-load',
      {
        filters: { semestr: { id: semesterId } },
        populate: ['study_group', 'subject', 'teacher'],
      }
    );

    const timeslots = await strapi.entityService.findMany(
      'api::time-slot.time-slot',
      {
        sort: [{ dayOfWeek: 'asc' }, { pairNumber: 'asc' }],
      }
    );

    const rooms = await strapi.entityService.findMany('api::room.room', {
      sort: [{ building: 'asc' }, { number: 'asc' }],
    });

    const existingLessons = await strapi.entityService.findMany(
      'api::lesson.lesson',
      {
        filters: { semestr: { id: semesterId } },
        populate: ['study_group', 'teacher', 'room', 'time_slot'],
      }
    );

    // 3. карты занятости
    const busyGroup = new Set<string>();
    const busyTeacher = new Set<string>();

    for (const lesson of existingLessons as any[]) {
      if (lesson.study_group && lesson.time_slot) {
        busyGroup.add(`${lesson.study_group.id}:${lesson.time_slot.id}`);
      }
      if (lesson.teacher && lesson.time_slot) {
        busyTeacher.add(`${lesson.teacher.id}:${lesson.time_slot.id}`);
      }
    }

    // 4. разворачиваем CourseLoad в задачи

    const tasks: Task[] = [];

    for (const cl of courseLoads as any[]) {
      const count: number = cl.lessonPerWeek || 0;
      for (let i = 0; i < count; i++) {
        tasks.push({
          courseLoadId: cl.id,
          groupId: cl.study_group.id,
          subjectId: cl.subject.id,
          teacherId: cl.teacher.id,
          weekType: cl.weekType,
          roomType: cl.roomType,
        });
      }
    }

    const unassigned: UnassignedItem[] = [];
    let createdLessons = 0;

    // 5. жадный алгоритм раскладки
    for (const task of tasks) {
      let placed = false;

      for (const slot of timeslots as any[]) {
        const keyG = `${task.groupId}:${slot.id}`;
        const keyT = `${task.teacherId}:${slot.id}`;

        // если группа или преподаватель заняты в этом слоте — пропускаем
        if (busyGroup.has(keyG) || busyTeacher.has(keyT)) {
          continue;
        }

        // выбираем аудиторию
        let room = (rooms as any[])[0] ?? null;

        if (task.roomType) {
          const matching = (rooms as any[]).find((r) => r.type === task.roomType);
          if (matching) {
            room = matching;
          }
        }

        if (!room) {
          // вообще нет подходящих аудиторий
          continue;
        }

        // 6. создаём Lesson
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            semestr: semesterId,
            study_group: task.groupId,
            subject: task.subjectId,
            teacher: task.teacherId,
            room: room.id,
            time_slot: slot.id,
            weekType: task.weekType as 'odd' | 'even' | 'all' | 'custom',
            course_load: task.courseLoadId,
          },
        });

        createdLessons += 1;
        busyGroup.add(keyG);
        busyTeacher.add(keyT);
        placed = true;
        break;
      }

      if (!placed) {
        unassigned.push({
          courseLoadId: task.courseLoadId,
          reason: 'no free timeslot+room for group/teacher',
        });
      }
    }

    return {
      createdLessons,
      unassigned,
    };
  },
}));
