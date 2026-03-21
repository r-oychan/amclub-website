import { Link } from 'react-router';

export function PromoCell() {
  return (
    <div className="relative">
      {/* Fork & knife icon — centered on top border */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 bg-white px-2">
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
          <h3 className="font-heading text-2xl md:text-3xl font-light italic text-primary mb-3 leading-tight">
            Discover What&rsquo;s Cooking @ The Club
          </h3>
          <p className="text-sm text-text-dark/70 leading-relaxed mb-5">
            Browse the latest dining experiences and seasonal highlights.
          </p>
          <Link
            to="/dining/promotions"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary hover:text-accent transition-colors duration-200"
          >
            View All Dining Promotions
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-accent shrink-0"
            >
              <path
                d="M1 13L13 1M13 1H3M13 1V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
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
