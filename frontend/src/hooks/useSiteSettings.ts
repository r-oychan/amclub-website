import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';

export interface SiteSettings {
  chatbotEnabled: boolean;
}

interface StrapiSiteSettings {
  chatbotEnabled?: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  chatbotEnabled: true,
};

export function useSiteSettings(): SiteSettings | null {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAPI<StrapiSiteSettings>('/site-settings').then((data) => {
      if (cancelled) return;
      if (!data) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }
      setSettings({
        chatbotEnabled: data.chatbotEnabled ?? DEFAULT_SETTINGS.chatbotEnabled,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
