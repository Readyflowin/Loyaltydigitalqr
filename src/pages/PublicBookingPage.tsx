import React, { useState } from 'react';
import {
  Scissors,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  MapPin,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from '../router';
import { salonService } from '../services/salonService';
import { formatMinorUnits } from '../types/cafe';
import { formatTimeLabel } from '../utils/salonScheduling';
import type { ThemeMode } from '../types';
import type { SalonService, TimeSlot, SalonAppointment } from '../types/salon';
import { localDateKey } from '../utils/dates';

interface PublicBookingPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

function generateAvailableDates(): { dateStr: string; label: string; dayName: string }[] {
  const dates: { dateStr: string; label: string; dayName: string }[] = [];
  const base = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const dateStr = localDateKey(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const label = `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`;
    dates.push({ dateStr, label, dayName });
  }
  return dates;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({
  theme,
  onThemeToggle,
}) => {
  const { currentPath, searchParams, navigate } = useRouter();

  // Extract slug from /book/:slug
  const slug = currentPath.replace(/^\/book\/?/, '').split('/')[0] || '';
  const initialServiceId = searchParams.get('service') || undefined;

  const data = salonService.getPublicBookingProfile(slug);

  // Booking Form State
  const [selectedService, setSelectedService] = useState<SalonService | null>(() => {
    if (data && initialServiceId) {
      return data.services.find((s) => s.id === initialServiceId) || null;
    }
    return null;
  });

  // Flow Step: 1 = Service, 2 = Staff, 3 = Date & Time, 4 = Client Details, 5 = Review, 6 = Confirmed
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (data && initialServiceId && data.services.some((s) => s.id === initialServiceId)) {
      return 2;
    }
    return 1;
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>('any'); // 'any' or specific staffId
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date(new Date().getTime() + 86400000);
    return localDateKey(tomorrow);
  });
  const [availableDates] = useState(() => generateAvailableDates());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(true);

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<SalonAppointment | null>(null);

  // Category filter for services
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Scissors className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Online Booking Unavailable
          </h2>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
            The booking portal for "<strong>{slug}</strong>" could not be found or has no active services listed.
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

  const { business, services, staff } = data;

  // Filter eligible staff for selected service
  const eligibleStaff = selectedService
    ? staff.filter((stf) => stf.assignedServiceIds.includes(selectedService.id))
    : staff;

  // Calculate available slots for current selection
  const availableSlots = selectedService
    ? salonService.getAvailableSlots(
        business.id,
        selectedService.id,
        selectedDate,
        selectedStaffId
      )
    : [];

  // Categories
  const categories = Array.from(new Set(services.map((s) => s.category || 'General')));
  const filteredServices = services.filter(
    (s) => activeCategory === 'all' || (s.category || 'General') === activeCategory
  );

  const handleSelectService = (srv: SalonService) => {
    setSelectedService(srv);
    setSelectedSlot(null);
    setCurrentStep(2);
  };

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setSelectedSlot(null);
    setCurrentStep(3);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep(4);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!clientName.trim()) {
      setBookingError('Please enter your full name.');
      return;
    }
    if (!clientEmail.trim() && !clientPhone.trim()) {
      setBookingError('Please provide an email or phone number.');
      return;
    }
    if (!agreePolicy) {
      setBookingError('Please acknowledge the booking and cancellation policy.');
      return;
    }

    setCurrentStep(5);
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedSlot) return;
    setIsSubmitting(true);
    setBookingError(null);

    const startTimeHhmm = selectedSlot.timeHhmm || selectedSlot.startTime.split('T')[1].substring(0, 5);

    const res = salonService.createAppointment({
      businessId: business.id,
      serviceId: selectedService.id,
      staffId: selectedStaffId,
      date: selectedDate,
      startTime: startTimeHhmm,
      customerName: clientName.trim(),
      customerEmail: clientEmail.trim(),
      customerPhone: clientPhone.trim(),
      customerNotes: clientNotes.trim() || undefined,
      bookingSource: 'public_web',
    });

    setIsSubmitting(false);

    if (!res.success) {
      setBookingError(res.error || 'Booking could not be confirmed.');
      setCurrentStep(3); // return to slot selection if slot was taken
      return;
    }

    setCreatedAppointment(res.appointment!);
    setCurrentStep(6);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB] pb-20 transition-colors duration-200">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141412]/95 backdrop-blur-md border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs"
              style={{ backgroundColor: business.accentColor }}
            >
              {business.logoInitial}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-black text-sm sm:text-base text-[#111318] dark:text-[#F7F3EB] truncate leading-tight">
                {business.name}
              </h1>
              <div className="flex items-center gap-1 text-[11px] text-[#60646C] dark:text-[#D0CBC1] truncate">
                <MapPin className="w-3 h-3 flex-shrink-0 text-subtle-foreground" />
                <span className="truncate">{business.address}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="booking-theme-toggle"
            onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Step Progress Bar */}
      {currentStep < 6 && (
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-subtle-foreground mb-2 font-mono">
            <span>
              STEP {currentStep} OF 5: {
                currentStep === 1
                  ? 'SELECT SERVICE'
                  : currentStep === 2
                  ? 'SELECT STYLIST'
                  : currentStep === 3
                  ? 'DATE & TIME'
                  : currentStep === 4
                  ? 'YOUR DETAILS'
                  : 'REVIEW & CONFIRM'
              }
            </span>
            {currentStep > 1 && (
              <button
                type="button"
                data-testid="step-back-btn"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Go Back</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-1.5 bg-[#E5E3DB] dark:bg-white/10 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5].map((st) => (
              <div
                key={st}
                className={`h-full transition-all duration-300 ${
                  currentStep >= st
                    ? 'bg-[#3027F5] dark:bg-[#E4C174]'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Step Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {bookingError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* STEP 1: Choose Service */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                Select a Service
              </h2>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Choose from our menu of precision haircuts, grooming, and treatments.
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                    : 'text-[#60646C] dark:text-[#D0CBC1] bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-white/10'
                }`}
              >
                All Services
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                      : 'text-[#60646C] dark:text-[#D0CBC1] bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Services List */}
            <div className="space-y-3">
              {filteredServices.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  data-testid={`select-service-${srv.id}`}
                  onClick={() => handleSelectService(srv)}
                  className="w-full text-left p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:border-[#3027F5] dark:hover:border-[#E4C174] hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] group-hover:text-[#3027F5] dark:group-hover:text-[#E4C174] transition-colors truncate">
                        {srv.name}
                      </h3>
                      {srv.category && (
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-[#F8F7F2] dark:bg-[#1A1916] text-subtle-foreground">
                          {srv.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] line-clamp-2">
                      {srv.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-subtle-foreground pt-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{srv.durationMinutes} min</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB] block">
                      {formatMinorUnits(srv.price, srv.currency)}
                    </span>
                    <span className="text-[11px] font-bold text-[#3027F5] dark:text-[#E4C174] inline-flex items-center gap-1 mt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Choose Stylist */}
        {currentStep === 2 && selectedService && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                Choose a Stylist
              </h2>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Select your preferred professional for {selectedService.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option: Any Available Professional */}
              <button
                type="button"
                data-testid="select-staff-any"
                onClick={() => handleSelectStaff('any')}
                className="p-5 rounded-3xl bg-white dark:bg-[#141412] border-2 border-dashed border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] hover:border-[#3027F5] dark:hover:border-[#E4C174] shadow-xs text-left transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center font-bold flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] group-hover:text-[#3027F5] dark:group-hover:text-[#E4C174] transition-colors">
                    Any Available Professional
                  </h3>
                  <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    Maximum schedule flexibility
                  </p>
                </div>
              </button>

              {/* Specific Staff Members */}
              {eligibleStaff.map((stf) => (
                <button
                  key={stf.id}
                  type="button"
                  data-testid={`select-staff-${stf.id}`}
                  onClick={() => handleSelectStaff(stf.id)}
                  className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] hover:border-[#3027F5] dark:hover:border-[#E4C174] shadow-xs text-left transition-all cursor-pointer flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] font-heading font-black text-lg flex items-center justify-center flex-shrink-0">
                    {stf.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] group-hover:text-[#3027F5] dark:group-hover:text-[#E4C174] transition-colors">
                      {stf.displayName}
                    </h3>
                    <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                      {stf.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Select Date & Time */}
        {currentStep === 3 && selectedService && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                Select Date & Time
              </h2>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Showing conflict-free openings for {selectedService.name} ({selectedService.durationMinutes} min).
              </p>
            </div>

            {/* Date Picker Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {availableDates.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    data-testid={`date-chip-${d.dateStr}`}
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setSelectedSlot(null);
                    }}
                    className={`p-3 rounded-2xl min-w-[76px] text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-[#3027F5] bg-[#3027F5] text-white dark:border-[#E4C174] dark:bg-[#E4C174] dark:text-[#11100D] shadow-md'
                        : 'border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] hover:bg-[#F8F7F2]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                      {d.dayName}
                    </span>
                    <span className="font-heading font-black text-sm block mt-0.5">
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Slots Grid */}
            <div>
              <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block mb-3">
                AVAILABLE OPENINGS ({availableSlots.length})
              </span>

              {availableSlots.length === 0 ? (
                <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-subtle-foreground" />
                  <div className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB]">
                    No Available Slots On This Day
                  </div>
                  <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    The studio is either closed or fully booked. Please select another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {availableSlots.map((slot) => {
                    const timeHhmm = slot.timeHhmm || slot.startTime.split('T')[1].substring(0, 5);
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        data-testid={`time-slot-btn-${timeHhmm}`}
                        onClick={() => handleSelectSlot(slot)}
                        className="py-3 px-2 rounded-2xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] bg-white dark:bg-[#141412] hover:border-[#3027F5] dark:hover:border-[#E4C174] hover:bg-[#3027F5]/5 dark:hover:bg-[#E4C174]/10 shadow-xs text-center transition-all cursor-pointer font-mono font-bold text-xs"
                      >
                        {formatTimeLabel(timeHhmm)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Client Details */}
        {currentStep === 4 && selectedService && selectedSlot && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                Your Information
              </h2>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Where should we send your booking reference and tracking link?
              </p>
            </div>

            <form onSubmit={handleProceedToReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  data-testid="input-customer-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    data-testid="input-customer-email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="jordan@example.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    data-testid="input-customer-phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">
                  Special Notes or Styling Requests (Optional)
                </label>
                <textarea
                  data-testid="input-customer-notes"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="e.g. Skin sensitivity, specific taper length, or styling preference..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden"
                />
              </div>

              {/* Cancellation Policy Checkbox */}
              <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreePolicy"
                  data-testid="agree-policy-checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3027F5] mt-0.5"
                />
                <label htmlFor="agreePolicy" className="text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed cursor-pointer">
                  I understand that {business.name} asks for at least 2 hours notice for cancellations or rescheduling. No advance deposit is required today.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  data-testid="proceed-to-review-btn"
                  className="w-full py-3.5 rounded-2xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Review Booking Details</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 5: Review & Confirm */}
        {currentStep === 5 && selectedService && selectedSlot && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                Review Your Appointment
              </h2>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Please confirm all details below before finalizing your booking.
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E3DB] dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block">
                    SERVICE
                  </span>
                  <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                    {selectedService.name}
                  </h3>
                  <span className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    {selectedService.durationMinutes} minutes session
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-2xl text-[#3027F5] dark:text-[#E4C174]">
                    {formatMinorUnits(selectedService.price, selectedService.currency)}
                  </span>
                  <span className="text-[10px] text-subtle-foreground block">Pay at Salon</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block">
                    DATE & TIME
                  </span>
                  <p className="font-bold text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                    {new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="font-mono text-xs text-[#3027F5] dark:text-[#E4C174]">
                    {formatTimeLabel(selectedSlot.startTime.split('T')[1].substring(0, 5))}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block">
                    STYLIST
                  </span>
                  <p className="font-bold text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                    {selectedSlot.staffName}
                  </p>
                  <p className="text-[11px] text-[#60646C] dark:text-[#D0CBC1]">
                    {business.address}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 text-xs">
                <span className="text-[10px] font-mono uppercase text-subtle-foreground font-bold block mb-1">
                  CLIENT INFORMATION
                </span>
                <p className="font-semibold text-[#111318] dark:text-[#F7F3EB]">{clientName}</p>
                <p className="text-[#60646C] dark:text-[#D0CBC1]">{clientEmail} · {clientPhone}</p>
                {clientNotes && (
                  <p className="italic text-subtle-foreground mt-1">Note: "{clientNotes}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={isSubmitting}
                className="px-5 py-3.5 rounded-2xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#141412] text-xs font-bold cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                data-testid="confirm-booking-btn"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? 'Reserving Appointment...' : 'Confirm & Book Appointment'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Booking Confirmation */}
        {currentStep === 6 && createdAppointment && (
          <div
            data-testid="booking-confirmation-screen"
            className="p-8 rounded-3xl bg-white dark:bg-[#141412] border-2 border-emerald-200 dark:border-emerald-900/40 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block">
                BOOKING CONFIRMED · {createdAppointment.appointmentNumber}
              </span>
              <h2 className="text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                We're Ready for You!
              </h2>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1 max-w-sm mx-auto">
                Your appointment at {business.name} has been confirmed. You can manage or track your booking live anytime.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#111318] dark:text-[#F7F3EB]">
                  {createdAppointment.serviceSnapshot.name}
                </span>
                <span data-testid="confirmed-price">
                  {formatMinorUnits(createdAppointment.price, createdAppointment.currency)}
                </span>
              </div>
              <div className="text-[#60646C] dark:text-[#D0CBC1] space-y-0.5">
                <p>Stylist: <strong>{createdAppointment.staffName}</strong></p>
                <p>
                  Time: {new Date(createdAppointment.startIso).toLocaleDateString()} at{' '}
                  {formatTimeLabel(createdAppointment.startIso.split('T')[1].substring(0, 5))}
                </p>
                <p>Location: {createdAppointment.locationName}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 max-w-md mx-auto">
              <button
                type="button"
                data-testid="confirm-track-appointment-btn"
                onClick={() => navigate(`/appointment/${createdAppointment.bookingToken}`)}
                className="w-full py-3.5 rounded-2xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track & Manage Appointment</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                Return to Website
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
