import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import type {
  MenuItem,
  MenuCategory,
  DietaryTag,
  MenuItemVariantGroup,
  MenuItemModifierGroup,
} from '../../../types/cafe';

interface MenuItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<MenuItem, 'id' | 'menuId' | 'createdAt' | 'updatedAt' | 'displayOrder'>) => void;
  initialItem?: MenuItem | null;
  categories: MenuCategory[];
  currency: 'USD' | 'INR';
  currencySymbol: '$' | '₹';
  onQuickCreateCategory?: (name: string) => MenuCategory;
}

const DIETARY_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'non_veg', label: 'Non-Vegetarian' },
  { id: 'gluten_free', label: 'Gluten-Free' },
];

export const MenuItemEditModal: React.FC<MenuItemEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories,
  currency,
  currencySymbol,
  onQuickCreateCategory,
}) => {
  if (!isOpen) return null;

  return (
    <MenuItemEditModalForm
      key={initialItem?.id || 'new_item'}
      onClose={onClose}
      onSave={onSave}
      initialItem={initialItem}
      categories={categories}
      currency={currency}
      currencySymbol={currencySymbol}
      onQuickCreateCategory={onQuickCreateCategory}
    />
  );
};

interface InnerFormProps {
  onClose: () => void;
  onSave: (itemData: Omit<MenuItem, 'id' | 'menuId' | 'createdAt' | 'updatedAt' | 'displayOrder'>) => void;
  initialItem?: MenuItem | null;
  categories: MenuCategory[];
  currency: 'USD' | 'INR';
  currencySymbol: '$' | '₹';
  onQuickCreateCategory?: (name: string) => MenuCategory;
}

const MenuItemEditModalForm: React.FC<InnerFormProps> = ({
  onClose,
  onSave,
  initialItem,
  categories,
  currency,
  currencySymbol,
  onQuickCreateCategory,
}) => {
  const [name, setName] = useState(initialItem?.name || '');
  const [categoryId, setCategoryId] = useState(initialItem?.categoryId || categories[0]?.id || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  
  // Format initial minor units to decimal string for the input
  const initialPriceStr = initialItem ? (initialItem.price / 100).toFixed(2) : '4.50';
  const [priceInput, setPriceInput] = useState(initialPriceStr);
  const [status, setStatus] = useState<'available' | 'sold_out'>(initialItem?.status || 'available');
  const [dietary, setDietary] = useState<DietaryTag[]>(initialItem?.dietary || []);

  // Variants & Modifiers
  const [variantGroups, setVariantGroups] = useState<MenuItemVariantGroup[]>(
    initialItem?.variantGroups ? JSON.parse(JSON.stringify(initialItem.variantGroups)) : []
  );
  const [modifierGroups, setModifierGroups] = useState<MenuItemModifierGroup[]>(
    initialItem?.modifierGroups ? JSON.parse(JSON.stringify(initialItem.modifierGroups)) : []
  );

  // New Category inline creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [error, setError] = useState<string | null>(null);

  const toggleDietary = (tag: DietaryTag) => {
    setDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddVariantGroup = () => {
    const newGroup: MenuItemVariantGroup = {
      id: `vg_${Date.now()}`,
      name: 'Size Option',
      required: true,
      options: [
        { id: `vo_${Date.now()}_1`, name: 'Regular', priceAdjustment: 0, isDefault: true },
        { id: `vo_${Date.now()}_2`, name: 'Large', priceAdjustment: 75, isDefault: false },
      ],
    };
    setVariantGroups([...variantGroups, newGroup]);
  };

  const handleRemoveVariantGroup = (index: number) => {
    setVariantGroups(variantGroups.filter((_, i) => i !== index));
  };

  const handleAddVariantOption = (groupIndex: number) => {
    const updated = [...variantGroups];
    updated[groupIndex].options.push({
      id: `vo_${Date.now()}`,
      name: 'New Option',
      priceAdjustment: 0,
      isDefault: false,
    });
    setVariantGroups(updated);
  };

  const handleRemoveVariantOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...variantGroups];
    updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optionIndex);
    setVariantGroups(updated);
  };

  const handleAddModifierGroup = () => {
    const newGroup: MenuItemModifierGroup = {
      id: `mg_${Date.now()}`,
      name: 'Add-ons & Options',
      required: false,
      minSelections: 0,
      maxSelections: 3,
      options: [
        { id: `mo_${Date.now()}_1`, name: 'Extra Shot', priceAdjustment: 100 },
        { id: `mo_${Date.now()}_2`, name: 'Flavored Syrup', priceAdjustment: 60 },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const handleRemoveModifierGroup = (index: number) => {
    setModifierGroups(modifierGroups.filter((_, i) => i !== index));
  };

  const handleAddModifierOption = (groupIndex: number) => {
    const updated = [...modifierGroups];
    updated[groupIndex].options.push({
      id: `mo_${Date.now()}`,
      name: 'New Option',
      priceAdjustment: 50,
    });
    setModifierGroups(updated);
  };

  const handleRemoveModifierOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...modifierGroups];
    updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optionIndex);
    setModifierGroups(updated);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !onQuickCreateCategory) return;
    const cat = onQuickCreateCategory(newCatName.trim());
    setCategoryId(cat.id);
    setNewCatName('');
    setShowNewCatInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    if (!categoryId) {
      setError('Please select or create a category for this item.');
      return;
    }

    const parsedPrice = parseFloat(priceInput);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please provide a valid price (e.g. 4.50 or 0 for complimentary).');
      return;
    }

    // Convert to integer minor units (cents / paise)
    const priceInMinorUnits = Math.round(parsedPrice * 100);

    onSave({
      name: name.trim(),
      categoryId,
      description: description.trim(),
      price: priceInMinorUnits,
      currency,
      status,
      dietary: dietary.length > 0 ? dietary : undefined,
      variantGroups: variantGroups.length > 0 ? variantGroups : undefined,
      modifierGroups: modifierGroups.length > 0 ? modifierGroups : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              {initialItem ? 'EDIT MENU ITEM' : 'ADD NEW MENU ITEM'}
            </span>
            <h3 className="text-xl font-heading font-black text-foreground mt-0.5">
              {initialItem ? `Edit ${initialItem.name}` : 'Create Menu Item'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Item Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vanilla Bean Flat White"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Category <span className="text-red-500">*</span>
                </label>
                {onQuickCreateCategory && !showNewCatInput && (
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(true)}
                    className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                  >
                    + New Category
                  </button>
                )}
              </div>

              {showNewCatInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted text-xs text-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(false)}
                    className="p-2 text-xs text-[#60646C] hover:text-[#111318] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Base Price ({currency}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-subtle-foreground">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Description & Tasting Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Highlight ingredients, flavor profiles, or allergen notes..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>
          </div>

          {/* Availability & Dietary Tags */}
          <div className="p-4 rounded-2xl bg-muted border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Kitchen Availability
                </span>
                <span className="text-xs text-muted-foreground">
                  Quickly mark as sold out during peak hours without deleting the item.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatus(status === 'available' ? 'sold_out' : 'available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status === 'available'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {status === 'available' ? 'Available' : 'Sold Out'}
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-foreground block mb-2">
                Dietary & Allergen Badges
              </span>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => {
                  const active = dietary.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleDietary(opt.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174]'
                          : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-card text-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variants Section (e.g. Size: Small, Regular, Large) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Variant Groups (Size / Portion)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Mutually exclusive options like Small, Regular, Large.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariantGroup}
                className="px-3 py-1.5 rounded-xl border border-[#3027F5] dark:border-[#E4C174] text-[#3027F5] dark:text-[#E4C174] text-xs font-bold hover:bg-[#3027F5]/10 dark:hover:bg-[#E4C174]/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant Group</span>
              </button>
            </div>

            {variantGroups.map((group, gIdx) => (
              <div
                key={group.id}
                className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => {
                      const updated = [...variantGroups];
                      updated[gIdx].name = e.target.value;
                      setVariantGroups(updated);
                    }}
                    placeholder="Group Name (e.g. Size)"
                    className="font-bold text-xs px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantGroup(gIdx)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {group.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...variantGroups];
                          updated[gIdx].options[oIdx].name = e.target.value;
                          setVariantGroups(updated);
                        }}
                        placeholder="Option name (e.g. Large)"
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground"
                      />
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-xs text-subtle-foreground">+{currencySymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={(opt.priceAdjustment / 100).toFixed(2)}
                          onChange={(e) => {
                            const updated = [...variantGroups];
                            const val = parseFloat(e.target.value) || 0;
                            updated[gIdx].options[oIdx].priceAdjustment = Math.round(val * 100);
                            setVariantGroups(updated);
                          }}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-muted text-foreground"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantOption(gIdx, oIdx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddVariantOption(gIdx)}
                    className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Option</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modifiers Section (e.g. Milk, Syrups, Add-ons) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Modifier & Add-on Groups
                </h4>
                <p className="text-xs text-muted-foreground">
                  Milk choices, extra shots, flavor syrups, toppings.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddModifierGroup}
                className="px-3 py-1.5 rounded-xl border border-[#3027F5] dark:border-[#E4C174] text-[#3027F5] dark:text-[#E4C174] text-xs font-bold hover:bg-[#3027F5]/10 dark:hover:bg-[#E4C174]/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Modifier Group</span>
              </button>
            </div>

            {modifierGroups.map((group, gIdx) => (
              <div
                key={group.id}
                className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => {
                      const updated = [...modifierGroups];
                      updated[gIdx].name = e.target.value;
                      setModifierGroups(updated);
                    }}
                    placeholder="Group Name (e.g. Milk Choice)"
                    className="font-bold text-xs px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.required}
                        onChange={(e) => {
                          const updated = [...modifierGroups];
                          updated[gIdx].required = e.target.checked;
                          setModifierGroups(updated);
                        }}
                      />
                      <span>Required</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveModifierGroup(gIdx)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...modifierGroups];
                          updated[gIdx].options[oIdx].name = e.target.value;
                          setModifierGroups(updated);
                        }}
                        placeholder="Option name (e.g. Oat Milk)"
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground"
                      />
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-xs text-subtle-foreground">+{currencySymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={(opt.priceAdjustment / 100).toFixed(2)}
                          onChange={(e) => {
                            const updated = [...modifierGroups];
                            const val = parseFloat(e.target.value) || 0;
                            updated[gIdx].options[oIdx].priceAdjustment = Math.round(val * 100);
                            setModifierGroups(updated);
                          }}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-muted text-foreground"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveModifierOption(gIdx, oIdx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddModifierOption(gIdx)}
                    className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Option</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-semibold hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {initialItem ? 'Save Item Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
