import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  Sun,
  Moon,
  Store,
} from 'lucide-react';
import { useRouter } from '../router';
import { retailService } from '../services/retailService';
import { formatMinorUnits } from '../types/cafe';
import type { ThemeMode } from '../types';

interface PublicCatalogPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

export const PublicCatalogPage: React.FC<PublicCatalogPageProps> = ({ theme, onThemeToggle }) => {
  const { currentPath, navigate } = useRouter();

  // Extract slug from /catalog/:slug
  const slug = currentPath.replace(/^\/catalog\/?/, '').split('/')[0] || '';
  const data = retailService.getPublicCatalogProfile(slug);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Catalogue Not Found
          </h2>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
            We couldn't locate a published product catalogue matching "<strong>{slug}</strong>". The link may have expired or was typed incorrectly.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const { business, categories, products } = data;

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div
      data-testid="public-catalog-page"
      className="min-h-screen bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB] pb-16 transition-colors duration-200"
    >
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141412]/95 backdrop-blur-md border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs"
              style={{ backgroundColor: business.accentColor }}
            >
              {business.logoInitial}
            </div>
            <div className="min-w-0">
              <h1
                data-testid="public-catalog-brand"
                className="font-heading font-black text-sm sm:text-base text-[#111318] dark:text-[#F7F3EB] truncate leading-tight"
              >
                {business.name}
              </h1>
              <div className="flex items-center gap-1 text-[11px] text-[#60646C] dark:text-[#D0CBC1] truncate">
                <MapPin className="w-3 h-3 flex-shrink-0 text-subtle-foreground" />
                <span className="truncate">{business.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#059669] uppercase hidden sm:inline">
              DIGITAL LOOKBOOK
            </span>

            <button
              type="button"
              data-testid="theme-toggle-catalog"
              onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Store Welcome Banner */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#059669] uppercase block mb-1">
                IN-STORE CURATION
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                Curated Boutique Catalogue
              </h2>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1 max-w-xl">
                Browse our current seasonal collection. Visit our showroom at {business.address} to try on or purchase items.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#059669]/10 border border-[#059669]/20 flex items-center gap-2.5 text-xs text-[#059669] font-bold self-start sm:self-center">
              <Store className="w-4 h-4 flex-shrink-0" />
              <span>Available for In-Store Purchase</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="pt-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground" />
              <input
                type="text"
                data-testid="public-catalog-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles, pieces, or keywords..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10 text-xs text-[#111318] dark:text-[#F7F3EB] placeholder:text-subtle-foreground focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E3DB] dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                selectedCategoryId === 'all'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'bg-[#F8F7F2] dark:bg-[#1A1916] text-[#60646C] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              All Pieces ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                  selectedCategoryId === c.id
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'bg-[#F8F7F2] dark:bg-[#1A1916] text-[#60646C] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Products List */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-subtle-foreground" />
            <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
              No Pieces Match Your Search
            </h3>
            <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
              Try searching with different terms or selecting another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                data-testid={`catalog-item-${prod.id}`}
                className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:border-[#059669] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#F8F7F2] dark:bg-[#1A1916] font-mono font-bold text-[#60646C] dark:text-[#AAA499]">
                      {prod.categoryName}
                    </span>
                    <span className="font-mono text-[#059669] font-bold">
                      In Showroom
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                    {prod.name}
                  </h3>

                  <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] line-clamp-3 leading-relaxed">
                    {prod.description}
                  </p>

                  {prod.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {prod.variants.map((v) => (
                        <span
                          key={v.name}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#F8F7F2] dark:bg-[#1A1916] font-mono text-[#60646C] dark:text-[#D0CBC1]"
                        >
                          {v.name}: {v.options.join(', ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-subtle-foreground">Regular Price</span>
                  <span className="font-mono font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                    {formatMinorUnits(prod.price, prod.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
