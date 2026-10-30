import React, { useState } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import type {
  MenuItem,
  MenuItemVariantOption,
  MenuItemModifierOption,
  MenuItemModifierGroup,
  CartItem,
} from '../../types/cafe';
import { formatMinorUnits } from '../../types/cafe';

interface ItemCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToCart: (cartItem: CartItem) => void;
  accentColor?: string;
}

export const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  isOpen,
  onClose,
  item,
  onAddToCart,
  accentColor = '#3027F5',
}) => {
  if (!isOpen || !item) return null;

  return (
    <ItemCustomizationModalForm
      key={item.id}
      item={item}
      onClose={onClose}
      onAddToCart={onAddToCart}
      accentColor={accentColor}
    />
  );
};

interface InnerFormProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  accentColor: string;
}

const ItemCustomizationModalForm: React.FC<InnerFormProps> = ({
  item,
  onClose,
  onAddToCart,
  accentColor,
}) => {
  // Pre-select default variant for each variant group
  const [selectedVariants, setSelectedVariants] = useState<{ [groupId: string]: MenuItemVariantOption }>(() => {
    const initial: { [groupId: string]: MenuItemVariantOption } = {};
    if (item.variantGroups) {
      item.variantGroups.forEach((group) => {
        const defaultOpt = group.options.find((o) => o.isDefault) || group.options[0];
        if (defaultOpt) {
          initial[group.id] = defaultOpt;
        }
      });
    }
    return initial;
  });

  // Pre-select modifiers
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: string]: MenuItemModifierOption[] }>(() => {
    const initial: { [groupId: string]: MenuItemModifierOption[] } = {};
    if (item.modifierGroups) {
      item.modifierGroups.forEach((group) => {
        const defaults = group.options.filter((o) => o.isDefault);
        if (defaults.length > 0) {
          initial[group.id] = defaults;
        } else if (group.required && group.minSelections > 0 && group.options[0]) {
          initial[group.id] = [group.options[0]];
        } else {
          initial[group.id] = [];
        }
      });
    }
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSoldOut = item.status === 'sold_out';

  // Toggle variant option (mutually exclusive)
  const handleSelectVariant = (groupId: string, option: MenuItemVariantOption) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [groupId]: option,
    }));
  };

  // Toggle modifier option
  const handleToggleModifier = (group: MenuItemModifierGroup, option: MenuItemModifierOption) => {
    const current = selectedModifiers[group.id] || [];
    const exists = current.some((o) => o.id === option.id);

    if (group.maxSelections === 1) {
      // Single select behavior (like radio)
      setSelectedModifiers((prev) => ({
        ...prev,
        [group.id]: [option],
      }));
    } else {
      // Multi-select behavior
      if (exists) {
        setSelectedModifiers((prev) => ({
          ...prev,
          [group.id]: current.filter((o) => o.id !== option.id),
        }));
      } else {
        if (current.length >= group.maxSelections) {
          return; // Max reached
        }
        setSelectedModifiers((prev) => ({
          ...prev,
          [group.id]: [...current, option],
        }));
      }
    }
  };

  // Calculate live unit price in integer minor units
  let unitPrice = item.price;
  Object.values(selectedVariants).forEach((v) => {
    unitPrice += v.priceAdjustment;
  });
  Object.values(selectedModifiers).forEach((mods) => {
    mods.forEach((m) => {
      unitPrice += m.priceAdjustment;
    });
  });

  const lineTotal = unitPrice * quantity;

  const handleAdd = () => {
    setValidationError(null);

    // Validate required modifier groups
    if (item.modifierGroups) {
      for (const group of item.modifierGroups) {
        const count = (selectedModifiers[group.id] || []).length;
        if (group.required && count < group.minSelections) {
          setValidationError(`Please select at least ${group.minSelections} option for "${group.name}".`);
          return;
        }
      }
    }

    const cartItem: CartItem = {
      cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, menuItem: item, selectedVariants, selectedModifiers, quantity, unitPrice, lineTotal, specialInstructions: specialInstructions.trim() || undefined, }; onAddToCart(cartItem); onClose(); }; return ( <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"> <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} aria-hidden="true" /> <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#141412] border-t-2 sm:border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 overflow-hidden"> {/* Header */} <div className="p-5 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-start justify-between flex-shrink-0"> <div> <div className="flex items-center gap-2 mb-1"> <span className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]"> {item.name} </span> {isSoldOut && ( <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"> SOLD OUT </span> )} </div> <div className="text-sm font-bold text-[#111318] dark:text-[#F7F3EB]"> Base {formatMinorUnits(item.price, item.currency)} </div> </div> <button type="button" onClick={onClose} className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer" aria-label="Close" > <X className="w-5 h-5" /> </button> </div> {/* Scrollable Content */} <div className="p-5 space-y-6 overflow-y-auto flex-1"> {item.description && ( <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed"> {item.description} </p> )} {validationError && ( <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2"> <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span>{validationError}</span> </div> )} {/* Variant Groups (e.g. Size: Small, Regular, Large) */} {item.variantGroups?.map((group) => { const currentSelected = selectedVariants[group.id]; return ( <div key={group.id} className="space-y-2.5"> <div className="flex items-center justify-between"> <span className="text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-[#F7F3EB]"> {group.name} {group.required && <span className="text-red-500">*</span>} </span> <span className="text-[10px] text-subtle-foreground">Select one</span> </div> <div className="space-y-2"> {group.options.map((opt) => { const isSelected = currentSelected?.id === opt.id; return ( <button key={opt.id} type="button" data-testid={`variant-opt-${opt.id}`}
                        onClick={() => handleSelectVariant(group.id, opt)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                            : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] hover:bg-[#F8F7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-[#3027F5] dark:border-[#E4C174]'
                                : 'border-[#868A94]'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#3027F5] dark:bg-[#E4C174]" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                            {opt.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#60646C] dark:text-[#D0CBC1]">
                          {opt.priceAdjustment === 0
                            ? 'Included'
                            : `+${formatMinorUnits(opt.priceAdjustment, item.currency)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Modifier Groups (e.g. Milk Choice, Extra Add-ons) */}
          {item.modifierGroups?.map((group) => {
            const currentSelected = selectedModifiers[group.id] || [];

            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-[#F7F3EB]">
                    {group.name} {group.required && <span className="text-red-500">*</span>}
                  </span>
                  <span className="text-[10px] text-subtle-foreground">
                    {group.maxSelections === 1
                      ? 'Select 1 option'
                      : `Select up to ${group.maxSelections} options`}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.options.map((opt) => {
                    const isSelected = currentSelected.some((o) => o.id === opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`modifier-opt-${opt.id}`}
                        onClick={() => handleToggleModifier(group, opt)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                            : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] hover:bg-[#F8F7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-[#3027F5] bg-[#3027F5] dark:border-[#E4C174] dark:bg-[#E4C174]'
                                : 'border-[#868A94]'
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white dark:text-[#11100D] stroke-[3]" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                            {opt.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#60646C] dark:text-[#D0CBC1]">
                          {opt.priceAdjustment === 0
                            ? 'Included'
                            : `+${formatMinorUnits(opt.priceAdjustment, item.currency)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111318] dark:text-[#F7F3EB] mb-2">
              Special Instructions
            </label>
            <input
              type="text"
              data-testid="item-special-instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra hot, no lid, light ice..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
            />
          </div>
        </div>

        {/* Bottom Bar: Quantity & Add to Order CTA */}
        <div className="p-4 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] flex items-center justify-between gap-4 flex-shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 p-1 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-[#F8F7F2] dark:bg-[#1A1916]">
            <button
              type="button"
              data-testid="decrease-qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isSoldOut}
              className="p-1.5 rounded-lg text-[#111318] dark:text-[#F7F3EB] hover:bg-white dark:hover:bg-[#201F1B] disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              data-testid="item-quantity-display"
              className="w-6 text-center text-xs font-bold text-[#111318] dark:text-[#F7F3EB]"
            >
              {quantity}
            </span>
            <button
              type="button"
              data-testid="increase-qty-btn"
              onClick={() => setQuantity(quantity + 1)}
              disabled={isSoldOut}
              className="p-1.5 rounded-lg text-[#111318] dark:text-[#F7F3EB] hover:bg-white dark:hover:bg-[#201F1B] disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            type="button"
            data-testid="confirm-add-to-cart-btn"
            onClick={handleAdd}
            disabled={isSoldOut}
            style={!isSoldOut && accentColor ? { backgroundColor: accentColor } : undefined}
            className={`flex-1 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-between cursor-pointer ${
              isSoldOut
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 cursor-not-allowed'
                : 'text-white'
            }`}
          >
            <span>{isSoldOut ? 'Sold Out' : 'Add to Order'}</span>
            {!isSoldOut && (
              <span data-testid="modal-line-total">
                {formatMinorUnits(lineTotal, item.currency)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
