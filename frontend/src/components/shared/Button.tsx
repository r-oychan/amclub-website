import { Link } from 'react-router';

export function Button({
  label,
  href,
  variant = 'primary',
  className = '',
  iconRight,
}: {
  label: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  className?: string;
  iconRight?: React.ReactNode;
}) {
  const base =
    'group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-body text-sm transition-all duration-200 cursor-pointer text-center';
  const variants = {
    primary: 'bg-accent text-white font-bold hover:bg-accent/90',
    secondary: 'bg-primary text-white font-bold hover:bg-primary-dark',
    outline: 'border-2 border-white text-white font-bold hover:bg-white/10',
    white: 'bg-white text-primary font-normal hover:bg-white/90',
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  const content = (
    <>
      <span>{label}</span>
      {iconRight}
    </>
  );

  if (href && (href.startsWith('http') || href.startsWith('#'))) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link to={href} className={cls}>
        {content}
      </Link>
    );
  }
  return <button className={cls}>{content}</button>;
}
