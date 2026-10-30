import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { INDUSTRIES_DATA } from '../../data/industriesData';
import type { ThemeMode } from '../../types';

interface IndustriesSectionProps {
  theme: ThemeMode;
  onSelectIndustry: (industryId: string) => void;
}

export const IndustriesSection: React.FC<IndustriesSectionProps> = ({
  theme,
  onSelectIndustry,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredIndustries =
    activeCategory === 'all'
      ? INDUSTRIES_DATA
      : INDUSTRIES_DATA.filter((item) => item.id === activeCategory);

  return (
    <section id="industries" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)]">
              <span className="text-xs font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
                TAILORED FOR LOCAL COMMERCE
              </span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground">
              Built for businesses that rely on repeat visits
            </h2>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">
              From neighborhood espresso bars to auto detailers, Loyaltydigitalqr replaces paper punch cards with zero friction.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? theme === 'light'
                    ? 'bg-[#3027F5] text-white'
                    : 'bg-[#E4C174] text-[#11100D]'
                  : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 dark:hover:text-[#F7F3EB]'
              }`}
            >
              All Categories
            </button>
            {INDUSTRIES_DATA.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => setActiveCategory(ind.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === ind.id
                    ? theme === 'light'
                      ? 'bg-[#3027F5] text-white'
                      : 'bg-[#E4C174] text-[#11100D]'
                    : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 dark:hover:text-[#F7F3EB]'
                }`}
              >
                {ind.title.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Industry Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIndustries.map((ind) => (
            <div
              key={ind.id}
              onClick={() => onSelectIndustry(ind.id)}
              className="group cursor-pointer rounded-3xl bg-card border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.22)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Banner */}
              <div className="relative h-48 overflow-hidden bg-black/10">
                <img
                  src={ind.image}
                  alt={ind.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-white/90 dark:bg-[#1A1916]/90 border border-transparent dark:border-[rgba(228,193,116,0.3)] backdrop-blur-md text-[#111318] dark:text-[#E4C174]">
                    {ind.badge}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-xs font-mono text-white/90">
                    Typical setup: {ind.stampsRequired} visits
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-black text-xl text-foreground group-hover:text-[#3027F5] dark:group-hover:text-[#E4C174] transition-colors">
                    {ind.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {ind.subtitle}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-muted border border-black/5 dark:border-[rgba(228,193,116,0.2)]">
                    <div className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                      SAMPLE REWARD
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-0.5">
                      {ind.sampleReward}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {ind.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3027F5] dark:text-[#E4C174] group-hover:translate-x-0.5 transition-transform">
                    <span>Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
