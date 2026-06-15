import { useEffect, useState } from 'react';
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

export function useSiteCopy(): SiteCopy {
  const [copy, setCopy] = useState<SiteCopy>(DEFAULTS);

  useEffect(() => {
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
  }, []);

  return copy;
}
