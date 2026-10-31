import React, { useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  MapPin,
  Utensils,
  Plus,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from '../router';
import { cafeService } from '../services/cafeService';
import type { ThemeMode } from '../types';
import type {
  MenuItem,
  CartItem,
  DietaryTag,
} from '../types/cafe';
import { formatMinorUnits } from '../types/cafe';
import { ItemCustomizationModal } from '../components/public/ItemCustomizationModal';
import { CartDrawer } from '../components/public/CartDrawer';

interface PublicMenuPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({ theme, onThemeToggle }) => {
  const { currentPath, searchParams, navigate } = useRouter();

  // Extract slug from /menu/:slug
  const slug = currentPath.replace(/^\/menu\/?/, '').split('/')[0] || '';
  const initialTableId = searchParams.get('table') || undefined;

  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(initialTableId);

  // Force re-render on subscriber update
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = cafeService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const data = cafeService.getPublicMenuBySlug(slug, selectedTableId);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDietary, setActiveDietary] = useState<'all' | DietaryTag>('all');

  // Customer Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Customization Modal
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  // Table switcher dropdown
  const [tablePickerOpen, setTablePickerOpen] = useState(false);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F2] dark:bg-[#1C1C1C] text-foreground">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Utensils className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-foreground">
            Digital Menu Unavailable
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The menu for "<strong>{slug}</strong>" could not be found or is currently saved as a private draft. Please ask your server or scan the table QR code again.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const { business, menu, categories, items, table, allTables } = data;

  const handleAddToCart = (newItem: CartItem) => {
    setCart((prev) => [...prev, newItem]);
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              quantity: newQty,
              lineTotal: item.unitPrice * newQty,
            }
          : item
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSelectTable = (tblId: string) => {
    setSelectedTableId(tblId);
    setTablePickerOpen(false);
    navigate(`/menu/${slug}?table=${tblId}`);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDietary =
      activeDietary === 'all' || (item.dietary && item.dietary.includes(activeDietary));

    return matchesCat && matchesSearch && matchesDietary;
  });

  const cartTotalMinor = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-foreground pb-24 transition-colors duration-200">
      {/* 1. Mobile-First Sticky Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141412]/95 backdrop-blur-md border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Business & Location branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs"
              style={{ backgroundColor: business.accentColor || '#3027F5' }}
            >
              {business.logoInitial}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-black text-sm sm:text-base text-foreground truncate leading-tight">
                {business.name}
              </h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <MapPin className="w-3 h-3 flex-shrink-0 text-subtle-foreground" />
                <span className="truncate">{business.locationName}</span>
              </div>
            </div>
          </div>

          {/* Table Selector & Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Table Badge / Switcher */}
            <div className="relative">
              <button
                type="button"
                data-testid="table-selector-btn"
                onClick={() => setTablePickerOpen(!tablePickerOpen)}
                className="px-2.5 py-1.5 rounded-xl border border-border bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{table ? table.displayName : 'Select Table'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-subtle-foreground" />
              </button>

              {/* Table Switcher Dropdown */}
              {tablePickerOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-card border border-border shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-xs uppercase tracking-wider text-subtle-foreground px-2 py-1 font-bold">
                    Choose Your Seat
                  </div>
                  {allTables.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTable(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        table?.id === t.id
                          ? 'bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174]'
                          : 'text-foreground hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D]'
                      }`}
                    >
                      <span>{t.displayName}</span>
                      {table?.id === t.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Light/Dark Toggle */}
            <button
              type="button"
              data-testid="public-theme-toggle"
              onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Menu Banner & Description */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-[#F8F7F2] dark:from-[#141412] dark:to-[#2D2D2D] border border-border shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              DIGITAL MENU & INSTANT ORDERING
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-foreground">
            {menu.name}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {menu.description || 'Select freshly crafted beverages and kitchen specials to order directly to your table.'}
          </p>
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="sticky top-[61px] z-20 bg-[#F8F7F2]/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md pt-2 pb-3 px-4 border-b border-[#E5E3DB]/60 dark:border-white/5">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground" />
            <input
              type="text"
              data-testid="public-menu-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search latte, matcha, avocado toast, pastries..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174] shadow-xs"
            />
          </div>

          {/* Horizontal Category Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              data-testid="public-cat-all"
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              All Items ({items.length})
            </button>

            {categories.map((cat) => {
              const catCount = items.filter((i) => i.categoryId === cat.id).length;
              const isSelected = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`public-cat-${cat.id}`}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs opacity-75">({catCount})</span>
                </button>
              );
            })}
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
            <span className="text-xs uppercase text-subtle-foreground font-bold mr-1">
              Diet:
            </span>
            {(['all', 'veg', 'vegan', 'gluten_free'] as const).map((diet) => {
              const isSel = activeDietary === diet;
              const label =
                diet === 'all'
                  ? 'All Diets'
                  : diet === 'veg'
                  ? 'Vegetarian'
                  : diet === 'vegan'
                  ? 'Vegan'
                  : 'Gluten-Free';
              return (
                <button
                  key={diet}
                  type="button"
                  data-testid={`dietary-filter-${diet}`}
                  onClick={() => setActiveDietary(diet)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    isSel
                      ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174]'
                      : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-card text-subtle-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Menu Items Section */}
      <main className="max-w-4xl mx-auto px-4 pt-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-3">
            <Utensils className="w-10 h-10 mx-auto text-subtle-foreground" />
            <h4 className="font-heading font-black text-base text-foreground">
              No dishes match your filter
            </h4>
            <p className="text-xs text-muted-foreground">
              Try searching for something else or tap another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isSoldOut = item.status === 'sold_out';
              const hasOptions =
                (item.variantGroups && item.variantGroups.length > 0) ||
                (item.modifierGroups && item.modifierGroups.length > 0);

              return (
                <div
                  key={item.id}
                  data-testid={`public-item-card-${item.id}`}
                  className={`p-5 rounded-3xl bg-card border transition-all flex flex-col justify-between ${
                    isSoldOut
                      ? 'border-border'
                      : 'border-border shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Title & Price */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-heading font-black text-base text-foreground leading-tight">
                        {item.name}
                      </h3>
                      <span className="font-heading font-black text-base text-foreground whitespace-nowrap">
                        {formatMinorUnits(item.price, item.currency)}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Dietary Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {item.dietary?.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-[#E5E3DB] dark:border-white/5"
                        >
                          {tag === 'veg'
                            ? 'Vegetarian'
                            : tag === 'vegan'
                            ? 'Vegan'
                            : tag === 'gluten_free'
                            ? 'Gluten-Free'
                            : 'Non-Veg'}
                        </span>
                      ))}

                      {hasOptions && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174]">
                          Customizable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add / Sold Out Button */}
                  <div className="pt-3 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex items-center justify-between">
                    <span className="text-xs text-subtle-foreground">
                      {isSoldOut ? 'Sold out for the day' : hasOptions ? 'Options available' : 'Freshly prepared'}
                    </span>

                    <button
                      type="button"
                      data-testid={`add-item-to-order-${item.id}`}
                      onClick={() => setSelectedItemForCustomization(item)}
                      disabled={isSoldOut}
                      className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSoldOut
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 cursor-not-allowed'
                          : 'bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-xs'
                      }`}
                    >
                      {isSoldOut ? (
                        <span>Sold Out</span>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{hasOptions ? 'Customize' : 'Add'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Sticky Floating Bottom Cart Bar (appears when cart has items) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-lg mx-auto">
          <button
            type="button"
            data-testid="view-cart-bar-btn"
            onClick={() => setCartDrawerOpen(true)}
            className="w-full p-4 rounded-2xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-2xl flex items-center justify-between font-bold text-sm cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-white/20 dark:bg-black/20 flex items-center justify-center text-xs">
                {cartItemCount}
              </div>
              <span className="font-heading font-black">View Your Order</span>
            </div>

            <div className="flex items-center gap-2 font-heading font-black">
              <span data-testid="cart-bar-total">{formatMinorUnits(cartTotalMinor, business.currency)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        isOpen={!!selectedItemForCustomization}
        onClose={() => setSelectedItemForCustomization(null)}
        item={selectedItemForCustomization}
        onAddToCart={handleAddToCart}
        accentColor={business.accentColor}
      />

      {/* Customer Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        business={business}
        table={table}
      />
    </div>
  );
};
