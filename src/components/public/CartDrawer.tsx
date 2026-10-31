import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { CartItem, PublicBusinessProfile, PublicTableProfile } from '../../types/cafe';
import { formatMinorUnits } from '../../types/cafe';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types/order';
import { useRouter } from '../../router';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  business: PublicBusinessProfile;
  table?: PublicTableProfile;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  business,
  table,
}) => {
  const { navigate } = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState('');

  if (!isOpen) return null;

  // Calculate cart subtotal in integer minor units
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (isSubmitting || cart.length === 0) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    const idempotencyKey = `idem_${business.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const res = orderService.createOrder({
      businessId: business.id,
      orderType: table ? 'dine_in' : 'pickup',
      tableId: table?.id,
      tableName: table?.displayName,
      pickupLabel: table ? undefined : 'Counter Pickup Station',
      customerName: customerName.trim() || undefined,
      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
        selectedModifiers: item.selectedModifiers,
        specialInstructions: item.specialInstructions,
      })),
      idempotencyKey,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setSubmissionError(res.error);
      return;
    }

    setCreatedOrder(res.order);
    onClearCart();
  };

  const handleCloseConfirmation = () => {
    setCreatedOrder(null);
    onClose();
  };

  const handleNavigateToTracking = (token: string) => {
    setCreatedOrder(null);
    onClose();
    navigate(`/order/${token}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-card text-foreground shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/20 flex items-center justify-center text-[#3027F5] dark:text-[#E4C174]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-foreground">
                Your Order
              </h3>
              <p className="text-xs text-muted-foreground">
                {table ? `Ordering for ${table.displayName}` : 'Counter / Pickup Order'}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-cart-drawer"
            onClick={onClose}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
            aria-label="Close Order"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Alert */}
        {submissionError && (
          <div className="m-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* Cart Line Items */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {cart.length === 0 ? (
            <div className="p-12 text-center text-subtle-foreground space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
              <div className="font-heading font-black text-base text-foreground">
                Your Cart is Empty
              </div>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Explore the menu and select your favorite coffees, pastries, and signature dishes.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                data-testid={`cart-line-item-${item.cartItemId}`}
                className="p-4 rounded-2xl bg-muted border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-heading font-black text-sm text-foreground">
                      {item.menuItem.name}
                    </h4>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {formatMinorUnits(item.unitPrice, item.menuItem.currency)} each
                    </span>
                  </div>
                  <span className="font-heading font-black text-sm text-foreground">
                    {formatMinorUnits(item.lineTotal, item.menuItem.currency)}
                  </span>
                </div>

                {/* Variants & Modifiers breakdown */}
                {(Object.keys(item.selectedVariants).length > 0 ||
                  Object.keys(item.selectedModifiers).length > 0) && (
                  <div className="text-xs text-muted-foreground space-y-0.5 bg-card p-2 rounded-xl border border-[#E5E3DB] dark:border-white/5">
                    {Object.values(item.selectedVariants).map((v) => (
                      <div key={v.id} className="flex items-center justify-between">
                        <span>• Size: {v.name}</span>
                        {v.priceAdjustment > 0 && (
                          <span className="text-subtle-foreground">
                            +{formatMinorUnits(v.priceAdjustment, item.menuItem.currency)}
                          </span>
                        )}
                      </div>
                    ))}
                    {Object.values(item.selectedModifiers).map((mods) =>
                      mods.map((m) => (
                        <div key={m.id} className="flex items-center justify-between">
                          <span>• {m.name}</span>
                          {m.priceAdjustment > 0 && (
                            <span className="text-subtle-foreground">
                              +{formatMinorUnits(m.priceAdjustment, item.menuItem.currency)}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {item.specialInstructions && (
                  <div className="text-xs text-subtle-foreground italic">
                    Note: "{item.specialInstructions}"
                  </div>
                )}

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 p-1 rounded-xl border border-border bg-card">
                    <button
                      type="button"
                      data-testid={`cart-decrease-qty-${item.cartItemId}`}
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                      className="p-1 rounded text-foreground hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      data-testid={`cart-increase-qty-${item.cartItemId}`}
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                      className="p-1 rounded text-foreground hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid={`cart-remove-${item.cartItemId}`}
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="p-1.5 rounded-lg text-subtle-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-muted space-y-4 flex-shrink-0">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Your Name (for order callout / server)
              </label>
              <input
                type="text"
                data-testid="cart-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-card text-xs text-foreground placeholder:text-subtle-foreground focus:outline-hidden"
              />
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items Subtotal ({totalItemCount})</span>
                <span data-testid="cart-subtotal">{formatMinorUnits(subtotal, business.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-subtle-foreground text-xs">
                <span>Taxes & Service</span>
                <span>Included</span>
              </div>
              <div className="flex items-center justify-between font-heading font-black text-base text-foreground pt-1 border-t border-[#E5E3DB] dark:border-white/10">
                <span>Total Due</span>
                <span data-testid="cart-total">{formatMinorUnits(subtotal, business.currency)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClearCart}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-2xl border border-border bg-card text-subtle-foreground hover:text-red-500 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Clear
              </button>

              <button
                type="button"
                data-testid="place-order-demo-btn"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 rounded-2xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Sending Order...' : 'Send Order to Kitchen'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real Order Confirmation Modal */}
      {createdOrder && (
        <div data-testid="order-confirmation-modal" className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={handleCloseConfirmation}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6 z-10 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block">
                ORDER RECEIVED · {createdOrder.orderNumber}
              </span>
              <h4 className="font-heading font-black text-xl text-foreground mt-0.5">
                Sent to Kitchen Queue!
              </h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {createdOrder.tableName
                  ? `Your order has been queued for ${createdOrder.tableName}. Fresh drinks and kitchen dishes will be served to your table.`
                  : 'Your order has been queued at the pickup counter station.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted border border-border text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Order Total:</span>
                <span data-testid="confirmation-order-total">
                  {formatMinorUnits(createdOrder.total, createdOrder.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Payment:</span>
                <span>Pay at Counter</span>
              </div>
              <div className="text-xs text-subtle-foreground flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3" />
                <span>Estimated prep time: {createdOrder.estimatedWaitMinutes || 6} minutes</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                data-testid="confirm-track-order-btn"
                onClick={() => handleNavigateToTracking(createdOrder.trackingToken)}
                className="w-full py-3 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Order Live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                data-testid="finish-demo-order-btn"
                onClick={handleCloseConfirmation}
                className="w-full py-2.5 rounded-xl border border-border bg-transparent text-muted-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] font-bold text-xs cursor-pointer transition-colors"
              >
                Done / Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
