import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { fetchAPI } from '../lib/api';
import { usePageSeo } from '../hooks/usePageSeo';
import type { PageSeo } from '../lib/seo';
import { PageFade } from '../components/shared/PageFade';

interface PrivacyStatementData {
  label?: string;
  title?: string;
  lastRevision?: string;
  body?: string;
  seo?: PageSeo | null;
}

const BODY_TEXT: React.CSSProperties = { fontSize: '17.6px', fontWeight: 300, lineHeight: '28px' };

/** Legal-document markdown map — denser and quieter than the shared
 *  `Markdown` component: serif italic section headings, uppercase clause
 *  numbers, light body weight. */
const LEGAL_COMPONENTS = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2
      className="font-heading italic text-primary mt-14 mb-5"
      style={{
        fontSize: 'clamp(1.5rem, 1.6vw + 1rem, 1.875rem)',
        fontWeight: 300,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3
      className="font-body font-bold text-primary mt-6 mb-2"
      style={{ fontSize: '14.4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4
      className="font-body font-bold text-primary mt-5 mb-2"
      style={{ fontSize: '15.2px', lineHeight: '1.4' }}
    >
      {children}
    </h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="font-body text-primary mb-4" style={BODY_TEXT}>
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 space-y-2 mb-5 marker:text-accent">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="font-body text-primary" style={BODY_TEXT}>
      {children}
    </li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-accent underline underline-offset-2 hover:no-underline">
      {children}
    </a>
  ),
};

export default function PrivacyStatementPage() {
  const [data, setData] = useState<PrivacyStatementData | null>(null);
  const [loaded, setLoaded] = useState(false);
  usePageSeo(data?.seo);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await fetchAPI<PrivacyStatementData>('/privacy-statement-page');
      if (cancelled) return;
      setData(page);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data?.body) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-text-dark/70">
        Privacy statement content unavailable.
      </div>
    );
  }

  return (
    <PageFade loaded={loaded}>
      <section className="bg-bg pt-36 pb-24 md:pt-44 md:pb-32 lg:pt-52">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-10 border-b border-primary/15 pb-8">
            {data.label && (
              <p
                className="font-body font-bold uppercase text-accent mb-4"
                style={{ fontSize: '13px', letterSpacing: '0.08em' }}
              >
                {data.label}
              </p>
            )}
            <h1
              className="font-heading italic text-primary"
              style={{
                fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              {data.title ?? 'Privacy Statement'}
            </h1>
            {data.lastRevision && (
              <p
                className="font-body text-primary/70 mt-3"
                style={{ fontSize: '14px', fontWeight: 300 }}
              >
                Last revision: {data.lastRevision}
              </p>
            )}
          </header>

          <ReactMarkdown remarkPlugins={[remarkBreaks]} components={LEGAL_COMPONENTS}>
            {data.body}
          </ReactMarkdown>
        </div>
      </section>
    </PageFade>
  );
}
