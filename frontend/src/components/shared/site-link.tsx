import { Link as RouterLink, type LinkProps } from 'react-router';

/** Request migrated pages from nginx so Vite cannot retain their old SPA view. */
export function Link(props: LinkProps) {
  const path = typeof props.to === 'string' ? props.to.split(/[?#]/)[0] : props.to.pathname ?? '';
  const migrated = /^\/(?:home|about)?\/?$/.test(path) || /^\/dining\/(?!dining-promotion\/?$)[^/]+\/?$/.test(path);
  return <RouterLink {...props} reloadDocument={props.reloadDocument ?? migrated} />;
}
