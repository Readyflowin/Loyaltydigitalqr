import React, { useState, useEffect } from 'react';
import { getPublicAppOrigin } from '../../../lib/firebase';
import {
  QrCode as QrIcon,
  Plus,
  Search,
  Download,
  ExternalLink,
  Edit2,
  Power,
  Trash2,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { QrCodeDefinition, QrDestinationType } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';
import { downloadCounterPoster } from '../../../utils/counterPoster';
import { QrCreateModal } from './QrCreateModal';

/** Loyalty/counter codes get the branded "Scan to Join Our Rewards" poster. */
const usesPoster = (type: QrDestinationType) =>
  type === 'counter_display' || type === 'loyalty_enrollment';

interface QrStudioViewProps {
  business: Business;
  theme: ThemeMode;
}

export const QrStudioView: React.FC<QrStudioViewProps> = ({ business }) => {
  const [qrCodes, setQrCodes] = useState<QrCodeDefinition[]>(() => {
    return loyaltyService.getQrCodes(business.id);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | QrDestinationType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Rename dialog state
  const [renamingQr, setRenamingQr] = useState<QrCodeDefinition | null>(null);
  const [newName, setNewName] = useState('');

  // Refresh reactive data when service updates
  useEffect(() => {
    const unsub = loyaltyService.subscribe(() => {
      setQrCodes(loyaltyService.getQrCodes(business.id));
    });
    return unsub;
  }, [business.id]);

  const origin = getPublicAppOrigin();

  // Filtered QR codes
  const filtered = qrCodes.filter((qr) => {
    const matchesSearch =
      qr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (qr.displayLabel && qr.displayLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      qr.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || qr.destinationType === typeFilter;
    const matchesStatus = statusFilter === 'all' || qr.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleToggleStatus = (qrId: string) => {
    loyaltyService.toggleQrCodeStatus(business.id, qrId);
  };

  const handleDelete = (qrId: string) => {
    if (window.confirm('Are you sure you want to delete this QR code definition?')) {
      loyaltyService.deleteQrCode(business.id, qrId);
    }
  };

  const handleDownloadPng = async (qr: QrCodeDefinition) => {
    const fullUrl = qr.targetUrl.startsWith('/') ? `${origin}${qr.targetUrl}` : qr.targetUrl;
    const fileBase = qr.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      // Counter / loyalty codes download as the branded print-ready poster;
      // storefront/menu codes stay a plain high-resolution QR.
      if (usesPoster(qr.destinationType)) {
        await downloadCounterPoster(fullUrl, fileBase);
        return;
      }
      const dataUrl = await QRCode.toDataURL(fullUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${fileBase}_1024.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PNG QR:', err);
    }
  };

  const handleDownloadSvg = async (qr: QrCodeDefinition) => {
    const fullUrl = qr.targetUrl.startsWith('/') ? `${origin}${qr.targetUrl}` : qr.targetUrl;
    try {
      const svg = await QRCode.toString(fullUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qr.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading SVG QR:', err);
    }
  };

  const handleOpenRename = (qr: QrCodeDefinition) => {
    setRenamingQr(qr);
    setNewName(qr.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingQr || !newName.trim()) return;
    loyaltyService.updateQrCode(business.id, renamingQr.id, { name: newName.trim() });
    setRenamingQr(null);
  };

  const activeCount = qrCodes.filter((q) => q.status === 'active').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            QR STUDIO & PRINT ASSETS
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-0.5">
            Counter & Digital Pass QR Codes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create, preview, customize, and export genuine scannable QR matrices for print standees and digital passes.
          </p>
        </div>

        <button
          type="button"
          data-testid="create-qr-btn"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New QR Code</span>
        </button>
      </div>

      {/* 2. Top Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            TOTAL QR DEFINITIONS
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-foreground">
            {qrCodes.length}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Scoped to {business.name}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            ACTIVE COUNTER CODES
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Ready for customer smartphone scans
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            SUPPORTED DESTINATIONS
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            3 Types
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Enrollment · Standee · Web Specials
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-subtle-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by QR name, label, or path..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | QrDestinationType)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-medium"
          >
            <option value="all">All Destinations</option>
            <option value="counter_display">Counter Standee</option>
            <option value="loyalty_enrollment">Pass Enrollment</option>
            <option value="business_landing">Storefront Menu</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* 4. QR Codes Library Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-card border-2 border-dashed border-[#E5E3DB] dark:border-white/10 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-subtle-foreground">
            <QrIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-lg text-foreground">
              No QR Codes Found
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No QR definitions matched your search and filter criteria.'
                : 'Create your first QR code for table tents, counter displays, or window stickers.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-xs shadow-md cursor-pointer"
          >
            Create QR Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((qr) => (
            <QrCardItem
              key={qr.id}
              qr={qr}
              origin={origin}
              onDownloadPng={() => handleDownloadPng(qr)}
              onDownloadSvg={() => handleDownloadSvg(qr)}
              onToggleStatus={() => handleToggleStatus(qr.id)}
              onRename={() => handleOpenRename(qr)}
              onDelete={() => handleDelete(qr.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <QrCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        business={business}
      />

      {/* Rename Dialog */}
      {renamingQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setRenamingQr(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h4 className="font-heading font-black text-base text-foreground mb-3">
              Rename QR Code
            </h4>
            <form onSubmit={handleSaveRename} className="space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingQr(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// ---------------------------------------------------------------------------
// QR CARD ITEM WITH LIVE SCAN MATRIX
// ---------------------------------------------------------------------------

interface QrCardItemProps {
  qr: QrCodeDefinition;
  origin: string;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onToggleStatus: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const QrCardItem: React.FC<QrCardItemProps> = ({
  qr,
  origin,
  onDownloadPng,
  onDownloadSvg,
  onToggleStatus,
  onRename,
  onDelete,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  const fullUrl = qr.targetUrl.startsWith('/') ? `${origin}${qr.targetUrl}` : qr.targetUrl;

  useEffect(() => {
    QRCode.toDataURL(fullUrl, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: qr.status === 'active' ? '#111318' : '#868A94',
        light: '#FFFFFF',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Thumbnail QR error:', err));
  }, [fullUrl, qr.status]);

  const getTypeLabel = (type: QrDestinationType) => {
    switch (type) {
      case 'counter_display':
        return 'Counter Standee';
      case 'loyalty_enrollment':
        return 'Pass Enrollment';
      case 'business_landing':
        return 'Storefront Menu';
      default:
        return 'Standard';
    }
  };

  return (
    <div
      data-testid={`qr-card-${qr.id}`}
      className={`rounded-3xl border-2 transition-all p-5 flex flex-col justify-between shadow-xs ${
        qr.status === 'active'
          ? 'bg-card border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]'
          : 'bg-[#F8F7F2]/60 dark:bg-[#242424]/80 border-dashed border-[#DDD9CE] dark:border-white/10 opacity-75'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-xs uppercase font-bold bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] mb-1">
              {getTypeLabel(qr.destinationType)}
            </span>
            <h4 className="font-heading font-black text-base text-foreground leading-tight">
              {qr.name}
            </h4>
          </div>

          {/* Status Badge */}
          <button
            type="button"
            onClick={onToggleStatus}
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              qr.status === 'active'
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'bg-black/5 dark:bg-white/10 text-subtle-foreground'
            }`}
            title="Click to toggle active/disabled status"
          >
            {qr.status === 'active' ? 'Active' : 'Disabled'}
          </button>
        </div>

        {/* Live QR Matrix Display */}
        <div className="w-full bg-muted rounded-2xl p-4 flex flex-col items-center justify-center border border-black/5 dark:border-white/5 my-2">
          <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs flex items-center justify-center">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={qr.name}
                className={`w-full h-full object-contain ${qr.status === 'disabled' ? 'grayscale opacity-50' : ''}`}
              />
            ) : (
              <div className="text-xs text-subtle-foreground">Loading...</div>
            )}
          </div>

          <div className="mt-2 text-xs font-medium text-foreground text-center truncate max-w-full">
            {qr.displayLabel || 'Scan to open'}
          </div>
        </div>

        {/* Target URL Info */}
        <div className="pt-2 text-xs space-y-1">
          <div className="flex items-center justify-between text-subtle-foreground">
            <span>Destination:</span>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3027F5] dark:text-[#E4C174] font-mono font-bold truncate max-w-[160px] hover:underline inline-flex items-center gap-0.5"
            >
              <span>{qr.targetUrl}</span>
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
            </a>
          </div>
          <div className="flex items-center justify-between text-subtle-foreground text-xs">
            <span>Created:</span>
            <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid={`download-png-${qr.id}`}
            onClick={onDownloadPng}
            className="p-1.5 rounded-lg border border-[#E5E3DB] dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer inline-flex items-center gap-1 text-foreground"
            title={usesPoster(qr.destinationType) ? 'Download print-ready counter poster (PNG)' : 'Download PNG (1024px)'}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-xs">{usesPoster(qr.destinationType) ? 'Poster' : 'PNG'}</span>
          </button>

          <button
            type="button"
            data-testid={`download-svg-${qr.id}`}
            onClick={onDownloadSvg}
            className="p-1.5 rounded-lg border border-[#E5E3DB] dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer inline-flex items-center gap-1 text-foreground"
            title="Download Vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-xs">SVG</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRename}
            className="p-1.5 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Rename QR definition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-testid={`toggle-power-${qr.id}`}
            onClick={onToggleStatus}
            className="p-1.5 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title={qr.status === 'active' ? 'Disable QR code' : 'Enable QR code'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-subtle-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
            title="Delete QR definition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
