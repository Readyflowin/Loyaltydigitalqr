import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { carWashService } from '../../../services/carWashService';
import type {
  CarWashService,
  CarWashTier,
} from '../../../types/carwash';
import { businessService } from '../../../services/businessService';

interface CarWashServicesViewProps {
  businessId: string;
}

export const CarWashServicesView: React.FC<CarWashServicesViewProps> = ({ businessId }) => {
  const [services, setServices] = useState<CarWashService[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<CarWashService | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMajor, setPriceMajor] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [tier, setTier] = useState<CarWashTier>('express');
  const [error, setError] = useState<string | null>(null);

  const business = businessService.getBusinessById(businessId);
  const currencySymbol = business?.currency === 'INR' ? '₹' : '$';

  const loadData = () => {
    setServices(carWashService.getServices(businessId));
  };

  useEffect(() => {
    loadData();
    const unsub = carWashService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [businessId]);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPriceMajor('');
    setDurationMinutes(20);
    setTier('express');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (s: CarWashService) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description);
    setPriceMajor((s.price / 100).toFixed(2));
    setDurationMinutes(s.durationMinutes);
    setTier(s.tier);
    setError(null);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceCents = Math.round(parseFloat(priceMajor) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (editingService) {
      const res = carWashService.updateService(businessId, editingService.id, {
        name,
        description,
        price: priceCents,
        durationMinutes: Number(durationMinutes),
        tier,
      });
      if (res.success) {
        setShowModal(false);
        loadData();
      } else {
        setError(res.error || 'Failed to update service.');
      }
    } else {
      const res = carWashService.createService({
        businessId,
        name,
        description,
        price: priceCents,
        durationMinutes: Number(durationMinutes),
        tier,
      });
      if (res.success) {
        setShowModal(false);
        loadData();
      } else {
        setError(res.error || 'Failed to create service.');
      }
    }
  };

  const handleToggleActive = (s: CarWashService) => {
    carWashService.updateService(businessId, s.id, {
      isActive: !s.isActive,
    });
    loadData();
  };

  return (
    <div className="space-y-6" data-testid="carwash-services-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Wash Packages & Services</h2>
          <p className="text-sm text-muted-foreground">
            Configure wash tiers, pricing, tunnel durations, and customer service options.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          data-testid="add-wash-service-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wash Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/40">
            <Layers className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Wash Services Configured</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Add express washes, underbody protectants, ceramic coats, or full detail services.
            </p>
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              data-testid={`wash-service-card-${svc.id}`}
              className={`rounded-xl border bg-card p-5 shadow-sm flex flex-col justify-between space-y-4 transition ${
                svc.isActive ? 'border-border/60 hover:border-border' : 'opacity-60 border-border/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {svc.tier}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(svc)}
                    data-testid={`toggle-service-active-${svc.id}`}
                    className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition ${
                      svc.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {svc.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-foreground mt-2">{svc.name}</h3>
                {svc.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {svc.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{svc.durationMinutes} mins</span>
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {currencySymbol}{(svc.price / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openEditModal(svc)}
                  data-testid={`edit-service-btn-${svc.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold text-foreground transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Service</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="wash-service-modal"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingService ? 'Edit Wash Service' : 'Add Wash Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Deluxe Clean & Underbody"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="service-name-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Includes soft foam, tire blast, hot wax..."
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
                    value={priceMajor}
                    onChange={(e) => setPriceMajor(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="service-price-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Wash Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as CarWashTier)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="express">Express Exterior</option>
                  <option value="deluxe">Deluxe Clean</option>
                  <option value="ultimate">Ultimate Protection</option>
                  <option value="detailing">Full Detailing</option>
                </select>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-border/80 text-foreground text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-service-btn"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
