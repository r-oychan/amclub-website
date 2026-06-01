import { CloneEditViewSidePanel } from './pages/CloneEditViewSidePanel';

interface StrapiAppLike {
  getPlugin?: (name: string) => {
    apis?: { addEditViewSidePanel?: (panels: unknown[]) => void };
  };
}

export default {
  register() {},
  bootstrap(app: StrapiAppLike) {
    app
      .getPlugin?.('content-manager')
      ?.apis?.addEditViewSidePanel?.([CloneEditViewSidePanel]);
  },
};
