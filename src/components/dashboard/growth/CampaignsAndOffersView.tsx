import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  MessageSquare,
  Star,
  ExternalLink,
  Clock,
  X,
  Share2,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type {
  Offer,
  OfferType,
  CustomerSegment,
  CustomerFeedback,
  CampaignRunRecord,
  FeedbackRating,
} from '../../../types/growth';
import { growthService } from '../../../services/growthService';
import { loyaltyService } from '../../../services/loyaltyService';
import { localDateKey } from '../../../utils/dates';

interface CampaignsAndOffersViewProps {
  business: Business;
  theme: ThemeMode;
}

type TabType = 'offers' | 'segments' | 'winback' | 'feedback';

export const CampaignsAndOffersView: React.FC<CampaignsAndOffersViewProps> = ({
  business,
  theme: _theme,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [campaignRuns, setCampaignRuns] = useState<CampaignRunRecord[]>([]);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  // Modal states
  const [createOfferModalOpen, setCreateOfferModalOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [winbackWizardOpen, setWinbackWizardOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [publicReviewLinkModalOpen, setPublicReviewLinkModalOpen] = useState(false);

  // New offer form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<OfferType>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState('15');
  const [newMinSpend, setNewMinSpend] = useState('0');
  const [newStartDate, setNewStartDate] = useState(localDateKey());
  const [newEndDate, setNewEndDate] = useState(
    localDateKey(new Date(Date.now() + 30 * 86400000))
  );
  const [newMaxRedemptions, setNewMaxRedemptions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Redeem modal state
  const [selectedOfferForRedeem, setSelectedOfferForRedeem] = useState<Offer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // Winback wizard state
  const [inactivityDays, setInactivityDays] = useState(30);
  const [winbackChannel, setWinbackChannel] = useState<'email' | 'sms'>('email');
  const [selectedWinbackOfferId, setSelectedWinbackOfferId] = useState('');
  const [winbackSuccess, setWinbackSuccess] = useState<string | null>(null);

  // Feedback test form state
  const [testCustomerName, setTestCustomerName] = useState('');
  const [testRating, setTestRating] = useState<number>(5);
  const [testComment, setTestComment] = useState('');
  const [testServiceType] = useState<'cafe' | 'salon' | 'retail' | 'gym' | 'carwash' | 'service' | 'general'>('general');

  // Review link config state
  const [customReviewUrl, setCustomReviewUrl] = useState('');

  // Currency
  const currencySymbol = business.currency === 'INR' ? '₹' : '$';

  // Load and subscribe
  const refreshData = () => {
    setOffers(growthService.getOffers(business.id));
    setSegments(growthService.getSegments(business.id));
    setFeedbackList(growthService.getFeedbacks(business.id));
    setCampaignRuns(growthService.getCampaignRuns(business.id));
    const cfg = growthService.getFeedbackConfig(business.id);
    setCustomReviewUrl(cfg.publicReviewUrl || 'https://maps.google.com/?cid=10842918');
  };

  useEffect(() => {
    refreshData();
    const unsub = growthService.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, [business.id]);

  const allCustomers = loyaltyService.getCustomers(business.id);

  // Handle Offer Creation
  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const discountVal = parseFloat(newDiscountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    if (newType === 'percentage' && discountVal > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    const minSpendVal = parseFloat(newMinSpend);
    const minSpendMinor = isNaN(minSpendVal) ? undefined : Math.round(minSpendVal * 100);
    const discountValMinor = newType === 'fixed_amount' ? Math.round(discountVal * 100) : discountVal;
    const maxRedemptions = newMaxRedemptions ? parseInt(newMaxRedemptions, 10) : undefined;

    const result = growthService.createOffer({
      businessId: business.id,
      name: newTitle.trim(),
      description: newDescription.trim(),
      code: newCode.trim().toUpperCase(),
      offerType: newType,
      discountValue: discountValMinor,
      minimumSpendMinor: minSpendMinor,
      startDate: newStartDate,
      endDate: newEndDate,
      totalRedemptionLimit: maxRedemptions,
      perCustomerLimit: 1,
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to create offer.');
      return;
    }

    setBannerFeedback(`Offer "${result.offer?.code}" created and activated.`);
    setCreateOfferModalOpen(false);
    resetOfferForm();
    setTimeout(() => setBannerFeedback(null), 3000);
  };

  const resetOfferForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewCode('');
    setNewType('percentage');
    setNewDiscountValue('15');
    setNewMinSpend('0');
    setNewMaxRedemptions('');
    setFormError(null);
  };

  // Handle Offer Toggle Status
  const handleToggleStatus = (offer: Offer) => {
    const nextStatus = offer.status === 'active' ? 'paused' : 'active';
    growthService.updateOffer(business.id, offer.id, { status: nextStatus });
    setBannerFeedback(`Offer ${offer.code} status changed to ${nextStatus}.`);
    setTimeout(() => setBannerFeedback(null), 3000);
  };

  // Handle Offer Redemption
  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);

    if (!selectedOfferForRedeem) {
      setRedeemError('Please select an active offer to redeem.');
      return;
    }

    const matchedCustomer = allCustomers.find(
      (c) =>
        c.id.toLowerCase() === customerSearchQuery.trim().toLowerCase() ||
        c.name.toLowerCase().includes(customerSearchQuery.trim().toLowerCase()) ||
        (c.phoneNumber && c.phoneNumber.includes(customerSearchQuery.trim()))
    );

    if (!matchedCustomer) {
      setRedeemError('Customer not found. Please enter a valid customer ID, name, or phone.');
      return;
    }

    const result = growthService.redeemOffer(business.id, {
      businessId: business.id,
      offerCodeOrId: selectedOfferForRedeem.code,
      customerId: matchedCustomer.id,
      customerName: matchedCustomer.name,
    });

    if (!result.success) {
      setRedeemError(result.error || 'Redemption rejected.');
      return;
    }

    const savings = result.redemption
      ? `${currencySymbol}${(result.redemption.amountSavedMinor / 100).toFixed(2)}`
      : 'Savings';
    setRedeemSuccess(
      `Successfully redeemed offer ${selectedOfferForRedeem.code} for ${matchedCustomer.name}! Saved ${savings}.`
    );
    setTimeout(() => {
      setRedeemModalOpen(false);
      setRedeemSuccess(null);
      setSelectedOfferForRedeem(null);
    }, 2000);
  };

  // Build and download the win-back audience (opted-in contacts only)
  const handleLaunchWinback = () => {
    setWinbackSuccess(null);
    const result = growthService.simulateWinBackCampaign(business.id, {
      businessId: business.id,
      name: `Win-Back Campaign (${inactivityDays}d Dormant)`,
      inactivityDays,
      channel: winbackChannel,
      offerId: selectedWinbackOfferId || undefined,
      customMessage: 'We miss you at the counter! Here is an exclusive offer for your next visit.',
    });

    if (!result.success) {
      alert(result.error);
      return;
    }

    const audience = growthService.evaluateAudience(
      business.id,
      { criteriaType: 'inactive_dormant', inactivityDays },
      winbackChannel
    );
    const offerCode = offers.find((o) => o.id === selectedWinbackOfferId)?.code || '';
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      'Name,Phone,Email,Last visit,Offer code',
      ...audience.map((c) =>
        [c.name, c.phoneNumber || '', c.email || '', c.lastVisitAt ? c.lastVisitAt.slice(0, 10) : '', offerCode]
          .map((v) => esc(String(v)))
          .join(',')
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `win-back-${inactivityDays}d-${winbackChannel}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setWinbackSuccess(
      `Downloaded ${result.campaignRun?.targetAudienceCount} opted-in contacts.`
    );
    setTimeout(() => {
      setWinbackWizardOpen(false);
      setWinbackSuccess(null);
    }, 3000);
  };

  // Handle Feedback Submission
  const handleCreateTestFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    growthService.submitFeedback({
      businessId: business.id,
      customerName: testCustomerName.trim() || 'Anonymous Customer',
      rating: testRating as FeedbackRating,
      comment: testComment.trim(),
      serviceType: testServiceType,
    });
    setBannerFeedback('Customer feedback submitted and recorded in live review queue.');
    setFeedbackModalOpen(false);
    setTimeout(() => setBannerFeedback(null), 3000);
  };

  // Handle Public Review Link Save
  const handleSaveReviewUrl = (e: React.FormEvent) => {
    e.preventDefault();
    growthService.updateFeedbackConfig(business.id, {
      publicReviewUrl: customReviewUrl.trim(),
    });
    setBannerFeedback('Public review destination updated (unconditional public link).');
    setPublicReviewLinkModalOpen(false);
    setTimeout(() => setBannerFeedback(null), 3000);
  };

  // Evaluation for Winback Preview
  const dormantsAll = allCustomers.filter((c) => {
    if (!c.lastVisitAt) return true;
    return (Date.now() - new Date(c.lastVisitAt).getTime()) / 86400000 >= inactivityDays;
  });
  const withConsent = dormantsAll.filter((c) =>
    winbackChannel === 'email' ? !!c.marketingConsent?.email : !!c.marketingConsent?.sms
  );
  const withoutConsent = dormantsAll.filter((c) =>
    winbackChannel === 'email' ? !c.marketingConsent?.email : !c.marketingConsent?.sms
  );

  // Calculate metrics
  const activeOffersCount = offers.filter((o) => o.status === 'active').length;
  const totalRedemptions = offers.reduce((acc, o) => acc + o.redemptionCount, 0);
  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1)
      : '5.0';

  return (
    <div data-testid="offers-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Feedback */}
      {bannerFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{bannerFeedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            GROWTH & CAMPAIGNS ENGINE
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Campaigns, Offers & Customer Retention
          </h1>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Drive repeat counter visits, win back dormant customers, and maintain reputation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="redeem-offer-btn"
            onClick={() => {
              setRedeemError(null);
              setRedeemSuccess(null);
              setSelectedOfferForRedeem(offers.find((o) => o.status === 'active') || null);
              setRedeemModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs sm:text-sm cursor-pointer shadow-xs inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Redeem Test Terminal</span>
          </button>

          <button
            type="button"
            data-testid="create-offer-btn"
            onClick={() => {
              resetOfferForm();
              setCreateOfferModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm cursor-pointer shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block mb-1">
            ACTIVE PROMOTIONS
          </span>
          <div className="text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {activeOffersCount}
          </div>
          <span className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            {offers.length} total recorded
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block mb-1">
            TOTAL REDEMPTIONS
          </span>
          <div className="text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {totalRedemptions}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Single-use protected
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block mb-1">
            AUDIENCE SEGMENTS
          </span>
          <div className="text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {segments.length}
          </div>
          <span className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            Live from customer visits
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block mb-1">
            CUSTOMER REPUTATION
          </span>
          <div className="text-2xl font-heading font-black text-amber-500 flex items-center gap-1">
            <span>{avgRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
          </div>
          <span className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            {feedbackList.length} verified reviews
          </span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-black/10 dark:border-white/10 gap-2">
        <button
          type="button"
          data-testid="growth-tab-offers"
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2.5 font-heading font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === 'offers'
              ? 'border-[#3027F5] text-[#3027F5] dark:border-[#E4C174] dark:text-[#E4C174]'
              : 'border-transparent text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Active Offers ({offers.length})</span>
        </button>

        <button
          type="button"
          data-testid="growth-tab-segments"
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2.5 font-heading font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === 'segments'
              ? 'border-[#3027F5] text-[#3027F5] dark:border-[#E4C174] dark:text-[#E4C174]'
              : 'border-transparent text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Segments</span>
        </button>

        <button
          type="button"
          data-testid="growth-tab-winback"
          onClick={() => setActiveTab('winback')}
          className={`px-4 py-2.5 font-heading font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === 'winback'
              ? 'border-[#3027F5] text-[#3027F5] dark:border-[#E4C174] dark:text-[#E4C174]'
              : 'border-transparent text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB]'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Win-Back Campaigns</span>
        </button>

        <button
          type="button"
          data-testid="feedback-tab"
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 font-heading font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === 'feedback'
              ? 'border-[#3027F5] text-[#3027F5] dark:border-[#E4C174] dark:text-[#E4C174]'
              : 'border-transparent text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviews & Feedback ({feedbackList.length})</span>
        </button>
      </div>

      {/* TAB 1: Offers List */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const isExpired = new Date(offer.endDate) < new Date();
              const discountLabel =
                offer.offerType === 'percentage'
                  ? `${offer.discountValue}% OFF`
                  : offer.offerType === 'fixed_amount'
                  ? `${currencySymbol}${(offer.discountValue / 100).toFixed(2)} OFF`
                  : offer.offerType === 'loyalty_bonus'
                  ? `+${offer.discountValue} BONUS STAMPS`
                  : `${offer.discountValue}% WIN-BACK`;

              return (
                <div
                  key={offer.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-[#141412] border transition-all flex flex-col justify-between ${
                    offer.status === 'active'
                      ? 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] shadow-xs'
                      : 'border-black/5 dark:border-white/5 opacity-70 bg-[#FBFBF9] dark:bg-[#10100E]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
                        {offer.offerType.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          offer.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {isExpired ? 'EXPIRED' : offer.status}
                      </span>
                    </div>

                    <div>
                      <div className="font-mono text-xl font-black text-[#111318] dark:text-[#F7F3EB] tracking-wider">
                        {offer.code}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-[#3027F5] dark:text-[#E4C174] mt-0.5">
                        {discountLabel}
                      </h4>
                      <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1 line-clamp-2">
                        {offer.description || offer.name}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#181816] text-[11px] text-[#60646C] dark:text-[#AAA499] space-y-1">
                      <div className="flex justify-between">
                        <span>Validity:</span>
                        <span className="font-mono text-[#111318] dark:text-[#F7F3EB]">
                          {offer.startDate} to {offer.endDate}
                        </span>
                      </div>
                      {offer.minimumSpendMinor && offer.minimumSpendMinor > 0 && (
                        <div className="flex justify-between">
                          <span>Min Spend:</span>
                          <span className="font-mono text-[#111318] dark:text-[#F7F3EB]">
                            {currencySymbol}{(offer.minimumSpendMinor / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Redemptions:</span>
                        <span className="font-mono font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {offer.redemptionCount}{' '}
                          {offer.totalRedemptionLimit ? `/ ${offer.totalRedemptionLimit}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(offer)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                        offer.status === 'active'
                          ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                          : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                      }`}
                    >
                      {offer.status === 'active' ? 'Pause Offer' : 'Activate Offer'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOfferForRedeem(offer);
                        setRedeemError(null);
                        setRedeemSuccess(null);
                        setRedeemModalOpen(true);
                      }}
                      disabled={offer.status !== 'active'}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] hover:bg-[#3027F5]/20 disabled:opacity-40 cursor-pointer"
                    >
                      Test Redeem
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Customer Segments */}
      {activeTab === 'segments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-[#111318] dark:text-[#F7F3EB] flex items-start gap-3">
            <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Only customers who opted in</div>
              <p className="text-[#60646C] dark:text-[#AAA499] mt-0.5">
                Segments update automatically from real customer visits. Customers who did not opt in to marketing are never included in exported lists.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((seg) => {
              const matchedList = growthService.evaluateAudience(business.id, {
                criteriaType: seg.criteriaType,
                inactivityDays: seg.inactivityDays,
              });
              const emailConsentCount = matchedList.filter((c) => c.marketingConsent?.email).length;
              const smsConsentCount = matchedList.filter((c) => c.marketingConsent?.sms).length;

              return (
                <div
                  key={seg.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                      {seg.name}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
                      {matchedList.length} customers
                    </span>
                  </div>

                  <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    {seg.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#181816]">
                      <div className="flex items-center gap-1.5 text-xs text-subtle-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Consent</span>
                      </div>
                      <div className="text-lg font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-1">
                        {emailConsentCount} / {matchedList.length}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#181816]">
                      <div className="flex items-center gap-1.5 text-xs text-subtle-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>SMS Consent</span>
                      </div>
                      <div className="text-lg font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-1">
                        {smsConsentCount} / {matchedList.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (seg.inactivityDays) {
                          setInactivityDays(seg.inactivityDays);
                        }
                        setActiveTab('winback');
                      }}
                      className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Launch Targeted Campaign</span>
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Win-Back Campaigns */}
      {activeTab === 'winback' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                  WIN-BACK AUDIENCE
                </span>
                <h3 className="text-lg font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                  Re-Engage Dormant Counter Patrons
                </h3>
                <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                  Find customers who haven't visited in 30–60 days and opted in to marketing, then download the list to message them.
                </p>
              </div>

              <button
                type="button"
                data-testid="launch-winback-btn"
                onClick={() => setWinbackWizardOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm cursor-pointer shadow-sm inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Build win-back list</span>
              </button>
            </div>

            {/* Campaign Execution Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                Messages are not sent from this dashboard. Download the list (CSV) and send it with your own SMS or email tool. Only customers who opted in are included.
              </span>
            </div>

            {/* Past Campaign Run Records */}
            <div>
              <h4 className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB] mb-3">
                Exported Lists ({campaignRuns.length})
              </h4>
              {campaignRuns.length === 0 ? (
                <div className="p-6 text-center text-xs text-subtle-foreground border border-dashed rounded-2xl">
                  No lists exported yet. Click "Build win-back list" above.
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignRuns.map((run) => (
                    <div
                      key={run.id}
                      className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                            {run.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                            {run.channel}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            CSV exported
                          </span>
                        </div>
                        <div className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-1 flex items-center gap-4">
                          <span>Exported: {new Date(run.simulatedAt).toLocaleString()}</span>
                          {run.offerName && (
                            <span>
                              Offer: <strong>{run.offerName}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] font-mono">
                        <div>
                          <span className="text-subtle-foreground">Contacts exported:</span>{' '}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {run.simulatedSentCount}
                          </strong>
                        </div>
                        <div>
                          <span className="text-subtle-foreground">Target Audience:</span>{' '}
                          <strong className="text-zinc-600 dark:text-zinc-400">
                            {run.targetAudienceCount}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Customer Feedback & Reviews */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                  CUSTOMER SENTIMENT & REVIEWS
                </span>
                <h3 className="text-lg font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                  Post-Visit Feedback & Review Request Policy
                </h3>
                <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                  Collect authentic ratings. Public review links are unconditional without rating gating.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPublicReviewLinkModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Configure Public Link</span>
                </button>

                <button
                  type="button"
                  data-testid="submit-test-feedback-btn"
                  onClick={() => setFeedbackModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer Feedback</span>
                </button>
              </div>
            </div>

            {/* Non-Gating Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>
                  <strong>Ethical Review Policy:</strong> Google Business review URL ({customReviewUrl || 'Configured'}) is surfaced transparently to all customers regardless of star rating.
                </span>
              </div>
              <a
                href={customReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold underline flex items-center gap-1 flex-shrink-0"
              >
                <span>Preview Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Feedback List */}
            <div className="space-y-3">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                        {fb.customerName}
                      </span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < fb.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300 dark:text-zinc-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-subtle-foreground">
                        {fb.serviceType}
                      </span>
                    </div>

                    <p className="text-xs text-[#111318] dark:text-[#F7F3EB] font-medium">
                      "{fb.comment}"
                    </p>

                    <div className="text-[10px] text-subtle-foreground font-mono">
                      Received {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        fb.status === 'reviewed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {fb.status}
                    </span>
                    {fb.status === 'new' && (
                      <button
                        type="button"
                        onClick={() => {
                          growthService.updateFeedbackStatus(business.id, fb.id, 'reviewed');
                          refreshData();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[11px] font-bold text-[#111318] dark:text-[#F7F3EB] cursor-pointer"
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Offer */}
      {createOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                  PROMOTION CONFIGURATOR
                </span>
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  Create Promotional Offer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateOfferModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Offer Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Double Stamp Special"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Redemption Promo Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER15"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full font-mono uppercase px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Offer Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as OfferType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed_amount">Fixed Amount ({currencySymbol})</option>
                    <option value="loyalty_bonus">Bonus Loyalty Stamps</option>
                    <option value="winback">Win-Back Discount</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    {newType === 'percentage' || newType === 'winback'
                      ? 'Discount Percentage (%)'
                      : newType === 'fixed_amount'
                      ? `Discount Amount (${currencySymbol})`
                      : 'Bonus Stamps'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Min Spend ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newMinSpend}
                    onChange={(e) => setNewMinSpend(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Description / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="Terms and conditions for counter display..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-200">
                <strong>Policy Enforcement:</strong> Offers strictly enforce single-use per customer. Duplicate redemptions by the same customer will be rejected automatically.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-create-offer-btn"
                  className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Create & Activate Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Redeem Test Terminal */}
      {redeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                  COUNTER REDEMPTION TERMINAL
                </span>
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  Redeem Offer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRedeemModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {redeemError && (
              <div
                data-testid="redeem-error-banner"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{redeemError}</span>
              </div>
            )}

            {redeemSuccess && (
              <div
                data-testid="redeem-success-banner"
                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{redeemSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRedeem} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Active Offer
                </label>
                <select
                  value={selectedOfferForRedeem?.id || ''}
                  onChange={(e) => {
                    const found = offers.find((o) => o.id === e.target.value);
                    setSelectedOfferForRedeem(found || null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                >
                  {offers
                    .filter((o) => o.status === 'active')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} - {o.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Customer ID, Name, or Phone
                </label>
                <input
                  type="text"
                  required
                  data-testid="redeem-customer-input"
                  placeholder="e.g. cust_c1 or Maya Lin"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span className="text-subtle-foreground">Quick pick:</span>
                  {allCustomers.slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomerSearchQuery(c.name)}
                      className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#3027F5] dark:text-[#E4C174] hover:underline"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRedeemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-redeem-offer-btn"
                  className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Confirm Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Win-Back Campaign Wizard */}
      {winbackWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                  CAMPAIGN RUNNER
                </span>
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  Build win-back list
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWinbackWizardOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {winbackSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                {winbackSuccess}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Inactivity Threshold
                </label>
                <div className="flex gap-2">
                  {[30, 45, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setInactivityDays(days)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold cursor-pointer transition-colors ${
                        inactivityDays === days
                          ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                          : 'bg-black/5 dark:bg-white/5 text-subtle-foreground'
                      }`}
                    >
                      {days} Days Dormant
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Outreach Channel
                </label>
                <div className="flex gap-2">
                  {(['email', 'sms'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setWinbackChannel(ch)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase cursor-pointer transition-colors ${
                        winbackChannel === ch
                          ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                          : 'bg-black/5 dark:bg-white/5 text-subtle-foreground'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Attach Special Offer (Optional)
                </label>
                <select
                  value={selectedWinbackOfferId}
                  onChange={(e) => setSelectedWinbackOfferId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                >
                  <option value="">No offer (greeting only)</option>
                  {offers
                    .filter((o) => o.status === 'active')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} - {o.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Audience Preview */}
              <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] space-y-2">
                <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block">
                  AUDIENCE EVALUATION PREVIEW
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#141412]">
                    <div className="text-[10px] text-subtle-foreground">Dormant Patrons</div>
                    <div className="text-base font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                      {dormantsAll.length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#141412]">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Consent Given</div>
                    <div className="text-base font-heading font-black text-emerald-600 dark:text-emerald-400">
                      {withConsent.length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#141412]">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Excluded (No Opt-in)</div>
                    <div className="text-base font-heading font-black text-amber-600 dark:text-amber-400">
                      {withoutConsent.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200">
                <strong>Note:</strong> This downloads a CSV of opted-in customers. No messages are sent automatically.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWinbackWizardOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="confirm-launch-winback-btn"
                  onClick={handleLaunchWinback}
                  className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Download list (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Submit Test Feedback */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                  LOG FEEDBACK
                </span>
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  Record Customer Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  data-testid="feedback-name-input"
                  value={testCustomerName}
                  onChange={(e) => setTestCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Star Rating (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setTestRating(stars)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                        testRating >= stars
                          ? 'bg-amber-400/10 border-amber-400 text-amber-500'
                          : 'border-transparent text-zinc-300 dark:text-zinc-700'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Customer Feedback Comments
                </label>
                <textarea
                  rows={3}
                  required
                  data-testid="feedback-comment-input"
                  value={testComment}
                  onChange={(e) => setTestComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="confirm-submit-feedback-btn"
                  className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Configure Public Review Link */}
      {publicReviewLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                  REPUTATION POLICY
                </span>
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  Public Review Destination
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPublicReviewLinkModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReviewUrl} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Public Review URL (Google, Yelp, Tripadvisor)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://g.page/r/your-google-business-review"
                  value={customReviewUrl}
                  onChange={(e) => setCustomReviewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-200">
                <strong>Non-Gating Standard:</strong> In alignment with customer protection standards, this public link is provided without rating gating or negative feedback diversion.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPublicReviewLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Review URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
