import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import type { MockBusiness } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type {
  MenuCategory,
  MenuItem,
  DietaryTag,
} from '../../../types/cafe';
import { formatMinorUnits } from '../../../types/cafe';
import { mockCafeService } from '../../../services/mockCafeService';
import { generateBusinessSlug } from '../../../utils/qrUrlBuilder';
import { MenuItemEditModal } from './MenuItemEditModal';
import { MenuEditModal } from './MenuEditModal';

interface CafeMenuViewProps {
  business: MockBusiness;
  theme: ThemeMode;
}

export const CafeMenuView: React.FC<CafeMenuViewProps> = ({ business }) => {
  // Check industry type
  const isFoodService = business.businessType === 'cafe' || business.businessType === 'restaurant';

  // Force re-render on service updates
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = mockCafeService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const menus = mockCafeService.getMenus(business.id);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(() => {
    const list = mockCafeService.getMenus(business.id);
    const published = list.find((m) => m.status === 'published');
    return published ? published.id : list[0]?.id || '';
  });

  const activeMenu = menus.find((m) => m.id === selectedMenuId) || menus[0] || null;
  const categories = activeMenu ? mockCafeService.getCategories(business.id, activeMenu.id) : [];
  const items = activeMenu ? mockCafeService.getItems(business.id, activeMenu.id) : [];

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold_out'>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | DietaryTag>('all');

  // Modals state
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Category inline add/edit state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  // Handle category creation
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !activeMenu) return;

    if (editingCategory) {
      mockCafeService.updateCategory(business.id, editingCategory.id, {
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });
      setEditingCategory(null);
    } else {
      mockCafeService.createCategory(business.id, activeMenu.id, {
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });
    }

    setNewCategoryName('');
    setNewCategoryDesc('');
    setCategoryModalOpen(false);
  };

  const handleEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryDesc(cat.description || '');
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!activeMenu) return;
    if (window.confirm('Delete this category? Items in this category will also be removed.')) {
      mockCafeService.deleteCategory(business.id, activeMenu.id, categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId('all');
      }
    }
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if (!activeMenu) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reorderedIds = reordered.map((c) => c.id);
    mockCafeService.reorderCategories(business.id, activeMenu.id, reorderedIds);
  };

  // Item handlers
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const handleSaveItem = (
    itemData: Omit<MenuItem, 'id' | 'menuId' | 'createdAt' | 'updatedAt' | 'displayOrder'>
  ) => {
    if (!activeMenu) return;
    if (editingItem) {
      mockCafeService.updateItem(business.id, editingItem.id, itemData);
    } else {
      mockCafeService.createItem(business.id, activeMenu.id, itemData);
    }
  };

  const handleDuplicateItem = (itemId: string) => {
    mockCafeService.duplicateItem(business.id, itemId);
  };

  const handleToggleItemStatus = (itemId: string) => {
    mockCafeService.toggleItemAvailability(business.id, itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      mockCafeService.deleteItem(business.id, itemId);
    }
  };

  // If business is not cafe / restaurant
  if (!isFoodService) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Utensils className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Café & Restaurant Module Not Active
          </h2>
          <p className="text-sm text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
            The active business (<strong>{business.name}</strong>) is configured as a{' '}
            <strong>{business.businessType}</strong>. Café menu management and table QR ordering are scoped strictly to food & beverage establishments.
          </p>
          <p className="text-xs text-[#868A94]">
            Switch to a café workspace from the top-left business selector to test digital menu management.
          </p>
        </div>
      </div>
    );
  }

  // If no menus exist for this cafe, show create initial menu CTA
  if (!activeMenu) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/20 flex items-center justify-center mx-auto text-[#3027F5] dark:text-[#E4C174]">
            <Utensils className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            No Menus Created Yet
          </h2>
          <p className="text-sm text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
            Start by creating your first digital menu. You can add categories, customize items with variants, and generate table QR codes.
          </p>
          <button
            type="button"
            onClick={() => {
              const newM = mockCafeService.createMenu(business.id, {
                name: 'All-Day Café Menu',
                description: 'Fresh coffee, bakery, and seasonal specials.',
              });
              setSelectedMenuId(newM.id);
            }}
            className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Menu</span>
          </button>
        </div>
      </div>
    );
  }

  const publicSlug = generateBusinessSlug(business.name);
  const publicMenuUrl = `/menu/${publicSlug}`;

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDietary =
      dietaryFilter === 'all' || (item.dietary && item.dietary.includes(dietaryFilter));

    return matchesCategory && matchesSearch && matchesStatus && matchesDietary;
  });

  const availableCount = items.filter((i) => i.status === 'available').length;
  const soldOutCount = items.filter((i) => i.status === 'sold_out').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              CAFÉ & RESTAURANT MENU
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                activeMenu.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {activeMenu.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            {activeMenu.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1 max-w-2xl">
            {activeMenu.description || 'Manage menu items, categories, variants, and live kitchen availability.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <a
            href={publicMenuUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="preview-public-menu-btn"
            className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Menu Preview</span>
          </a>

          <button
            type="button"
            onClick={() => setMenuModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Menu</span>
          </button>

          <button
            type="button"
            data-testid="add-item-btn"
            onClick={handleOpenCreateItem}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            CATEGORIES
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {categories.length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            TOTAL ITEMS
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {items.length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            AVAILABLE
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {availableCount}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            SOLD OUT
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-amber-600 dark:text-amber-400">
            {soldOutCount}
          </div>
        </div>
      </div>

      {/* 3. Category Selector & Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase tracking-wider">
            Menu Categories
          </span>
          <button
            type="button"
            data-testid="add-category-btn"
            onClick={() => {
              setEditingCategory(null);
              setNewCategoryName('');
              setNewCategoryDesc('');
              setCategoryModalOpen(true);
            }}
            className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                : 'bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-[#60646C] dark:text-[#D0CBC1] hover:bg-[#F8F7F2]'
            }`}
          >
            All Items ({items.length})
          </button>

          {categories.map((cat, idx) => {
            const catCount = items.filter((i) => i.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <div key={cat.id} className="relative group flex items-center">
                <button
                  type="button"
                  data-testid={`category-tab-${cat.id}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                      : 'bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-[#60646C] dark:text-[#D0CBC1] hover:bg-[#F8F7F2]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white dark:text-[#11100D]'
                        : 'bg-[#F8F7F2] dark:bg-[#1A1916] text-[#868A94]'
                    }`}
                  >
                    {catCount}
                  </span>
                </button>

                {/* Category quick controls on hover */}
                <div className="hidden group-hover:flex items-center gap-1 ml-1 pl-1 border-l border-[#E5E3DB] dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-[#868A94] hover:text-[#111318] disabled:opacity-30 cursor-pointer"
                    title="Move Category Left"
                  >
                    <ChevronUp className="w-3 h-3 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(idx, 'down')}
                    disabled={idx === categories.length - 1}
                    className="p-1 text-[#868A94] hover:text-[#111318] disabled:opacity-30 cursor-pointer"
                    title="Move Category Right"
                  >
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditCategory(cat)}
                    className="p-1 text-[#868A94] hover:text-[#3027F5] cursor-pointer"
                    title="Edit Category Name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 text-[#868A94] hover:text-red-500 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868A94]" />
          <input
            type="text"
            data-testid="search-menu-items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by title, flavor notes, ingredients..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            data-testid="filter-availability"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'sold_out')}
            className="px-3 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Availability</option>
            <option value="available">Available Only</option>
            <option value="sold_out">Sold Out Only</option>
          </select>

          <select
            data-testid="filter-dietary"
            value={dietaryFilter}
            onChange={(e) => setDietaryFilter(e.target.value as 'all' | DietaryTag)}
            className="px-3 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Diets</option>
            <option value="veg">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten_free">Gluten-Free</option>
            <option value="non_veg">Non-Vegetarian</option>
          </select>
        </div>
      </div>

      {/* 5. Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <Utensils className="w-10 h-10 mx-auto text-[#868A94] mb-3" />
          <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
            No Menu Items Found
          </h4>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || dietaryFilter !== 'all'
              ? 'Try adjusting your search queries or active filters to find matching dishes.'
              : 'Add delicious recipes and beverages to start serving customers through table QR codes.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateItem}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const categoryName = categories.find((c) => c.id === item.categoryId)?.name || 'General';
            const isSoldOut = item.status === 'sold_out';

            return (
              <div
                key={item.id}
                data-testid={`menu-item-card-${item.id}`}
                className={`flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-[#141412] border transition-all ${
                  isSoldOut
                    ? 'border-amber-300 dark:border-amber-800/40 opacity-80'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  {/* Category Pill & Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3027F5] dark:text-[#E4C174]">
                      {categoryName}
                    </span>
                    <button
                      type="button"
                      data-testid={`toggle-item-status-${item.id}`}
                      onClick={() => handleToggleItemStatus(item.id)}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                        isSoldOut
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      }`}
                      title="Click to toggle availability"
                    >
                      {isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-heading font-black text-[#111318] dark:text-[#F7F3EB] leading-snug">
                      {item.name}
                    </h3>
                    <span className="text-base font-heading font-black text-[#111318] dark:text-[#F7F3EB] whitespace-nowrap">
                      {formatMinorUnits(item.price, item.currency)}
                    </span>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Dietary & Customization Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {item.dietary?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#F8F7F2] dark:bg-[#1A1916] text-[#60646C] dark:text-[#D0CBC1] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)]"
                      >
                        {tag === 'veg'
                          ? 'Veg'
                          : tag === 'vegan'
                          ? 'Vegan'
                          : tag === 'gluten_free'
                          ? 'Gluten-Free'
                          : 'Non-Veg'}
                      </span>
                    ))}

                    {item.variantGroups && item.variantGroups.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174] flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{item.variantGroups.length} sizes</span>
                      </span>
                    )}

                    {item.modifierGroups && item.modifierGroups.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174] flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>{item.modifierGroups.length} modifier groups</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`duplicate-item-${item.id}`}
                      onClick={() => handleDuplicateItem(item.id)}
                      className="p-1.5 rounded-lg text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
                      title="Duplicate Item"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-item-${item.id}`}
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-[#868A94] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid={`edit-item-${item.id}`}
                    onClick={() => handleOpenEditItem(item)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] hover:bg-white dark:hover:bg-[#201F1B] text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Item</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Menu Edit Modal */}
      <MenuEditModal
        isOpen={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        menu={activeMenu}
        onSave={(updates) => {
          mockCafeService.updateMenu(business.id, activeMenu.id, updates);
        }}
      />

      {/* Item Edit/Create Modal */}
      <MenuItemEditModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        categories={categories}
        currency={activeMenu.currency}
        currencySymbol={activeMenu.currencySymbol}
        onQuickCreateCategory={(catName) => {
          return mockCafeService.createCategory(business.id, activeMenu.id, {
            name: catName,
          });
        }}
      />

      {/* Category Create/Edit Dialog */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setCategoryModalOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] mb-3">
              {editingCategory ? 'Edit Category' : 'Create Menu Category'}
            </h4>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  data-testid="category-name-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Specialty Beverages"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] mb-1">
                  Optional Description
                </label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="e.g. Handcrafted single-origin drinks"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-category-btn"
                  className="px-5 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
