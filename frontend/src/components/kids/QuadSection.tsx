import { useEffect, useRef, useState } from 'react';
import { ThreeColGrid } from '../blocks/ThreeColGrid';
import type { ThreeColItem } from '../blocks/ThreeColGrid';

/* ─── SVG Decoration Shapes ──────────────────────────────────── */

function TealSwirl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42.842 33.795" className={className} aria-hidden="true">
      <path
        d="M 37.843 13.003 C 38.105 14.518 38.065 16.295 37.717 18.33 C 37.368 20.365 36.656 22.334 35.591 24.238 C 33.031 28.798 29.178 31.757 24.032 33.115 C 18.892 34.474 13.903 33.797 9.07 31.08 C 4.738 28.647 1.748 25.248 0.087 20.9 C -0.151 20.274 0.112 19.567 0.713 19.269 L 5.162 17.042 C 5.894 16.674 6.762 17.088 6.974 17.881 L 6.974 17.896 C 7.818 21.022 9.661 23.38 12.499 24.975 C 15.337 26.571 18.311 26.92 21.421 26.016 C 24.532 25.112 26.905 23.198 28.552 20.269 C 29.561 18.472 30.102 16.639 30.167 14.775 C 30.203 13.785 29.178 13.109 28.294 13.553 L 26.027 14.694 C 25.39 15.013 24.613 14.755 24.29 14.119 L 22.194 9.948 C 21.876 9.311 22.133 8.534 22.77 8.211 L 38.888 0.136 C 39.525 -0.182 40.3 0.076 40.62 0.712 L 42.706 4.868 C 43.024 5.504 42.766 6.282 42.13 6.605 L 37.888 8.736 C 37.343 9.006 37.063 9.622 37.217 10.21 C 37.454 11.089 37.661 12.018 37.828 13.003"
        fill="#52C1B1"
      />
    </svg>
  );
}

function TealSwirlFlipped({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 39.853 31.437" className={className} aria-hidden="true">
      <path
        d="M 35.203 12.096 C 35.447 13.505 35.409 15.158 35.085 17.051 C 34.761 18.944 34.099 20.776 33.108 22.547 C 30.726 26.789 27.142 29.541 22.355 30.805 C 17.574 32.069 12.933 31.439 8.437 28.912 C 4.407 26.648 1.626 23.487 0.081 19.442 C -0.14 18.86 0.104 18.202 0.663 17.925 L 4.802 15.853 C 5.483 15.511 6.291 15.896 6.488 16.633 L 6.488 16.647 C 7.272 19.555 8.987 21.749 11.627 23.233 C 14.267 24.717 17.033 25.041 19.927 24.201 C 22.821 23.36 25.028 21.58 26.56 18.855 C 27.499 17.183 28.002 15.478 28.063 13.744 C 28.096 12.824 27.142 12.194 26.32 12.608 L 24.211 13.669 C 23.619 13.965 22.896 13.726 22.595 13.134 L 20.646 9.254 C 20.35 8.662 20.589 7.938 21.181 7.638 L 36.175 0.127 C 36.768 -0.169 37.488 0.07 37.786 0.662 L 39.726 4.528 C 40.022 5.12 39.783 5.843 39.191 6.144 L 35.245 8.126 C 34.738 8.378 34.477 8.95 34.62 9.498 C 34.841 10.315 35.034 11.18 35.189 12.096"
        fill="#52C1B1"
      />
    </svg>
  );
}

function CoralZigzag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30.42 34.271" className={className} aria-hidden="true">
      <path
        d="M 3.197 15.144 L 13.21 29.146 L 15.631 32.531 C 16.966 34.401 19.567 34.83 21.438 33.495 L 28.68 28.319 C 30.55 26.984 30.979 24.383 29.644 22.513 C 28.309 20.643 25.708 20.214 23.837 21.549 L 22.518 22.492 C 20.648 23.828 18.05 23.396 16.712 21.528 L 11.541 14.296 C 10.205 12.426 10.637 9.828 12.505 8.49 L 13.825 7.547 C 15.695 6.212 16.124 3.611 14.789 1.74 C 13.454 -0.13 10.853 -0.559 8.982 0.776 L 1.74 5.952 C -0.13 7.287 -0.559 9.888 0.776 11.758 Z"
        fill="#EB6953"
      />
    </svg>
  );
}

function YellowHook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 37.017 24.242" className={className} aria-hidden="true">
      <path
        d="M 6.202 19.758 C 10.049 23.032 15.157 24.636 20.214 24.159 C 25.132 23.694 29.578 21.344 32.735 17.543 C 35.892 13.741 37.383 8.941 36.941 4.024 L 36.941 3.985 C 36.873 2.902 36.363 1.899 35.499 1.147 C 34.526 0.308 33.252 -0.099 31.973 0.02 C 29.472 0.256 27.627 2.482 27.863 4.988 L 27.891 5.291 C 27.991 7.663 27.206 9.962 25.664 11.784 C 24.075 13.671 21.807 14.855 19.351 15.081 C 16.889 15.317 14.473 14.588 12.544 13.035 C 10.626 11.487 9.404 9.295 9.101 6.855 L 9.09 6.76 C 9.09 6.726 9.078 6.659 9.073 6.603 C 9.067 6.547 9.062 6.508 9.062 6.508 L 9.062 6.485 C 8.686 4.108 6.522 2.426 4.127 2.656 C 1.778 2.88 -0.033 4.899 0 7.254 C 0 7.304 0.012 7.523 0.017 7.612 C 0.331 12.322 2.524 16.634 6.196 19.758 Z"
        fill="#FFC71E"
      />
    </svg>
  );
}

function CoralTeardrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28.469 35.992" className={className} aria-hidden="true">
      <path
        d="M 25.313 35.273 L 25.306 35.273 C 22.903 36.675 19.451 36.066 17.978 33.112 C 17.421 31.998 17.225 30.715 17.519 29.503 C 17.657 28.927 17.768 28.324 17.853 27.709 C 18.358 23.936 17.677 20.537 15.817 17.505 C 15.699 17.315 15.568 17.138 15.443 16.955 C 15.319 16.772 15.201 16.588 15.07 16.405 C 12.935 13.563 10.021 11.689 6.327 10.773 C 5.724 10.622 5.128 10.511 4.539 10.425 C 3.301 10.249 2.188 9.6 1.349 8.677 C -0.858 6.227 -0.163 2.789 2.031 1.073 L 2.031 1.06 L 2.044 1.06 C 3.046 0.281 4.356 -0.145 5.849 0.045 C 6.831 0.169 7.827 0.359 8.829 0.608 C 15.194 2.187 20.106 5.795 23.577 11.421 C 27.54 16.713 29.098 22.6 28.24 29.104 C 28.103 30.125 27.913 31.121 27.671 32.084 C 27.304 33.538 26.426 34.605 25.339 35.253 C 25.339 35.253 25.339 35.267 25.333 35.273 Z"
        fill="#EB6953"
      />
    </svg>
  );
}

function PurplePill({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 19.942" className={className} aria-hidden="true">
      <path
        d="M 9.463 16.899 C 8.43 19.408 5.558 20.604 3.049 19.57 L 3.043 19.568 C 0.534 18.534 -0.662 15.662 0.372 13.153 L 4.537 3.043 C 5.57 0.534 8.442 -0.662 10.951 0.372 L 10.957 0.374 C 13.466 1.408 14.662 4.28 13.628 6.788 Z"
        fill="#311B43"
      />
    </svg>
  );
}

/* ─── Quad Venue Data ────────────────────────────────────────── */

const QUAD_VENUES: ThreeColItem[] = [
  {
    heading: 'The Quad Poolside',
    description: 'A safe, imaginative play space perfect for curious kids below 6 years old.',
    image: '/uploads/pages/kids/quadpoolside.jpeg',
    imageAlt: 'The Quad Poolside',
    cta: { label: 'Learn More', href: '/kids/the-quad-poolside' },
  },
  {
    heading: 'The Quad',
    description: 'A dynamic play zone packed with arcade games, interactive challenges, and endless fun for kids 6 years old and above.',
    image: '/uploads/pages/kids/quad-card.jpeg',
    imageAlt: 'The Quad',
    cta: { label: 'Learn More', href: '/kids/the-quad' },
  },
  {
    heading: 'The Quad Studios',
    description: "Where learning meets celebration \u2013 home to kids' recreational classes and a versatile party space for their most special moments.",
    image: '/uploads/pages/kids/quadstudio.jpeg',
    imageAlt: 'The Quad Studios',
    cta: { label: 'Learn More', href: '/kids/the-quad-studios' },
  },
];

/* ─── Component ──────────────────────────────────────────────── */

export function QuadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 bg-white overflow-hidden">
      <div className="relative">
        {/* ── Decoration + Logo Area (overlays cards) ───────────── */}
        <div className="pointer-events-none absolute left-1/2 top-[-5px] z-20 w-[400px] h-[240px] -translate-x-1/2">
          {/* Central Quad logo */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-[105px] h-[105px] rounded-full bg-[#FEB700] flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="/uploads/pages/kids/quad.png"
                alt=""
                className="w-[78%] h-[78%] object-contain"
              />
            </div>
          </div>

          {/* SVG Decorations — scattered around the badge to mirror the
              Framer prototype: organic distances, not stuck to corners. */}

          {/* Top-center, slightly left: coral zigzag */}
          <div
            className="absolute top-[8%] left-[40%] w-[28px] transition-all duration-1000 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'rotate(0deg)' : 'rotate(30deg)',
              transitionDelay: '200ms',
            }}
          >
            <CoralZigzag />
          </div>

          {/* Top-right: teal swirl */}
          <div
            className="absolute top-[12%] right-[18%] w-[34px] transition-all duration-1000 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'rotate(0deg)' : 'rotate(-25deg)',
              transitionDelay: '0ms',
            }}
          >
            <TealSwirl />
          </div>

          {/* Far-left, upper-middle: small purple pill */}
          <div
            className="absolute top-[33%] left-[6%] w-[14px] transition-all duration-1000 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'rotate(110deg)' : 'rotate(85deg)',
              transitionDelay: '300ms',
            }}
          >
            <PurplePill />
          </div>

          {/* Right side, middle: coral teardrop */}
          <div
            className="absolute top-[48%] right-[6%] w-[24px] transition-all duration-1000 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'rotate(-90deg)' : 'rotate(-115deg)',
              transitionDelay: '250ms',
            }}
          >
            <CoralTeardrop />
          </div>

          {/* Lower-left: teal swirl flipped */}
          <div
            className="absolute top-[68%] left-[18%] w-[30px] transition-all duration-1000 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'rotate(-120deg)' : 'rotate(-145deg)',
              transitionDelay: '100ms',
            }}
          >
            <TealSwirlFlipped />
          </div>

          {/* Lower-right: yellow hook */}
          <div
            className="absolute top-[78%] right-[18%] w-[32px] transition-all duration-1000 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'rotate(0deg)' : 'rotate(-20deg)',
              transitionDelay: '150ms',
            }}
          >
            <YellowHook />
          </div>
        </div>

        {/* ── Three Quad Venue Cards ────────────────────────────── */}
        <div
          className="relative z-10 pt-[115px] transition-all duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '400ms',
          }}
        >
          <ThreeColGrid items={QUAD_VENUES} variant="left" />
        </div>
      </div>
    </section>
  );
}
