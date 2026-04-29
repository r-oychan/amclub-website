import { ArrowLink } from '../shared/ArrowLink';

export function PromoCell() {
  return (
    <div className="relative">
      {/* Fork & knife icon — centered on top border, transparent backdrop */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
        <img
          src="/uploads/icons/promo-accent.svg"
          alt=""
          className="w-10 h-10"
        />
      </div>

      {/* Card with dashed border */}
      <div className="border border-accent px-8 py-10 pt-8 flex flex-col md:flex-row items-start gap-6 md:gap-8 bg-bg">
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

        {/* Promo flyer images — stacked/fanned */}
        <div className="relative w-full md:w-[36%] shrink-0 h-[180px] md:h-[200px]">
          <img
            src="/uploads/promotions/canadian-thanksgiving.jpg"
            alt="Dining promotion"
            className="absolute top-0 right-0 w-[55%] shadow-[6px_6px_12px_rgba(0,30,98,0.3)] rotate-3 z-20"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img
            src="/uploads/promotions/nov-food-beverage-specials.jpg"
            alt="Dining promotion"
            className="absolute top-4 right-[30%] w-[55%] shadow-[10px_5px_9px_rgba(0,30,98,0.17)] -rotate-2 z-10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
