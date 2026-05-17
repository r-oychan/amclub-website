import { factories } from '@strapi/strapi';

const POPULATE = {
  logo: true,
  ctaButton: true,
  navItems: {
    populate: {
      columns: {
        populate: {
          links: true,
          image: true,
        },
      },
    },
  },
};

export default factories.createCoreController('api::header.header', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::header.header').findFirst({
      populate: POPULATE,
    });
    return { data: entity, meta: {} };
  },
}));
