import React, { useState, useEffect } from 'react';
import { getPublicAppOrigin } from '../../../lib/firebase';
import { X, ArrowRight, ArrowLeft, Check, Download, ExternalLink, QrCode as QrIcon, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import type { Business } from '../../../types/business';
import type { QrCodeDefinition, QrDestinationType } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';

interface QrCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onCreatedSuccess?: (newQr: QrCodeDefinition) => void;
}

const QrCreateModalContent: React.FC<Omit<QrCreateModalProps, 'isOpen'>> = ({
  onClose,
  business,
  onCreatedSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [destinationType, setDestinationType] = useState<QrDestinationType>('counter_display');
  const [name, setName] = useState('Counter Display Standee');
  const [displayLabel, setDisplayLabel] = useState('Scan to Join & Earn Stamps');
  const loyaltyCardPath = `/card/${business.slug}`;
  const businessPagePath =
    business.businessType === 'cafe' || business.businessType === 'restaurant'
      ? `/menu/${business.slug}`
      : business.businessType === 'salon'
        ? `/book/${business.slug}`
        : business.businessType === 'retail'
          ? `/catalog/${business.slug}`
          : loyaltyCardPath;
  const [targetUrl, setTargetUrl] = useState(loyaltyCardPath);
  const [locationId, setLocationId] = useState(business.locations[0]?.id || 'loc_main');

  // Generated QR output
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [svgData, setSvgData] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Update targetUrl and default name when destinationType changes
  const handleSelectDestination = (type: QrDestinationType) => {
    setDestinationType(type);
    if (type === 'counter_display') {
      setName('Counter Display Standee');
      setDisplayLabel('Point camera at code to join');
      setTargetUrl(loyaltyCardPath);
    } else if (type === 'loyalty_enrollment') {
      setName('Customer Digital Pass Enrollment');
      setDisplayLabel('Join our loyalty card');
      setTargetUrl(loyaltyCardPath);
    } else {
      setName('Storefront Web Specials & Menu');
      setDisplayLabel('Explore our offerings & hours');
      setTargetUrl(businessPagePath);
    }
  };

  // Generate QR code whenever targetUrl changes
  useEffect(() => {
    let isCancelled = false;
    const origin = getPublicAppOrigin();
    const cleanUrl = targetUrl.startsWith('/') ? `${origin}${targetUrl}` : targetUrl;

    Promise.all([
      QRCode.toDataURL(cleanUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#111318',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      }),
      QRCode.toString(cleanUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#111318',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      }),
    ])
      .then(([png, svg]) => {
        if (!isCancelled) {
          setPngDataUrl(png);
          setSvgData(svg);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate preview QR', err);
        if (!isCancelled) setIsGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [targetUrl]);

  const origin = getPublicAppOrigin();
  const fullDestinationUrl = targetUrl.startsWith('/') ? `${origin}${targetUrl}` : targetUrl;

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveQrCode = () => {
    const created = loyaltyService.createQrCode(business.id, {
      name: name.trim() || 'Custom QR Code',
      displayLabel: displayLabel.trim() || undefined,
      destinationType,
      targetUrl,
      locationId,
    });

    if (onCreatedSuccess) {
      onCreatedSuccess(created);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header with Steps */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                QR STUDIO CREATOR
              </span>
              <span className="text-xs text-subtle-foreground">· Step {step} of 4</span>
            </div>
            <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              {step === 1 && '1. Choose Destination'}
              {step === 2 && '2. Customize QR Name & Label'}
              {step === 3 && '3. Preview & Verify Scan'}
              {step === 4 && '4. Save & Download Files'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CHOOSE DESTINATION */}
        {step === 1 && (
          <div className="py-6 space-y-4">
            <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1]">
              Select where customers are directed when they point their smartphone camera at this code:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                {
                  id: 'counter_display' as QrDestinationType,
                  title: 'Counter Standee',
                  desc: 'Table tent or acrylic checkout display with instant tap to join.',
                  route: loyaltyCardPath,
                },
                {
                  id: 'loyalty_enrollment' as QrDestinationType,
                  title: 'Digital Pass Enrollment',
                  desc: 'Direct link to your customer loyalty card sign-up page.',
                  route: loyaltyCardPath,
                },
                {
                  id: 'business_landing' as QrDestinationType,
                  title: 'Storefront Web Menu',
                  desc: 'Public landing page showing business specials, hours, and catalog.',
                  route: businessPagePath,
                },
              ].map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => handleSelectDestination(dest.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    destinationType === dest.id
                      ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                      : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-white dark:bg-[#1A1916] hover:border-[#3027F5]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <QrIcon className="w-5 h-5 text-[#3027F5] dark:text-[#E4C174]" />
                      {destinationType === dest.id && (
                        <div className="w-4 h-4 rounded-full bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                      {dest.title}
                    </div>
                    <p className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-1 leading-snug">
                      {dest.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 font-mono text-[10px] text-subtle-foreground truncate">
                    {dest.route}
                  </div>
                </button>
              ))}
            </div>

            {/* Location selector if multi-location */}
            {business.locations.length > 1 && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Assign Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm"
                >
                  {business.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.address})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CUSTOMIZE PRESENTATION */}
        {step === 2 && (
          <div className="py-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Counter Acrylic Standee"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Instructional Label (Printed Under QR)
              </label>
              <input
                type="text"
                value={displayLabel}
                onChange={(e) => setDisplayLabel(e.target.value)}
                placeholder="e.g. Point smartphone camera at code to join"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Target Route Path
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] font-mono text-xs"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F0EEE6] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.15)] text-xs text-[#60646C] dark:text-[#AAA499]">
              Destination will be encoded as: <strong className="font-mono text-[#111318] dark:text-[#F7F3EB]">{fullDestinationUrl}</strong>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VERIFY SCAN */}
        {step === 3 && (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Genuine QR Code Card (Left) */}
              <div className="sm:col-span-6 flex flex-col items-center p-6 rounded-3xl bg-white dark:bg-[#181816] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] shadow-md text-center">
                <span className="text-[10px] uppercase font-bold text-subtle-foreground mb-2">
                  {business.name}
                </span>

                <div className="w-52 h-52 bg-white p-3 rounded-2xl border border-black/10 flex items-center justify-center shadow-inner">
                  {isGenerating ? (
                    <div className="text-xs font-mono text-subtle-foreground">Generating Matrix...</div>
                  ) : pngDataUrl ? (
                    <img
                      src={pngDataUrl}
                      alt={name}
                      data-testid="generated-qr-image"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-red-500">QR generation failed</div>
                  )}
                </div>

                <div className="mt-3 font-heading font-bold text-xs text-[#111318] dark:text-[#F7F3EB]">
                  {displayLabel || 'Scan to Open'}
                </div>
                <span className="text-[11px] text-subtle-foreground uppercase mt-0.5">
                  High Contrast · Margin 2 · EC-M
                </span>
              </div>

              {/* Scannable Verification Card (Right) */}
              <div className="sm:col-span-6 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Scannable Destination Verified</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Camera matrix contains complete URL. Compatible with standard iOS Camera and Android Lens without special apps.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-xs space-y-2">
                  <div>
                    <span className="text-[10px] uppercase text-subtle-foreground block">
                      DECODED DESTINATION URL:
                    </span>
                    <a
                      href={fullDestinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#3027F5] dark:text-[#E4C174] font-bold break-all hover:underline inline-flex items-center gap-1"
                    >
                      <span>{fullDestinationUrl}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-subtle-foreground">Format Output:</span>
                    <strong className="text-[#111318] dark:text-[#F7F3EB]">PNG 512px + Vector SVG</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-subtle-foreground">
                  <Smartphone className="w-4 h-4 flex-shrink-0" />
                  <span>Customer points smartphone camera &rarr; loyalty pass opens instantly</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: SAVE & DOWNLOAD */}
        {step === 4 && (
          <div className="py-6 space-y-6">
            <div className="text-center max-w-sm mx-auto space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-heading font-black text-xl text-[#111318] dark:text-[#F7F3EB]">
                {name} Ready
              </h4>
              <p className="text-xs text-[#60646C] dark:text-[#AAA499]">
                Download high-resolution print files or save this definition to your business QR collection.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="p-3.5 rounded-2xl border-2 border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 hover:bg-[#3027F5]/10 flex items-center justify-center gap-2 text-xs font-bold text-[#3027F5] dark:text-[#E4C174] cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG (512px)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSvg}
                className="p-3.5 rounded-2xl border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#1A1916] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB] cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Vector SVG</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] text-center text-[11px] text-subtle-foreground max-w-md mx-auto">
              Saved QR codes remain active and can be downloaded again from your QR Studio library anytime.
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs font-semibold text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev + 1) as 2 | 3 | 4)}
              className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-all"
            >
              <span>{step === 3 ? 'Proceed to Save & Download' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveQrCode}
              className="px-7 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all"
            >
              Save to QR Studio Library
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export const QrCreateModal: React.FC<QrCreateModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <QrCreateModalContent key={props.business.id} {...props} />;
};
