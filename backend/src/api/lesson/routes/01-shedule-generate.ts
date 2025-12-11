// src/api/lesson/routes/01-schedule-generate.ts

export default {
    routes: [
      {
        method: 'POST',
        path: '/schedule/generate',
        handler: 'lesson.generate',
        config: {
          auth: false, // потом повесим роли/токены
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  