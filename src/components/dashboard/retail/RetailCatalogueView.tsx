import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Copy,
  Archive,
  ShoppingBag,
  Check,
  X,
  AlertCircle,
  Tag,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { RetailProduct, RetailProductCategory } from '../../../types/retail';
import { retailService } from '../../../services/retailService';
import { loyaltyService } from '../../../services/loyaltyService';
import { formatMinorUnits } from '../../../types/cafe';
import { useRouter } from '../../../router';

interface RetailCatalogueViewProps {
  business: Business;
  theme: ThemeMode;
}

export const RetailCatalogueView: React.FC<RetailCatalogueViewProps> = ({ business }) => {
  const { navigate } = useRouter();

  // Reactive subscription
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = retailService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RetailProduct | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formVariants, setFormVariants] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);

  // Record Sale Modal
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [saleItems, setSaleItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccessNotice, setSaleSuccessNotice] = useState<string | null>(null);

  const categories: RetailProductCategory[] = retailService.getCategories(business.id);
  const products: RetailProduct[] = retailService.getProducts(business.id, {
    categoryId: selectedCategory,
    search: searchQuery,
    includeArchived,
  });
  const metrics = retailService.getRetailMetrics(business.id);
  const customers = loyaltyService.getCustomers(business.id);

  const businessSlug = business.slug;

  // Open editor for new product
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('25.00');
    setFormCategory(categories[0]?.id || '');
    setFormSku('');
    setFormDesc('');
    setFormAvailable(true);
    setFormVariants('');
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Open editor to edit existing product
  const handleOpenEditProduct = (prod: RetailProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice((prod.price / 100).toFixed(2));
    setFormCategory(prod.categoryId);
    setFormSku(prod.sku || '');
    setFormDesc(prod.description);
    setFormAvailable(prod.isAvailable);
    setFormVariants(
      prod.variants.map((v) => `${v.name}: ${v.options.join(', ')}`).join(' | ')
    );
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setEditorError(null);

    const priceNum = parseFloat(formPrice);
    if (!formName.trim()) {
      setEditorError('Product name is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setEditorError('Please provide a valid non-negative price.');
      return;
    }

    const priceMinor = Math.round(priceNum * 100);

    // Parse simple variants if typed
    const parsedVariants = formVariants.trim()
      ? formVariants.split('|').map((chunk, idx) => {
          const [namePart, optsPart] = chunk.split(':');
          const vName = namePart ? namePart.trim() : `Variant ${idx + 1}`;
          const options = optsPart ? optsPart.split(',').map((o) => o.trim()).filter(Boolean) : [];
          return { id: `v_${idx}`, name: vName, options };
        })
      : [];

    if (editingProduct) {
      const res = retailService.updateProduct(business.id, editingProduct.id, {
        name: formName.trim(),
        price: priceMinor,
        categoryId: formCategory,
        sku: formSku.trim() || undefined,
        description: formDesc.trim(),
        isAvailable: formAvailable,
        variants: parsedVariants,
      });
      if (!res.success) {
        setEditorError(res.error || 'Failed to update product.');
        return;
      }
    } else {
      const res = retailService.createProduct({
        businessId: business.id,
        name: formName.trim(),
        price: priceMinor,
        categoryId: formCategory || (categories[0]?.id ?? 'cat_gen'),
        sku: formSku.trim() || undefined,
        description: formDesc.trim(),
        isAvailable: formAvailable,
        currency: business.currency,
        variants: parsedVariants,
      });
      if (!res.success) {
        setEditorError(res.error || 'Failed to create product.');
        return;
      }
    }

    setIsEditorOpen(false);
  };

  const handleDuplicate = (prodId: string) => {
    retailService.duplicateProduct(business.id, prodId);
  };

  const handleArchive = (prodId: string) => {
    retailService.archiveProduct(business.id, prodId);
  };

  const handleToggleAvailable = (prodId: string) => {
    retailService.toggleAvailability(business.id, prodId);
  };

  // Open Record Sale Modal
  const handleOpenRecordSale = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setSaleItems(
      products[0] ? [{ productId: products[0].id, quantity: 1 }] : []
    );
    setSaleError(null);
    setSaleSuccessNotice(null);
    setIsRecordSaleOpen(true);
  };

  const handleAddSaleItem = () => {
    if (products[0]) {
      setSaleItems([...saleItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  // Calculate sale subtotal
  const saleSubtotal = saleItems.reduce((acc, it) => {
    const p = retailService.getProduct(business.id, it.productId);
    return acc + (p?.price || 0) * it.quantity;
  }, 0);

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);
    setSaleSuccessNotice(null);

    if (saleItems.length === 0) {
      setSaleError('Please add at least one product item.');
      return;
    }

    const matchedCustomer = customers.find((c) => c.id === selectedCustomerId);

    const res = retailService.recordPurchase({
      businessId: business.id,
      customerId: matchedCustomer?.id,
      customerName: matchedCustomer?.name,
      customerEmail: matchedCustomer?.email,
      items: saleItems,
      staffPin: business.locations[0]?.staffPin || '2049',
    });

    if (!res.success) {
      setSaleError(res.error || 'Failed to record purchase transaction.');
      return;
    }

    setSaleSuccessNotice(
      `Sale ${res.purchase?.transactionNumber} recorded! Total: ${formatMinorUnits(
        res.purchase?.total || 0,
        business.currency
      )}${res.loyaltyIssued ? ' • 1 Loyalty Stamp Issued!' : ''}`
    );

    setTimeout(() => {
      setIsRecordSaleOpen(false);
      setSaleSuccessNotice(null);
    }, 1500);
  };

  return (
    <div
      data-testid="retail-catalogue-view"
      className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150"
    >
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] text-xs font-bold uppercase tracking-wider">
              RETAIL & MERCHANDISE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
            Product Catalogue & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your store's boutique items, availability, pricing, and record in-store transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="preview-catalog-btn"
            onClick={() => navigate(`/catalog/${businessSlug}`)}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] text-foreground text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Online Catalogue</span>
          </button>

          <button
            type="button"
            data-testid="record-sale-btn"
            onClick={handleOpenRecordSale}
            className="px-3.5 py-2 rounded-xl border-2 border-[#059669] text-[#059669] hover:bg-[#059669]/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Record In-Store Sale</span>
          </button>

          <button
            type="button"
            data-testid="add-product-btn"
            onClick={handleOpenNewProduct}
            className="px-4 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            ACTIVE PRODUCTS
          </span>
          <div data-testid="metric-active-products" className="text-2xl font-heading font-black text-foreground">
            {metrics.activeProducts}
          </div>
          <span className="text-xs text-muted-foreground">Published in catalogue</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            IN-STOCK AVAILABLE
          </span>
          <div data-testid="metric-available-products" className="text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {metrics.availableProducts}
          </div>
          <span className="text-xs text-muted-foreground">Ready for customer purchase</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            QUALIFYING PURCHASES
          </span>
          <div data-testid="metric-recorded-sales" className="text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {metrics.qualifyingPurchases}
          </div>
          <span className="text-xs text-muted-foreground">Eligible retail transactions</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            TOTAL STORE REVENUE
          </span>
          <div data-testid="metric-store-revenue" className="text-2xl font-heading font-black text-foreground">
            {formatMinorUnits(metrics.totalRevenueMinor, business.currency)}
          </div>
          <span className="text-xs text-muted-foreground">Recorded in-store sales</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground" />
            <input
              type="text"
              data-testid="search-products-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, SKU or description..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded-sm accent-[#059669] cursor-pointer"
            />
            <span>Show archived products</span>
          </label>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E3DB] dark:border-white/10 text-xs">
          <button
            type="button"
            data-testid="cat-filter-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'bg-muted text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            All Products ({retailService.getProducts(business.id, { includeArchived }).length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              data-testid={`cat-filter-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Products Grid */}
      {products.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-3">
          <Package className="w-10 h-10 mx-auto text-subtle-foreground" />
          <h3 className="font-heading font-black text-base text-foreground">
            No Products Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No products matched "${searchQuery}". Try clearing search.`
              : 'Add your first product to start building your retail catalogue.'}
          </p>
          <button
            type="button"
            onClick={handleOpenNewProduct}
            className="px-4 py-2 rounded-xl bg-[#059669] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              data-testid={`product-card-${prod.id}`}
              className={`p-5 rounded-3xl bg-card border transition-all ${
                prod.isArchived
                  ? 'border-gray-300 dark:border-gray-800 opacity-60'
                  : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:border-[#059669]'
              } space-y-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono font-bold text-muted-foreground">
                      {prod.categoryName}
                    </span>
                    {prod.sku && (
                      <span className="text-xs font-mono text-subtle-foreground">
                        SKU: {prod.sku}
                      </span>
                    )}
                  </div>
                  <h3
                    data-testid={`product-title-${prod.id}`}
                    className="font-heading font-black text-base text-foreground truncate"
                  >
                    {prod.name}
                  </h3>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    data-testid={`product-price-${prod.id}`}
                    className="font-mono font-bold text-base text-foreground"
                  >
                    {formatMinorUnits(prod.price, prod.currency)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {prod.description}
              </p>

              {prod.variants.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {prod.variants.map((v) => (
                    <span
                      key={v.name}
                      className="px-2 py-0.5 rounded text-xs bg-black/5 dark:bg-white/5 font-mono text-muted-foreground"
                    >
                      {v.name}: {v.options.join(', ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  data-testid={`toggle-product-available-${prod.id}`}
                  onClick={() => handleToggleAvailable(prod.id)}
                  disabled={prod.isArchived}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    prod.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${prod.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span>{prod.isAvailable ? 'Available' : 'Sold Out'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid={`edit-product-btn-${prod.id}`}
                    onClick={() => handleOpenEditProduct(prod)}
                    className="p-1.5 rounded-lg text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    data-testid={`duplicate-product-btn-${prod.id}`}
                    onClick={() => handleDuplicate(prod.id)}
                    className="p-1.5 rounded-lg text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] cursor-pointer"
                    title="Duplicate Product"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {!prod.isArchived && (
                    <button
                      type="button"
                      data-testid={`archive-product-btn-${prod.id}`}
                      onClick={() => handleArchive(prod.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Archive Product"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Product Editor Modal */}
      {isEditorOpen && (
        <div
          data-testid="product-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="max-w-lg w-full p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-foreground">
                {editingProduct ? 'Edit Retail Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] text-subtle-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editorError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editorError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  data-testid="input-product-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Silk Blend Slip Dress"
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    data-testid="input-product-price"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    data-testid="input-product-sku"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. VV-DR-01"
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Category
                </label>
                <select
                  data-testid="input-product-cat"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  data-testid="input-product-desc"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Material composition, fit details, or care instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Variants (Format: <code>Size: XS, S, M | Color: Black, White</code>)
                </label>
                <input
                  type="text"
                  data-testid="input-product-variants"
                  value={formVariants}
                  onChange={(e) => setFormVariants(e.target.value)}
                  placeholder="e.g. Size: S, M, L | Color: Cognac, Noir"
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#059669]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formAvailable"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="rounded-sm accent-[#059669] cursor-pointer"
                />
                <label htmlFor="formAvailable" className="font-bold text-foreground cursor-pointer">
                  Available in store and on public catalogue
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E3DB] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-product-btn"
                  className="px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Record In-Store Sale Modal */}
      {isRecordSaleOpen && (
        <div
          data-testid="record-sale-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#059669] uppercase block">
                  IN-STORE SALE
                </span>
                <h3 className="font-heading font-black text-lg text-foreground">
                  Record In-Store Purchase
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordSaleOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] text-subtle-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saleError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saleError}</span>
              </div>
            )}

            {saleSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{saleSuccessNotice}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSale} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Customer Member (CRM)
                </label>
                <select
                  data-testid="sale-customer-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-medium"
                >
                  <option value="">Guest Walk-In (No Loyalty)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currentStamps}/{business.stampsRequired} stamps)
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">
                    Purchased Items ({saleItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSaleItem}
                    className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {saleItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...saleItems];
                          updated[idx].productId = e.target.value;
                          setSaleItems(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-xs truncate"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatMinorUnits(p.price, p.currency)})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...saleItems];
                          updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                          setSaleItems(updated);
                        }}
                        className="w-14 px-2 py-1.5 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-xs font-mono text-center"
                      />

                      {saleItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSaleItem(idx)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal & Loyalty Notice */}
              <div className="p-3 rounded-2xl bg-muted border border-[#E5E3DB] dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Total Amount</span>
                  <span
                    data-testid="sale-total-amount"
                    className="font-heading font-black text-base text-foreground"
                  >
                    {formatMinorUnits(saleSubtotal, business.currency)}
                  </span>
                </div>

                <div className="text-xs text-[#059669] font-medium flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {selectedCustomerId ? (
                    saleSubtotal >= 1500 ? (
                      <span>Qualifies for 1 Loyalty Stamp!</span>
                    ) : (
                      <span>Purchases over $15 qualify for a loyalty stamp.</span>
                    )
                  ) : (
                    <span className="text-subtle-foreground">Select a loyalty member to award stamps.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordSaleOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-muted-foreground hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-sale-btn"
                  className="px-5 py-2 rounded-xl bg-[#059669] text-white font-bold cursor-pointer shadow-md hover:bg-[#047857]"
                >
                  Confirm & Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
