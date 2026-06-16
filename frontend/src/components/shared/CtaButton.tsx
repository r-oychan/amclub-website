import { Link } from 'react-router';
import { CtaIcon, type CtaIconName } from './CtaIcon';
import { isHardLink } from '../../lib/links';

// A CMS-driven call-to-action link. Mirrors the `shared.link` component so the
// `variant` chosen in /admin actually drives the rendered style (previously the
// detail pages hardcoded a white pill and ignored it).
export interface CtaLink {
  label: string;
  href: string;
  isExternal?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'text' | null;
  bordered?: boolean;
  icon?: CtaIconName | null;
}

const PILL_BASE =
  'inline-flex items-center gap-2 rounded-full uppercase transition-shadow hover:shadow-md self-start';
const PILL_STYLE = {
  padding: '12px 16px 12px 24px',
  fontSize: '13.6px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
} as const;
const TEXT_STYLE = { fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' } as const;

// `primary` (and the unset default) keep the established white pill so existing
// CTAs don't change; the other variants are visually distinct.
function styleFor(variant: CtaLink['variant'], bordered?: boolean) {
  switch (variant) {
    case 'secondary':
      return { cls: `${PILL_BASE} bg-primary text-white`, icon: 'text-white', text: false };
    case 'accent':
      return { cls: `${PILL_BASE} bg-accent text-white`, icon: 'text-white', text: false };
    case 'outline':
      return { cls: `${PILL_BASE} bg-transparent text-primary border-2 border-current`, icon: 'text-accent', text: false };
    case 'text':
      return {
        cls: 'inline-flex items-center gap-2 uppercase text-primary hover:text-accent transition-colors self-start',
        icon: 'text-accent',
        text: true,
      };
    case 'primary':
    default:
      return {
        cls: `${PILL_BASE} bg-white text-primary${bordered ? ' border border-primary/10' : ''}`,
        icon: 'text-accent',
        text: false,
      };
  }
}

export function CtaButton({ cta, className = '' }: { cta: CtaLink; className?: string }) {
  const s = styleFor(cta.variant, cta.bordered);
  const cls = `${s.cls} ${className}`.trim();
  const style = s.text ? TEXT_STYLE : PILL_STYLE;
  const inner = (
    <>
      {cta.label}
      <CtaIcon name={cta.icon ?? 'arrow'} size={20} className={s.icon} />
    </>
  );
  return isHardLink(cta.href, cta.isExternal) ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
      {inner}
    </a>
  ) : (
    <Link to={cta.href} className={cls} style={style}>
      {inner}
    </Link>
  );
}
