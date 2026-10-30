import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FAQ_DATA } from '../../data/faqData';
import type { ThemeMode } from '../../types';

interface FaqSectionProps {
  theme?: ThemeMode;
}

export const FaqSection: React.FC<FaqSectionProps> = () => {
  const [openIds, setOpenIds] = useState<string[]>(['no-app', 'no-pos']);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)]">
            <span className="text-xs font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
              GOT QUESTIONS?
            </span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#60646C] dark:text-[#D0CBC1]">
            Everything you need to know about setting up your digital loyalty program.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3.5">
          {FAQ_DATA.map((item) => {
            const isOpen = openIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white dark:bg-[#141412] border-[#3027F5]/40 dark:border-[#E4C174]/40 shadow-md'
                    : 'bg-[#F8F7F2] dark:bg-[#111110] border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] hover:border-black/20 dark:hover:border-[rgba(228,193,116,0.3)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  <span className="font-heading font-bold text-base sm:text-lg text-[#111318] dark:text-[#F7F3EB]">
                    {item.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      isOpen
                        ? 'bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D]'
                        : 'bg-black/5 dark:bg-white/5 text-[#60646C] dark:text-[#AAA499]'
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-[#60646C] dark:text-[#D0CBC1] leading-relaxed border-t border-black/5 dark:border-white/5 animate-in fade-in duration-150">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
