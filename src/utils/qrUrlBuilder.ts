/**
 * Public QR Code URL Safety Builder for Loyaltydigitalqr
 * Ensures no local IP addresses (127.0.0.1, localhost) are hardcoded into production-ready QR codes.
 */

export type QrEnvironmentMode = 'production' | 'development';

export const CONFIG = {
  DEFAULT_PUBLIC_DOMAIN: 'https://loyaltydigitalqr.com',
  STORAGE_KEY_MODE: 'loyalty_qr_env_mode',
  STORAGE_KEY_CUSTOM_DOMAIN: 'loyalty_qr_custom_domain',
};

/**
 * Generates a clean URL slug from a business name
 */
export function generateBusinessSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cafe';
}

/**
 * Returns current QR environment mode
 */
export function getQrEnvironmentMode(): QrEnvironmentMode {
  if (typeof window === 'undefined') return 'production';
  const saved = localStorage.getItem(CONFIG.STORAGE_KEY_MODE);
  if (saved === 'production' || saved === 'development') {
    return saved;
  }
  // Default to development if running on localhost / 127.0.0.1
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'development' : 'production';
}

/**
 * Sets QR environment mode
 */
export function setQrEnvironmentMode(mode: QrEnvironmentMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG.STORAGE_KEY_MODE, mode);
  }
}

/**
 * Gets configured public production origin
 */
export function getProductionDomain(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(CONFIG.STORAGE_KEY_CUSTOM_DOMAIN);
    if (custom && custom.trim().startsWith('https://')) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return CONFIG.DEFAULT_PUBLIC_DOMAIN;
}

/**
 * Sets custom production domain (e.g. for custom restaurant domain)
 */
export function setProductionDomain(domain: string): void {
  if (typeof window !== 'undefined') {
    if (!domain) {
      localStorage.removeItem(CONFIG.STORAGE_KEY_CUSTOM_DOMAIN);
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEY_CUSTOM_DOMAIN, domain.trim());
    }
  }
}

/**
 * Builds table-specific public menu URL
 * In development: Uses current window origin (e.g. http://127.0.0.1:3000/menu/good-day-coffee?table=tbl_main_01)
 * In production: Uses public HTTPS domain (e.g. https://loyaltydigitalqr.com/menu/good-day-coffee?table=tbl_main_01)
 */
export function buildTableMenuUrl(params: {
  businessSlug: string;
  tableId: string;
  mode?: QrEnvironmentMode;
}): {
  url: string;
  mode: QrEnvironmentMode;
  isSafeForPrint: boolean;
  domain: string;
  pathWithQuery: string;
} {
  const mode = params.mode || getQrEnvironmentMode();
  const pathWithQuery = `/menu/${params.businessSlug}?table=${encodeURIComponent(params.tableId)}`;

  if (mode === 'production') {
    const domain = getProductionDomain();
    const isSafeForPrint = domain.startsWith('https://') && !domain.includes('127.0.0.1') && !domain.includes('localhost');
    return {
      url: `${domain}${pathWithQuery}`,
      mode: 'production',
      isSafeForPrint,
      domain,
      pathWithQuery,
    };
  }

  // Development mode
  const localOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000';
  return {
    url: `${localOrigin}${pathWithQuery}`,
    mode: 'development',
    isSafeForPrint: false, // Local preview only; not for physical printing standee
    domain: localOrigin,
    pathWithQuery,
  };
}
