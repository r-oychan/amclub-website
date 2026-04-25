import type { TeamMember } from '../../lib/types';

export function TeamGrid({
  heading,
  members,
}: {
  heading: string;
  members: TeamMember[];
}) {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">{heading}</h2>
        <div className={`grid grid-cols-2 md:grid-cols-3 ${members.length > 6 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-8`}>
          {members.map((member) => (
            <div key={member.name} className="text-center">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center text-3xl font-heading">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
              )}
              <h3 className="font-bold text-sm mb-1">{member.name}</h3>
              <p className="text-xs text-text-light">{member.role}</p>
              {member.bio && (
                <p className="text-xs text-text-light mt-2 max-w-xs mx-auto">{member.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
