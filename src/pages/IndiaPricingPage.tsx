import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { Link, useRouter } from '../router';
import type { ThemeMode } from '../types';

interface IndiaPricingPageProps {
  theme: ThemeMode;
  onOpenCardBuilder: () => void;
}

export const IndiaPricingPage: React.FC<IndiaPricingPageProps> = ({
  theme,
  onOpenCardBuilder: _onOpenCardBuilder,
}) => {
  const { navigate } = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = [
    '30 days completely free trial',
    'No credit card required to get started',
    'Custom digital loyalty card for your business',
    'Print-ready PDF counter display & QR kit',
    'Unlimited customer visits and joins',
    'Staff PIN stamp validation system',
    'Customer retention & visit analytics',
    'Apple Wallet & Google Wallet pass support',
    'Mobile browser access — no app required',
    'Standard email & customer support',
  ];

  const faqs = [
    {
      q: 'Does the 30-day free trial require a credit card or payment info?',
      a: 'No. You can create your branded loyalty card, download your counter QR standee, and reward your customers immediately without providing any credit card, debit card, or payment details.',
    },
    {
      q: 'How does billing work after 30 days?',
      a: 'If you choose to continue after your 30-day free trial, the subscription is ₹299/month. There are no setup fees, hidden charges, or long-term lock-in.',
    },
    {
      q: 'Do customers need to download an app?',
      a: 'No. When customers scan your QR standee using their phone camera, their loyalty card opens in their mobile browser instantly. They can also save it to Google Wallet or Apple Wallet with one tap.',
    },
    {
      q: 'Do I need special POS hardware or billing software integration?',
      a: 'None at all. Loyaltydigitalqr operates completely independently alongside your existing cash register, UPI QR stand, or POS terminal. Your staff simply enters a 4-digit PIN on the customer’s phone to validate visits.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes. You can cancel your subscription at any time. There are no cancellation fees or lock-in contracts.',
    },
  ];

  const handleStartTrial = () => {
    navigate('/signup?region=india&plan=starter');
  };

  return (
    <div className="py-12 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Region Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs font-mono uppercase tracking-wider text-[#60646C] dark:text-[#AAA499]">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/pricing" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
              Pricing
            </Link>
            <span>/</span>
            <span className="text-[#111318] dark:text-[#F7F3EB] font-bold">India</span>
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E6DE]/60 dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)] hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors text-[11px]"
          >
            <Globe className="w-3 h-3 text-[#3027F5] dark:text-[#E4C174]" />
            <span>Change Region</span>
          </Link>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)] shadow-xs">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#3027F5] dark:text-[#E4C174] uppercase">
              INDIA · INR
            </span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] leading-[1.08]">
            Simple, affordable India pricing.
          </h1>

          <p className="mt-4 text-base sm:text-xl text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
            Everything your business needs to build repeat customer loyalty. Single monthly plan, zero hidden fees.
          </p>
        </div>

        {/* Single Plan Showcase Card */}
        <div className="mt-14 max-w-xl mx-auto">
          <div className="relative rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#3027F5] dark:border-[#E4C174] p-8 sm:p-10 shadow-2xl transition-all">
            
            {/* Header: Starter Plan */}
            <div className="flex items-start justify-between pb-6 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                  STARTER PLAN
                </span>
                <h2 className="font-heading font-black text-2xl text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                  Small Business Edition
                </h2>
                <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
                  Full access for single or multi-counter venues
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="font-heading font-black text-5xl sm:text-6xl text-[#111318] dark:text-[#F7F3EB]">
                    ₹299
                  </span>
                  <span className="text-base font-semibold text-[#60646C] dark:text-[#D0CBC1]">
                    /month
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#3027F5] dark:text-[#E4C174] font-semibold mt-1">
                  BILLED MONTHLY · INR
                </div>
              </div>
            </div>

            {/* Trial Reassurance Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1E1D19] border border-black/5 dark:border-[rgba(228,193,116,0.2)] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0" />
              <div className="text-xs text-[#111318] dark:text-[#F7F3EB]">
                <strong className="font-bold">Zero risk:</strong> 30-day free trial. Test with real customers at your counter before paying anything.
              </div>
            </div>

            {/* Features Checklist */}
            <div className="mt-8 space-y-3.5">
              <div className="text-xs font-mono font-bold tracking-widest text-[#60646C] dark:text-[#AAA499] uppercase mb-4">
                PLATFORM CAPABILITIES INCLUDED:
              </div>

              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-[#111318] dark:text-[#F7F3EB]">
                  <div className="w-5 h-5 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Button */}
            <div className="mt-10">
              <button
                type="button"
                onClick={handleStartTrial}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-[#3027F5]/25'
                    : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-[0_4px_20px_rgba(228,193,116,0.3)]'
                }`}
              >
                <span>Start 30-Day Free Trial</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="mt-3 text-center text-xs text-[#60646C] dark:text-[#AAA499]">
                Instant setup · No credit card required · Cancel anytime
              </div>
            </div>

          </div>
        </div>

        {/* Trial Breakdown Steps */}
        <div className="mt-16 sm:mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              TRIAL DETAILS
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-1">
              How the 30-day free trial works
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
              <div className="w-8 h-8 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center text-sm font-bold text-[#3027F5] dark:text-[#E4C174] mb-3">
                1
              </div>
              <h4 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
                Create your card
              </h4>
              <p className="mt-2 text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
                Choose your reward milestone and upload your branding. Instant 3-minute setup without a card.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
              <div className="w-8 h-8 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center text-sm font-bold text-[#3027F5] dark:text-[#E4C174] mb-3">
                2
              </div>
              <h4 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
                Print your counter stand
              </h4>
              <p className="mt-2 text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
                Download your PDF counter kit. Place it by your counter or UPI QR for customers to scan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
              <div className="w-8 h-8 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center text-sm font-bold text-[#3027F5] dark:text-[#E4C174] mb-3">
                3
              </div>
              <h4 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
                Decide after 30 days
              </h4>
              <p className="mt-2 text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
                Enjoy 30 days of real customer visits. If you like the results, continue for ₹299/month.
              </p>
            </div>
          </div>
        </div>

        {/* Concise FAQ Accordion */}
        <div className="mt-16 sm:mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              COMMON QUESTIONS
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-1">
              India Pricing FAQ
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-4 px-6 flex items-center justify-between text-left text-sm sm:text-base font-bold text-[#111318] dark:text-[#F7F3EB] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#60646C] dark:text-[#AAA499] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] leading-relaxed border-t border-black/5 dark:border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Region Switcher Banner */}
        <div className="mt-16 max-w-3xl mx-auto text-center p-6 rounded-2xl bg-[#F0EEE6] dark:bg-[#141412] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)]">
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1]">
            Operating in the United States?{' '}
            <Link
              href="/usa"
              className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline"
            >
              View US pricing ($10/month) →
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
