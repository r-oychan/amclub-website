import { createContext, useContext, useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';

// Site-wide UI chrome labels, editable in the CMS (Global: Site Configuration).
// Code-level defaults guarantee the UI never renders blank if the CMS entry
// hasn't been seeded, so wiring these is regression-free.
export interface SiteCopy {
  loadMoreLabel: string;
  readMoreLabel: string;
  viewAlbumLabel: string;
}

const DEFAULTS: SiteCopy = {
  loadMoreLabel: 'Load More',
  readMoreLabel: 'Read More',
  viewAlbumLabel: 'View Album',
};

export const SiteCopyContext = createContext<Partial<SiteCopy> | undefined>(undefined);

export function useSiteCopy(): SiteCopy {
  const initial = useContext(SiteCopyContext);
  const [copy, setCopy] = useState<SiteCopy>(() => ({ loadMoreLabel: initial?.loadMoreLabel?.trim() || DEFAULTS.loadMoreLabel, readMoreLabel: initial?.readMoreLabel?.trim() || DEFAULTS.readMoreLabel, viewAlbumLabel: initial?.viewAlbumLabel?.trim() || DEFAULTS.viewAlbumLabel }));

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetchAPI<Partial<SiteCopy>>('/site-config')
      .then((c) => {
        if (cancelled || !c) return;
        setCopy({
          loadMoreLabel: c.loadMoreLabel?.trim() || DEFAULTS.loadMoreLabel,
          readMoreLabel: c.readMoreLabel?.trim() || DEFAULTS.readMoreLabel,
          viewAlbumLabel: c.viewAlbumLabel?.trim() || DEFAULTS.viewAlbumLabel,
        });
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return copy;
}
