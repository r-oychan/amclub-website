import type { TeamMember } from '../../lib/types';

const STRIPE_PLACEHOLDER =
  'repeating-linear-gradient(135deg, rgba(0,30,98,0.08) 0 1px, transparent 1px 8px)';

export function TeamGrid({
  heading,
  members,
  variant = 'dark',
}: {
  heading: string;
  members: TeamMember[];
  variant?: 'dark' | 'light';
}) {
  const isDark = variant === 'dark';

  return (
    <section className={`py-16 md:py-24 ${isDark ? 'bg-primary text-white' : 'bg-bg text-primary'}`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className={`font-heading italic text-center mb-12 md:mb-16 ${isDark ? 'text-white' : 'text-primary'}`}
          style={{ fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          {heading}
        </h2>
        <div
          className={`grid grid-cols-2 md:grid-cols-3 ${
            members.length > 6 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'
          } gap-y-12 gap-x-6`}
        >
          {members.map((member) => (
            <div key={member.name} className="text-center">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full mx-auto mb-5 object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={`w-28 h-28 md:w-32 md:h-32 rounded-full mx-auto mb-5 flex items-center justify-center ${
                    isDark ? 'bg-white/15 text-white text-3xl font-heading' : ''
                  }`}
                  style={!isDark ? { background: STRIPE_PLACEHOLDER } : undefined}
                >
                  {isDark && member.name.split(' ').map((n) => n[0]).join('')}
                </div>
              )}
              <h3
                className={`font-body font-bold mb-1 ${isDark ? 'text-white' : 'text-primary'}`}
                style={{ fontSize: '15px', letterSpacing: '-0.01em' }}
              >
                {member.name}
              </h3>
              <p
                className={`${isDark ? 'text-white/80' : 'text-primary/75'}`}
                style={{ fontSize: '13.5px', lineHeight: 1.35 }}
              >
                {member.role}
              </p>
              {member.bio && (
                <p className={`text-xs mt-2 max-w-xs mx-auto ${isDark ? 'text-white/70' : 'text-text-dark/70'}`}>
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
