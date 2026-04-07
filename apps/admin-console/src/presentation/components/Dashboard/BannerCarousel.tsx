import React from "react";
import { Carousel } from "antd";

export interface BannerSlide {
  id: string | number;
  logoUrl?: string;
  backgroundImageUrl: string;
  title?: string;
  subtitle?: string;
  tag?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlay?: boolean;
  interval?: number;
  height?: string | number;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  slides,
  autoPlay = true,
  interval = 5000,
  height = 200,
}) => {
  return (
    <div className="group overflow-hidden rounded-[1.5rem] border border-blue-400/20 bg-slate-900 shadow-2xl shadow-blue-900/20 transition-all hover:shadow-blue-900/40">
      <Carousel
        autoplay={autoPlay}
        autoplaySpeed={interval}
        effect="fade"
        dots={{ className: "mb-2" }}
      >
        {slides.map((slide) => (
          <div key={slide.id}>
            <div className="relative w-full" style={{ height }}>
              {/* Background Image with Hover Effect */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] group-hover:scale-110"
                style={{ backgroundImage: `url('${slide.backgroundImageUrl}')` }}
              />

              {/* Subtlest Overlay for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />

              {/* Content Container */}
              <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8">
                {slide.logoUrl && (
                  <img
                    src={slide.logoUrl}
                    alt={slide.title || "Logo"}
                    className="h-20 object-contain transition-transform"
                  />
                )}

                <div className="flex flex-col items-center gap-1">
                  {slide.tag && (
                    <span className="mb-1 text-4xl font-black uppercase tracking-[0.3em] text-white">
                      {slide.tag}
                    </span>
                  )}
                  {slide.title && (
                    <h2 className="m-0 text-xl font-black tracking-tight text-white md:text-6xl">
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="h-px w-12 bg-blue-500/30" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/70 text-center max-w-2xl">
                        {slide.subtitle}
                      </span>
                      <div className="h-px w-12 bg-blue-500/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};
