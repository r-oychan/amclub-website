import { Fragment, type ReactNode } from 'react';
import { STRAPI_URL } from '../../lib/api';

type TextLeaf = {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

type LinkInline = {
  type: 'link';
  url: string;
  children: TextLeaf[];
};

type InlineNode = TextLeaf | LinkInline;

type ParagraphBlock = { type: 'paragraph'; children: InlineNode[] };
type HeadingBlock = { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] };
type ListItemBlock = { type: 'list-item'; children: InlineNode[] };
type ListBlock = {
  type: 'list';
  format: 'ordered' | 'unordered';
  children: ListItemBlock[];
};
type QuoteBlock = { type: 'quote'; children: InlineNode[] };
type CodeBlock = { type: 'code'; children: InlineNode[] };
type ImageBlock = {
  type: 'image';
  image: {
    url: string;
    alternativeText?: string | null;
    width?: number;
    height?: number;
    caption?: string | null;
  };
};

export type AnswerBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | ImageBlock;

const absoluteUrl = (url: string): string =>
  /^https?:/i.test(url) ? url : `${STRAPI_URL}${url}`;

function renderInline(node: InlineNode, key: number): ReactNode {
  if (node.type === 'link') {
    return (
      <a
        key={key}
        href={node.url}
        target={node.url.startsWith('http') ? '_blank' : undefined}
        rel={node.url.startsWith('http') ? 'noreferrer noopener' : undefined}
        className="underline underline-offset-2 hover:text-accent"
      >
        {node.children.map((c, i) => renderInline(c, i))}
      </a>
    );
  }
  let el: ReactNode = node.text;
  if (node.code) el = <code key={key} className="font-mono text-[0.95em] bg-black/5 px-1 rounded">{el}</code>;
  if (node.bold) el = <strong key={key}>{el}</strong>;
  if (node.italic) el = <em key={key}>{el}</em>;
  if (node.underline) el = <u key={key}>{el}</u>;
  if (node.strikethrough) el = <s key={key}>{el}</s>;
  return <Fragment key={key}>{el}</Fragment>;
}

function renderBlock(block: AnswerBlock, key: number): ReactNode {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={key} className="mb-3 last:mb-0">
          {block.children.map((c, i) => renderInline(c, i))}
        </p>
      );
    case 'heading': {
      const sizes: Record<number, string> = {
        1: 'text-2xl font-semibold mt-4 mb-2',
        2: 'text-xl font-semibold mt-4 mb-2',
        3: 'text-lg font-semibold mt-3 mb-2',
        4: 'text-base font-semibold mt-3 mb-2',
        5: 'text-base font-semibold mt-2 mb-2',
        6: 'text-sm font-semibold mt-2 mb-2',
      };
      const cls = sizes[block.level] ?? sizes[3];
      const inner = block.children.map((c, i) => renderInline(c, i));
      if (block.level === 1) return <h1 key={key} className={cls}>{inner}</h1>;
      if (block.level === 2) return <h2 key={key} className={cls}>{inner}</h2>;
      if (block.level === 3) return <h3 key={key} className={cls}>{inner}</h3>;
      if (block.level === 4) return <h4 key={key} className={cls}>{inner}</h4>;
      if (block.level === 5) return <h5 key={key} className={cls}>{inner}</h5>;
      return <h6 key={key} className={cls}>{inner}</h6>;
    }
    case 'list': {
      const items = block.children.map((li, i) => (
        <li key={i} className="mb-1">
          {li.children.map((c, j) => renderInline(c, j))}
        </li>
      ));
      return block.format === 'ordered' ? (
        <ol key={key} className="list-decimal pl-6 mb-3">{items}</ol>
      ) : (
        <ul key={key} className="list-disc pl-6 mb-3">{items}</ul>
      );
    }
    case 'quote':
      return (
        <blockquote key={key} className="border-l-2 border-accent pl-4 italic my-3 opacity-90">
          {block.children.map((c, i) => renderInline(c, i))}
        </blockquote>
      );
    case 'code':
      return (
        <pre key={key} className="bg-black/5 rounded p-3 my-3 overflow-x-auto text-sm">
          <code>{block.children.map((c, i) => renderInline(c, i))}</code>
        </pre>
      );
    case 'image': {
      const src = absoluteUrl(block.image.url);
      const alt = block.image.alternativeText ?? '';
      return (
        <figure key={key} className="my-4">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="rounded-md max-w-full h-auto"
            width={block.image.width}
            height={block.image.height}
          />
          {block.image.caption && (
            <figcaption className="text-xs opacity-70 mt-1">{block.image.caption}</figcaption>
          )}
        </figure>
      );
    }
    default:
      return null;
  }
}

export function FaqAnswerBlocks({ blocks }: { blocks: AnswerBlock[] }) {
  return <>{blocks.map((b, i) => renderBlock(b, i))}</>;
}
