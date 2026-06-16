import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { isHardLink } from '../../lib/links';

// Shared markdown renderer for all CMS richtext/text content so every page
// formats the same way: paragraphs, links (assets/external → new tab),
// bold/italic, ordered & unordered lists, headings, blockquotes and rules.
// Previously each page defined its own partial component map (EventDetailPage
// only styled <p>/<a>, so lists/bold/headings rendered unformatted).
export function Markdown({
  children,
  compact = false,
  className = '',
}: {
  children: string;
  compact?: boolean;
  className?: string;
}) {
  const body = compact
    ? { fontSize: '17.6px', lineHeight: '25.6px' }
    : { fontSize: '19.2px', lineHeight: '26.88px' };
  return (
    <div className={`flex flex-col ${className}`} style={{ gap: '16px' }}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => (
            <p className="text-text-dark" style={{ fontWeight: 400, ...body }}>
              {children}
            </p>
          ),
          a: ({ href, children }) => {
            const external = isHardLink(href);
            return (
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="text-accent underline underline-offset-2 hover:no-underline"
              >
                {children}
              </a>
            );
          },
          strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 flex flex-col" style={{ gap: '8px' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-text-dark" style={body}>
              {children}
            </li>
          ),
          h2: ({ children }) => (
            <h2 className="font-heading text-primary" style={{ fontSize: '26px', fontWeight: 400, lineHeight: '32px' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-heading text-primary" style={{ fontSize: '21px', fontWeight: 600, lineHeight: '28px' }}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-primary font-bold" style={{ fontSize: '17.6px', lineHeight: '24px' }}>
              {children}
            </h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent/40 pl-4 italic text-text-dark/80">{children}</blockquote>
          ),
          hr: () => <hr className="border-t border-line" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
