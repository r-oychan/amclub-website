import type { VenueData } from '../../lib/venue-types';
import { DetailSection } from './DetailSection';
import { QrCode } from '../shared/QrCode';

const TEXT_STYLE: React.CSSProperties = { fontSize: '19.2px', lineHeight: '26.88px' };
const PLATFORM_NAME = { ios: 'iOS', android: 'Android' } as const;

/** "Download the App" side section — one QR per store link that has a URL. */
export function AppDownloadSection({ data }: { data: NonNullable<VenueData['appDownload']> }) {
  const withUrl = data.links.filter((l) => l.url);
  if (!withUrl.length && !data.description) return null;
  return (
    <DetailSection icon="mobile" title={data.heading ?? 'Download the App'}>
      <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: '24px' }}>
        {withUrl.length > 0 && (
          <div className="flex flex-row shrink-0" style={{ gap: '16px' }}>
            {withUrl.map((l) => (
              <a
                key={l.platform}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <QrCode value={l.url!} label={`QR code: ${l.label}`} size={112} />
                <span
                  className="text-primary uppercase group-hover:text-accent transition-colors"
                  style={{ fontSize: '12.8px', fontWeight: 700, letterSpacing: '0.04em' }}
                >
                  {PLATFORM_NAME[l.platform]}
                </span>
              </a>
            ))}
          </div>
        )}
        {data.description && (
          <p className="text-text-dark" style={TEXT_STYLE}>
            {data.description}
          </p>
        )}
      </div>
    </DetailSection>
  );
}
