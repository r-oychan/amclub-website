export default {
  routes: [
    {
      method: 'GET',
      path: '/diagnostic/schema',
      handler: 'diagnostic.schema',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
