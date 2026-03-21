import { useState } from 'react';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { Button } from '../components/shared/Button';

const CATEGORIES = ['All', 'Dining', 'Kids', 'Thinkspace', 'Fitness & Wellness', 'Member Engagement'];

const EVENTS = [
  { category: 'Dining', title: "Smokin' Sundays at Grillhouse", date: 'OCT 11', image: 'https://framerusercontent.com/images/PlDsZH1QChc2aIXh0p9duml4TC0.jpeg' },
  { category: 'Kids', title: 'Scarily Fun Friday Nights for the Kids!', date: 'OCT 19', image: 'https://framerusercontent.com/images/JkrDtEpbLxJMTiPrF9mJYWb3YQ.jpeg' },
  { category: 'Dining', title: 'Kanonkop Wine Dinner', date: 'OCT 22', image: 'https://framerusercontent.com/images/0YNsQiaf0KR8LDUah35vR09jfwc.jpg' },
  { category: 'Dining', title: 'Get Your Green Fix Salad Bar Buffet', date: 'OCT 30', image: 'https://framerusercontent.com/images/rNT1Hh6hiX6cJHoJGmlFogBGWmU.jpg' },
  { category: 'Fitness & Wellness', title: 'Pedal to Victory! A Spin Bike Time Challenge', date: 'NOV 5', image: 'https://framerusercontent.com/images/ToMfql1ukRrZhj1CjpLEOHmCb4.jpeg' },
  { category: 'Member Engagement', title: 'Classic & Contemporary: A Cocktail Masterclass Series', date: 'NOV 7', image: 'https://framerusercontent.com/images/A9M0VHDW2FE6UoaFatzINqucGp0.jpg' },
  { category: 'Dining', title: 'Nostalgic Flavors of Singapore', date: 'DEC 4', image: 'https://framerusercontent.com/images/RjIIikrBuOoQmOLuWXcoR6GFkOE.jpeg' },
  { category: 'Kids', title: 'National Football League 2025 Live Screening', date: 'DEC 20', image: 'https://framerusercontent.com/images/MlqKdegxMYfk5tpETtAaDIaV2w.jpg' },
  { category: 'Fitness & Wellness', title: 'Adult Team Tennis Challenge 2025', date: 'DEC 30', image: 'https://framerusercontent.com/images/FZCLsivFTgvRBOrZD71tlU6pVRc.jpg' },
];

export default function WhatsOnPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? EVENTS
    : EVENTS.filter((e) => e.category === activeCategory);

  return (
    <>
      <Hero
        heading="Where Community Comes Together"
        subheading="Experience year-round events that bring our vibrant community together."
        variant="compact"
      />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary text-center mb-8">
            Featured Club Events
          </h2>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-bg text-text-dark hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Event grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((event, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-bg shadow-md hover:shadow-lg transition-shadow">
                {event.image && (
                  <div className="h-52 overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-block bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                      {event.date}
                    </span>
                    <span className="text-xs text-secondary font-bold uppercase tracking-wide">
                      {event.category}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary">{event.title}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button label="Browse All Events" variant="secondary" />
          </div>
        </div>
      </section>

      <CtaBanner
        heading="Join the Celebration"
        body="Become a Member and enjoy access to exclusive events \u2013 from relaxed socials to our signature annual celebrations."
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Tour' },
        ]}
      />
    </>
  );
}
