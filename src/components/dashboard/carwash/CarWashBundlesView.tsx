import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  UserCheck,
  Calendar,
  X,
  AlertCircle,
  Car,
  Layers,
  Search,
} from 'lucide-react';
import { carWashService } from '../../../services/carWashService';
import type {
  CarWashBundle,
  CarWashCustomerPass,
  CarWashBundleType,
} from '../../../types/carwash';
import { loyaltyService } from '../../../services/loyaltyService';
import { businessService } from '../../../services/businessService';

interface CarWashBundlesViewProps {
  businessId: string;
}

export const CarWashBundlesView: React.FC<CarWashBundlesViewProps> = ({ businessId }) => {
  const [bundles, setBundles] = useState<CarWashBundle[]>([]);
  const [passes, setPasses] = useState<CarWashCustomerPass[]>([]);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create bundle form
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundlePriceMajor, setBundlePriceMajor] = useState('');
  const [bundleType, setBundleType] = useState<CarWashBundleType>('visit_pack');
  const [totalVisits, setTotalVisits] = useState(5);
  const [validityDays, setValidityDays] = useState(90);
  const [bundleError, setBundleError] = useState<string | null>(null);

  // Assign pass form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const business = businessService.getBusinessById(businessId);
  const currencySymbol = business?.currency === 'INR' ? '₹' : '$';
  const customers = loyaltyService.getCustomers(businessId);

  const loadData = () => {
    setBundles(carWashService.getBundles(businessId));
    setPasses(carWashService.getPasses(businessId));
  };

  useEffect(() => {
    loadData();
    const unsub = carWashService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [businessId]);

  const handleCreateBundle = (e: React.FormEvent) => {
    e.preventDefault();
    setBundleError(null);

    const priceCents = Math.round(parseFloat(bundlePriceMajor) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setBundleError('Please enter a valid package price.');
      return;
    }

    const res = carWashService.createBundle({
      businessId,
      name: bundleName,
      description: bundleDescription,
      price: priceCents,
      bundleType,
      totalVisits: bundleType === 'visit_pack' ? Number(totalVisits) : undefined,
      validityDays: Number(validityDays),
      includedServices: [],
    });

    if (res.success) {
      setShowBundleModal(false);
      setBundleName('');
      setBundleDescription('');
      setBundlePriceMajor('');
      loadData();
    } else {
      setBundleError(res.error || 'Failed to create bundle.');
    }
  };

  const handleAssignPass = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) {
      setAssignError('Please select a customer.');
      return;
    }

    const res = carWashService.assignPass({
      businessId,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phoneNumber,
      customerEmail: cust.email,
      vehiclePlate: vehiclePlate.trim() || undefined,
      vehicleMakeModel: vehicleMakeModel.trim() || undefined,
      bundleId: selectedBundleId,
    });

    if (res.success) {
      setShowAssignModal(false);
      setSelectedCustomerId('');
      setVehiclePlate('');
      setVehicleMakeModel('');
      setSelectedBundleId('');
      loadData();
    } else {
      setAssignError(res.error || 'Failed to assign wash pass.');
    }
  };

  const filteredPasses = passes.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.customerName.toLowerCase().includes(q) ||
      (p.vehiclePlate && p.vehiclePlate.toLowerCase().includes(q)) ||
      p.bundleName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8" data-testid="carwash-bundles-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Prepaid Wash Bundles & Passes</h2>
          <p className="text-sm text-muted-foreground">
            Manage multi-wash punch passes, unlimited monthly wash subscriptions, and active vehicle passes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBundleModal(true)}
            data-testid="create-bundle-btn"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/80 hover:bg-muted text-foreground font-semibold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Package</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (bundles.length > 0) setSelectedBundleId(bundles[0].id);
              setShowAssignModal(true);
            }}
            data-testid="assign-pass-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign Pass to Customer</span>
          </button>
        </div>
      </div>

      {/* Package Offerings Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span>Configured Wash Packages</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              data-testid={`bundle-card-${bundle.id}`}
              className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {bundle.bundleType === 'visit_pack' ? 'Punch Pass' : 'Unlimited Subscription'}
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-0.5">{bundle.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">
                    {currencySymbol}{(bundle.price / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {bundle.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{bundle.description}</p>
              )}

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {bundle.totalVisits ? `${bundle.totalVisits} Washes` : 'Unlimited Washes'}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Valid for {bundle.validityDays} days</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Passes Roster */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              <span>Customer Wash Passes</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Vehicles and customers registered with active, exhausted, or expired passes.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by driver, plate..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="customer-passes-table">
              <thead className="bg-muted/40 border-b border-border/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer & Vehicle</th>
                  <th className="px-5 py-3.5">Pass Package</th>
                  <th className="px-5 py-3.5">Washes Left</th>
                  <th className="px-5 py-3.5">Valid Until</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No wash passes found. Click &quot;Assign Pass to Customer&quot; to issue one.
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((pass) => (
                    <tr
                      key={pass.id}
                      data-testid={`pass-row-${pass.id}`}
                      className="hover:bg-muted/30 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground">{pass.customerName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {pass.vehiclePlate && (
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] font-semibold text-foreground border border-border/40">
                              {pass.vehiclePlate}
                            </span>
                          )}
                          {pass.vehicleMakeModel && <span>{pass.vehicleMakeModel}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-foreground font-medium">
                        {pass.bundleName}
                      </td>
                      <td className="px-5 py-3.5">
                        {pass.remainingVisits !== undefined ? (
                          <span
                            className={`font-semibold ${
                              pass.remainingVisits === 0 ? 'text-rose-500' : 'text-foreground'
                            }`}
                          >
                            {pass.remainingVisits} / {pass.totalVisits || pass.remainingVisits}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Unlimited
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {pass.endDate || 'No Expiry'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            pass.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : pass.status === 'exhausted'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {pass.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Package Modal */}
      {showBundleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="create-bundle-modal"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Wash Package</h3>
              <button
                type="button"
                onClick={() => setShowBundleModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBundle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  placeholder="E.g., 5-Wash Express Punch Pass"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="bundle-name-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={bundleDescription}
                  onChange={(e) => setBundleDescription(e.target.value)}
                  placeholder="Included benefits, shareability, vehicle rules..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Price ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={bundlePriceMajor}
                    onChange={(e) => setBundlePriceMajor(e.target.value)}
                    placeholder="75.00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="bundle-price-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Package Type
                  </label>
                  <select
                    value={bundleType}
                    onChange={(e) => setBundleType(e.target.value as CarWashBundleType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="visit_pack">Fixed Wash Pack</option>
                    <option value="monthly_pass">Unlimited Subscription</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {bundleType === 'visit_pack' && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Included Washes
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={totalVisits}
                      onChange={(e) => setTotalVisits(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={730}
                    required
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {bundleError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bundleError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBundleModal(false)}
                  className="px-4 py-2 rounded-lg border border-border/80 text-foreground text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-bundle-btn"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Pass Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="assign-pass-modal"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-bold text-foreground">Assign Wash Pass</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignPass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="pass-customer-select"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phoneNumber || c.email || 'No contact'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Wash Package *
                </label>
                <select
                  required
                  value={selectedBundleId}
                  onChange={(e) => setSelectedBundleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="pass-bundle-select"
                >
                  <option value="">-- Choose Package --</option>
                  {bundles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {currencySymbol}{(b.price / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    License Plate (Optional)
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="E.g., CA-7X9821"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="pass-vehicle-plate-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={vehicleMakeModel}
                    onChange={(e) => setVehicleMakeModel(e.target.value)}
                    placeholder="E.g., Honda CR-V"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {assignError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-lg border border-border/80 text-foreground text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCustomerId || !selectedBundleId}
                  data-testid="submit-pass-btn"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
