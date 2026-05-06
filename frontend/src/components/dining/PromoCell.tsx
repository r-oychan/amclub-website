import { ArrowLink } from '../shared/ArrowLink';

// Match the Framer "Discover What's Cooking" card layout:
// - bg-white card on the F5F4F2 page bg
// - thin pink horizontal divider sitting on the card's top edge
// - fork & knife icon badge centered on the divider
// - 3-flyer fan on the right (one base + two rotated overlays)
export function PromoCell() {
  return (
    <div className="relative bg-white px-8 md:px-12 pt-12 pb-10 md:pb-12">
      {/* Top pink divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-accent" />

      {/* Fork & knife icon badge — sits on the divider, white square cuts the line */}
      <div className="absolute -top-[21px] left-1/2 -translate-x-1/2 z-10 bg-white p-[5px]">
        <img
          src="/icons/promo-accent.svg"
          alt=""
          className="w-[33px] h-[33px] block"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-6">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-[28.8px] font-normal italic text-accent leading-[1.1] tracking-[-0.02em] mb-3">
            Discover What&rsquo;s Cooking @ The Club
          </h3>
          <p className="text-[17.6px] font-light leading-[1.4] text-primary mb-5">
            Browse the latest dining experiences and seasonal highlights.
          </p>
          <ArrowLink label="View All Dining Promotions" href="/dining/promotions" icon="arrow" />
        </div>

        {/* Flyer fan — Framer arrangement, 145×168 container */}
        <div className="relative shrink-0 w-[200px] h-[200px] md:w-[145px] md:h-[168px]">
          {/* Base flyer (no rotation, leftmost) */}
          <img
            src="/promotions/promo-3.jpg"
            alt=""
            className="absolute top-0 left-0 w-[107px] h-[152px] object-cover shadow-[0_4px_12px_rgba(0,30,98,0.18)]"
          />
          {/* Middle flyer (+11deg, slight right/down) */}
          <img
            src="/promotions/promo-2.jpg"
            alt=""
            className="absolute top-[10px] left-[13px] w-[108px] h-[152px] object-cover shadow-[0_6px_14px_rgba(0,30,98,0.22)]"
            style={{ transform: 'rotate(11deg)', zIndex: 2 }}
          />
          {/* Top flyer (+21deg, far right) */}
          <img
            src="/promotions/canadian-thanksgiving.jpg"
            alt=""
            className="absolute top-[21px] left-[55px] md:left-[40px] w-[102px] h-[146px] object-cover shadow-[0_8px_18px_rgba(0,30,98,0.28)]"
            style={{ transform: 'rotate(21deg)', zIndex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
