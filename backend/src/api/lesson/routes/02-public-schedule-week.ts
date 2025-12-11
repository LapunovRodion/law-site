// src/api/lesson/routes/02-public-schedule-week.ts

export default {
    routes: [
      {
        method: 'GET',
        path: '/public-schedule/week',
        handler: 'lesson.publicWeek',
        config: {
          auth: false,      // публичный эндпоинт
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  