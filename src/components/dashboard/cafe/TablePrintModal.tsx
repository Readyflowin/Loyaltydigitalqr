import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Laptop,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { CafeTable } from '../../../types/cafe';
import type { Business } from '../../../types/business';
import {
  buildTableMenuUrl,
  getQrEnvironmentMode,
  setQrEnvironmentMode,
  type QrEnvironmentMode,
} from '../../../utils/qrUrlBuilder';

interface TablePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: CafeTable;
  business: Business;
}

export const TablePrintModal: React.FC<TablePrintModalProps> = ({
  isOpen,
  onClose,
  table,
  business,
}) => {
  const [mode, setMode] = useState<QrEnvironmentMode>(() => getQrEnvironmentMode());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const businessSlug = business.slug;
  const { url: tableUrl, isSafeForPrint, domain, pathWithQuery } = buildTableMenuUrl({
    businessSlug,
    tableId: table.id,
    mode,
  });

  // Generate QR code when tableUrl changes
  useEffect(() => {
    let isCurrent = true;
    QRCode.toDataURL(tableUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#111318',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isCurrent) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR for table standee:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [tableUrl]);

  if (!isOpen) return null;

  const handleModeChange = (newMode: QrEnvironmentMode) => {
    setMode(newMode);
    setQrEnvironmentMode(newMode);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    try {
      const highResDataUrl = await QRCode.toDataURL(tableUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#111318',
          light: '#FFFFFF',
        },
      });
      const a = document.createElement('a');
      a.href = highResDataUrl;
      a.download = `Standee_${businessSlug}_${table.tableNumber}_1024.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download PNG:', err);
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const svg = await QRCode.toString(tableUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Standee_${businessSlug}_${table.tableNumber}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    }
  };

  const location = business.locations.find((l) => l.id === table.locationId) || business.locations[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Print-specific style injection to hide backdrop & print ONLY the standee */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #standee-printable-card, #standee-printable-card * {
            visibility: visible !important;
          }
          #standee-printable-card {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            width: 380px !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between print:hidden flex-shrink-0">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              TABLE STANDEE & PRINT ASSET
            </span>
            <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              {table.displayName} QR Standee
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Environment Mode Switcher & Safety Notice */}
          <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB] block">
                  QR Destination URL Safety Mode
                </span>
                <span className="text-[11px] text-[#60646C] dark:text-[#D0CBC1]">
                  Ensure physical printed standees use production HTTPS URLs, never local IPs.
                </span>
              </div>

              <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#141412] rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] self-start sm:self-auto">
                <button
                  type="button"
                  data-testid="env-mode-prod"
                  onClick={() => handleModeChange('production')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'production'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[#60646C] dark:text-[#D0CBC1]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Production (Print-Safe)</span>
                </button>
                <button
                  type="button"
                  data-testid="env-mode-dev"
                  onClick={() => handleModeChange('development')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'development'
                      ? 'bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] shadow-xs'
                      : 'text-[#60646C] dark:text-[#D0CBC1]'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Dev Preview</span>
                </button>
              </div>
            </div>

            {/* Safety Indicator Banner */}
            {isSafeForPrint ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <strong className="font-bold">Ready for Commercial Printing:</strong> Destination URL uses verified public HTTPS domain{' '}
                  <code className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono text-[11px]">
                    {domain}
                  </code>
                  . Scanners in customer venues will open cleanly on any cellular network.
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong className="font-bold">Development Mode Active:</strong> Destination URL points to local host{' '}
                  <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">
                    {domain}
                  </code>
                  . Switch to Production mode before printing physical standees for customer tables.
                </div>
              </div>
            )}

            <div className="text-[11px] font-mono text-[#868A94] break-all">
              Target URL: {tableUrl}
            </div>
          </div>

          {/* Printable Acrylic Standee Card Preview */}
          <div className="flex justify-center">
            <div
              id="standee-printable-card"
              data-testid="standee-card-preview"
              className="w-full max-w-[340px] p-6 rounded-3xl bg-white text-[#111318] border-2 border-[#111318] shadow-xl text-center space-y-4"
            >
              {/* Business Header */}
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: business.accentColor || '#3027F5' }}
                >
                  {business.logoInitial || business.name.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-black text-sm text-[#111318] leading-tight">
                    {business.name}
                  </h4>
                  <p className="text-[10px] text-[#60646C] font-semibold">
                    {location?.name || 'Tabletop Order'}
                  </p>
                </div>
              </div>

              {/* Table Name Badge */}
              <div className="py-2 px-4 rounded-2xl bg-[#F8F7F2] border border-[#E5E3DB]">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#868A94] uppercase block">
                  ORDER FROM YOUR TABLE
                </span>
                <span className="text-2xl font-heading font-black text-[#111318] tracking-tight block">
                  {table.displayName}
                </span>
              </div>

              {/* Crisp QR Matrix Canvas */}
              <div className="p-3 rounded-2xl bg-white border border-[#E5E3DB] inline-block shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`${table.displayName} QR Code`}
                    className="w-48 h-48 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-[#868A94]">
                    Generating QR matrix...
                  </div>
                )}
              </div>

              {/* Printed Instructions */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#111318] px-2 leading-snug">
                  {table.instruction || 'Scan with your smartphone camera to view menu & order'}
                </p>
                <p className="text-[10px] text-[#868A94] font-medium">
                  No app download or account required
                </p>
              </div>

              {/* Watermark / Brand Attribution */}
              <div className="pt-2 border-t border-[#E5E3DB] flex items-center justify-center gap-1.5 text-[9px] font-mono text-[#868A94] uppercase tracking-wider">
                <span>POWERED BY LOYALTYDIGITALQR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex flex-wrap items-center justify-between gap-3 print:hidden flex-shrink-0">
          <a
            href={pathWithQuery}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="test-table-url-link"
            className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Menu in Browser</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-3.5 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] hover:bg-white dark:hover:bg-[#201F1B] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-3.5 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] hover:bg-white dark:hover:bg-[#201F1B] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>1024px PNG</span>
            </button>

            <button
              type="button"
              data-testid="print-standee-btn"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Standee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
