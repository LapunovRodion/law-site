import { factories } from '@strapi/strapi';

interface GenerateBody {
  semesterId?: number;
  clearExisting?: boolean;
}

interface PublicWeekQuery {
  groupSlug?: string;
  date?: string;
}

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async generate(ctx) {
    const body = ctx.request.body as GenerateBody | undefined;
    const semesterId = body?.semesterId;
    const clearExisting = !!body?.clearExisting;

    if (!semesterId) {
      return ctx.badRequest('semesterId is required');
    }

    const result = await strapi
      .service('api::lesson.lesson')
      .generate({
        semesterId,
        clearExisting,
      });

    ctx.body = result;
  },

  async publicWeek(ctx) {
    const query = ctx.query as PublicWeekQuery | undefined;
    const groupSlug = query?.groupSlug;
    const date = query?.date; // может быть undefined → возьмём "сегодня" в сервисе

    if (!groupSlug) {
      return ctx.badRequest('groupSlug is required');
    }

    try {
      const result = await strapi
        .service('api::lesson.lesson')
        .getPublicWeekForGroup({ groupSlug, date });

      ctx.body = result;
    } catch (err: any) {
      if (err?.message === 'GROUP_NOT_FOUND') {
        return ctx.notFound('Group not found');
      }
      if (err?.message === 'SEMESTER_NOT_FOUND') {
        return ctx.badRequest('No semester found for this date');
      }
      throw err;
    }
  },
}));
