import { Link } from 'react-router';

export function Button({
  label,
  href,
  variant = 'primary',
  className = '',
}: {
  label: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  className?: string;
}) {
  const base =
    'inline-block px-6 py-3 rounded-full font-body font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer text-center';
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90',
    secondary: 'bg-primary text-white hover:bg-primary-dark',
    outline: 'border-2 border-white text-white hover:bg-white/10',
    white: 'bg-white text-primary hover:bg-white/90',
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href && (href.startsWith('http') || href.startsWith('#'))) {
    return (
      <a href={href} className={cls}>
        {label}
      </a>
    );
  }
  if (href) {
    return (
      <Link to={href} className={cls}>
        {label}
      </Link>
    );
  }
  return <button className={cls}>{label}</button>;
}
