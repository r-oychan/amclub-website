export default {
  routes: ['robots.txt', 'sitemap.xml', 'llms.txt'].map((file) => ({
    method: 'GET',
    path: `/site-discovery/${file}`,
    handler: `api::crawler-settings.crawler-settings.${file.split('.')[0]}`,
    config: { auth: false },
  })),
};
