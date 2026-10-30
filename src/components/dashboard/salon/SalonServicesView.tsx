import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Plus,
  Search,
  Clock,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { SalonService } from '../../../types/salon';
import { salonService } from '../../../services/salonService';
import { formatMinorUnits } from '../../../types/cafe';
import { useRouter } from '../../../router';
import { generateBusinessSlug } from '../../../utils/qrUrlBuilder';

interface SalonServicesViewProps {
  business: Business;
  theme: ThemeMode;
}

export const SalonServicesView: React.FC<SalonServicesViewProps> = ({ business }) => {
  const { navigate } = useRouter();
  const isSalon = business.businessType === 'salon';

  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = salonService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState(45);
  const [formPriceDollars, setFormPriceDollars] = useState('45.00');
  const [formCategory, setFormCategory] = useState('Haircuts');
  const [formBufferAfter, setFormBufferAfter] = useState(5);
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formAssignedStaffIds, setFormAssignedStaffIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const services = salonService.getServices(business.id);
  const staffList = salonService.getStaff(business.id);

  if (!isSalon) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Scissors className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Salon Services Module Unavailable
          </h3>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
            This module is reserved for salons, barbershops, and appointment-based businesses. The active workspace is registered as a {business.businessType}.
          </p>
        </div>
      </div>
    );
  }

  // Extract unique categories
  const categories = Array.from(new Set(services.map((s) => s.category || 'General')));

  // Filter services
  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || (srv.category || 'General') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const activeCount = services.filter((s) => s.isEnabled).length;
  const avgDuration =
    services.length > 0
      ? Math.round(services.reduce((acc, s) => acc + s.durationMinutes, 0) / services.length)
      : 0;

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setFormName('');
    setFormDescription('');
    setFormDuration(45);
    setFormPriceDollars('45.00');
    setFormCategory('Haircuts');
    setFormBufferAfter(5);
    setFormIsEnabled(true);
    setFormAssignedStaffIds(staffList.map((s) => s.id));
    setFormError(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditModal = (service: SalonService) => {
    setEditingService(service);
    setFormName(service.name);
    setFormDescription(service.description);
    setFormDuration(service.durationMinutes);
    setFormPriceDollars((service.price / 100).toFixed(2));
    setFormCategory(service.category || 'Haircuts');
    setFormBufferAfter(service.bufferAfterMinutes || 0);
    setFormIsEnabled(service.isEnabled);
    setFormAssignedStaffIds([...service.assignedStaffIds]);
    setFormError(null);
    setEditorModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Service name is required.');
      return;
    }

    const priceNum = parseFloat(formPriceDollars);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid nonnegative price.');
      return;
    }
    const priceMinor = Math.round(priceNum * 100);

    if (formDuration <= 0) {
      setFormError('Duration must be greater than 0 minutes.');
      return;
    }

    if (editingService) {
      salonService.updateService(business.id, editingService.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        durationMinutes: formDuration,
        price: priceMinor,
        category: formCategory,
        bufferAfterMinutes: formBufferAfter,
        isEnabled: formIsEnabled,
        assignedStaffIds: formAssignedStaffIds,
      });
    } else {
      salonService.createService(business.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        durationMinutes: formDuration,
        price: priceMinor,
        currency: business.currency || 'USD',
        category: formCategory,
        bufferAfterMinutes: formBufferAfter,
        isEnabled: formIsEnabled,
        assignedStaffIds: formAssignedStaffIds,
        displayOrder: services.length + 1,
      });
    }

    setEditorModalOpen(false);
  };

  const handleToggleActive = (service: SalonService) => {
    salonService.updateService(business.id, service.id, {
      isEnabled: !service.isEnabled,
    });
  };

  const handleDuplicate = (serviceId: string) => {
    salonService.duplicateService(business.id, serviceId);
  };

  const handleDelete = (serviceId: string) => {
    if (confirm('Are you sure you want to remove this service?')) {
      salonService.deleteService(business.id, serviceId);
    }
  };

  const publicBookingSlug = generateBusinessSlug(business.name);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            SALON & BARBERSHOP CATALOGUE
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Service Menu & Pricing
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Configure haircuts, treatments, duration, and assigned stylists.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="preview-booking-flow-btn"
            onClick={() => navigate(`/book/${publicBookingSlug}`)}
            className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#141412] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Booking Page</span>
          </button>

          <button
            type="button"
            data-testid="add-service-btn"
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            TOTAL SERVICES
          </span>
          <div className="text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {services.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            ACTIVE BOOKABLE
          </span>
          <div className="text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            AVG DURATION
          </span>
          <div className="text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {avgDuration} min
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            ACTIVE STYLISTS
          </span>
          <div className="text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {staffList.filter((s) => s.isActive).length}
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868A94]" />
          <input
            type="text"
            data-testid="search-services-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by name or description..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] placeholder-[#868A94] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            data-testid="cat-filter-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                : 'text-[#60646C] dark:text-[#D0CBC1] bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-white/10'
            }`}
          >
            All Categories ({services.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              data-testid={`cat-filter-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'text-[#60646C] dark:text-[#D0CBC1] bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-3">
          <Scissors className="w-10 h-10 mx-auto text-[#868A94]" />
          <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
            No services found
          </h4>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
            Try adjusting your search query or add a new service to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const assignedStaff = staffList.filter((s) =>
              service.assignedStaffIds.includes(s.id)
            );

            return (
              <div
                key={service.id}
                data-testid={`service-card-${service.id}`}
                className={`p-5 rounded-3xl bg-white dark:bg-[#141412] border transition-all flex flex-col justify-between ${
                  service.isEnabled
                    ? 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:shadow-md'
                    : 'border-amber-200 dark:border-amber-900/30 opacity-70 bg-amber-50/20'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar with Category & Active Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-lg bg-[#F8F7F2] dark:bg-[#1A1916] text-[#868A94]">
                      {service.category || 'General'}
                    </span>

                    <button
                      type="button"
                      data-testid={`toggle-service-btn-${service.id}`}
                      onClick={() => handleToggleActive(service)}
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                        service.isEnabled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {service.isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] leading-tight">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Duration & Buffer */}
                  <div className="flex items-center gap-3 text-xs text-[#868A94] font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{service.durationMinutes} min</span>
                    </span>
                    {service.bufferAfterMinutes ? (
                      <span>+{service.bufferAfterMinutes}m buffer</span>
                    ) : null}
                    <span className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB] ml-auto">
                      {formatMinorUnits(service.price, service.currency)}
                    </span>
                  </div>

                  {/* Assigned Staff */}
                  <div className="pt-2 border-t border-[#E5E3DB] dark:border-white/10">
                    <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
                      ASSIGNED STYLISTS ({assignedStaff.length})
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {assignedStaff.length > 0 ? (
                        assignedStaff.map((stf) => (
                          <span
                            key={stf.id}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#F8F7F2] dark:bg-[#1A1916] text-[#4A4D55] dark:text-[#D0CBC1]"
                          >
                            {stf.displayName}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#868A94] italic">
                          No staff assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-[#E5E3DB] dark:border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`edit-service-btn-${service.id}`}
                    onClick={() => handleOpenEditModal(service)}
                    className="px-3 py-1.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] text-xs font-bold text-[#111318] dark:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`duplicate-service-btn-${service.id}`}
                      onClick={() => handleDuplicate(service.id)}
                      className="p-1.5 rounded-xl text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
                      title="Duplicate service"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-service-btn-${service.id}`}
                      onClick={() => handleDelete(service.id)}
                      className="p-1.5 rounded-xl text-[#868A94] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create / Edit Service Modal */}
      {editorModalOpen && (
        <div
          data-testid="service-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setEditorModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorModalOpen(false)}
                className="p-1.5 rounded-xl text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  data-testid="input-service-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Signature Beard Trim & Lineup"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                  Description
                </label>
                <textarea
                  data-testid="input-service-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of what is included..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                    Duration (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-testid="input-service-duration"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes (1.5 hr)</option>
                    <option value={120}>120 minutes (2 hr)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                    Price ({business.currency || 'USD'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    data-testid="input-service-price"
                    value={formPriceDollars}
                    onChange={(e) => setFormPriceDollars(e.target.value)}
                    placeholder="45.00"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    data-testid="input-service-cat"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Haircuts, Shaves"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                    Post-Service Buffer
                  </label>
                  <select
                    value={formBufferAfter}
                    onChange={(e) => setFormBufferAfter(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 min cleanup</option>
                    <option value={10}>10 min cleanup</option>
                    <option value={15}>15 min cleanup</option>
                  </select>
                </div>
              </div>

              {/* Assigned Staff Selection */}
              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1.5 flex items-center justify-between">
                  <span>Assigned Stylists</span>
                  <span className="text-[10px] text-[#868A94]">Who provides this service?</span>
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]">
                  {staffList.map((stf) => {
                    const isChecked = formAssignedStaffIds.includes(stf.id);
                    return (
                      <label
                        key={stf.id}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#141412] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormAssignedStaffIds([...formAssignedStaffIds, stf.id]);
                              } else {
                                setFormAssignedStaffIds(
                                  formAssignedStaffIds.filter((id) => id !== stf.id)
                                );
                              }
                            }}
                            className="rounded text-[#3027F5]"
                          />
                          <span className="font-semibold text-[#111318] dark:text-[#F7F3EB]">
                            {stf.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#868A94]">{stf.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10">
                <div>
                  <span className="font-bold text-[#111318] dark:text-[#F7F3EB] block">
                    Public Booking Availability
                  </span>
                  <span className="text-[11px] text-[#868A94]">
                    Disabled services will not appear on the customer booking page.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsEnabled}
                  onChange={(e) => setFormIsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3027F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E3DB] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-service-btn"
                  className="px-5 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingService ? 'Save Changes' : 'Create Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
