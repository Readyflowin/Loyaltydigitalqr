import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Ban,
  UserPlus,
} from 'lucide-react';
import { mockGymService } from '../../../services/mockGymService';
import type {
  GymClass,
  GymMemberRecord,
} from '../../../types/gym';

interface GymClassesViewProps {
  businessId: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const GymClassesView: React.FC<GymClassesViewProps> = ({ businessId }) => {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [members, setMembers] = useState<GymMemberRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [enrollingClass, setEnrollingClass] = useState<GymClass | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  // New class form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formRoom, setFormRoom] = useState('Studio A');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('10:00 AM');
  const [formDayOfWeek, setFormDayOfWeek] = useState(new Date().getDay());
  const [formCapacity, setFormCapacity] = useState(15);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setClasses(mockGymService.getClasses(businessId));
    setMembers(mockGymService.getMembers(businessId));
  };

  useEffect(() => {
    loadData();
    const unsub = mockGymService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [businessId]);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = mockGymService.createClass({
      businessId,
      name: formName,
      description: formDescription,
      instructorName: formInstructor,
      room: formRoom,
      startTime: formStartTime,
      endTime: formEndTime,
      dayOfWeek: Number(formDayOfWeek),
      capacity: Number(formCapacity),
    });

    if (result.success) {
      setShowCreateModal(false);
      setFormName('');
      setFormDescription('');
      setFormInstructor('');
      loadData();
    } else {
      setFormError(result.error || 'Failed to create class.');
    }
  };

  const handleCancelClass = (classId: string) => {
    if (window.confirm('Are you sure you want to cancel this class session?')) {
      mockGymService.cancelClass(businessId, classId);
      loadData();
    }
  };

  const handleEnrollMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingClass || !selectedMemberId) return;

    setEnrollError(null);
    setEnrollSuccess(null);

    const result = mockGymService.enrollInClass(
      businessId,
      enrollingClass.id,
      selectedMemberId
    );

    if (result.success) {
      setEnrollSuccess('Member enrolled successfully!');
      setTimeout(() => {
        setEnrollingClass(null);
        setSelectedMemberId('');
        setEnrollSuccess(null);
      }, 1000);
      loadData();
    } else {
      setEnrollError(result.error || 'Enrollment failed.');
    }
  };

  const activeMembers = members.filter((m) => m.status === 'active');

  return (
    <div className="space-y-6" data-testid="gym-classes-view">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Fitness & Studio Classes</h2>
          <p className="text-sm text-muted-foreground">
            Schedule group classes, track room capacities, and manage member enrollments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          data-testid="create-class-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Class</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/40">
            <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Classes Scheduled</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Click &quot;Schedule New Class&quot; to add group fitness, spin, yoga, or HIIT classes to your timetable.
            </p>
          </div>
        ) : (
          classes.map((cls) => {
            const isFull = cls.enrolledMemberIds.length >= cls.capacity;
            const isCancelled = cls.status === 'cancelled';
            const percentFilled = Math.min(
              100,
              Math.round((cls.enrolledMemberIds.length / cls.capacity) * 100)
            );

            return (
              <div
                key={cls.id}
                data-testid={`class-card-${cls.id}`}
                className={`rounded-xl border bg-card p-5 shadow-sm flex flex-col justify-between space-y-4 transition ${
                  isCancelled ? 'opacity-60 border-border/40' : 'border-border/60 hover:border-border'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {DAYS[cls.dayOfWeek]}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">{cls.name}</h3>
                    </div>
                    {isCancelled ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Cancelled
                      </span>
                    ) : isFull ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Full
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Open
                      </span>
                    )}
                  </div>

                  {cls.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {cls.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground border-y border-border/40 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{cls.startTime} - {cls.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>Coach: {cls.instructorName}</span>
                    </div>
                    {cls.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{cls.room}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity progress */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="text-foreground">
                        {cls.enrolledMemberIds.length} / {cls.capacity} Enrolled
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFull
                            ? 'bg-rose-500'
                            : percentFilled > 75
                            ? 'bg-amber-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>
                  </div>

                  {/* Enrolled members list preview */}
                  {cls.enrolledMembers && cls.enrolledMembers.length > 0 && (
                    <div className="mt-3 pt-2">
                      <span className="text-[11px] text-muted-foreground block mb-1">
                        Roster ({cls.enrolledMembers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cls.enrolledMembers.map((em: { memberId: string; memberName: string }) => (
                          <span
                            key={em.memberId}
                            className="inline-block px-2 py-0.5 rounded text-[11px] bg-muted text-foreground"
                          >
                            {em.memberName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {!isCancelled && (
                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        setEnrollingClass(cls);
                        setSelectedMemberId('');
                        setEnrollError(null);
                        setEnrollSuccess(null);
                      }}
                      data-testid={`enroll-member-btn-${cls.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition disabled:opacity-40"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isFull ? 'Class Full' : 'Enroll Member'}</span>
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => handleCancelClass(cls.id)}
                      data-testid={`cancel-class-btn-${cls.id}`}
                      className="p-2 rounded-lg border border-border/60 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 transition text-muted-foreground"
                      title="Cancel Class Session"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Class Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="create-class-modal"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-lg font-bold text-foreground">Schedule Group Class</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="E.g., Morning Power Spin, Vinyasa Flow"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="class-name-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Class intensity, target muscle groups, required gear..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Instructor / Coach *
                  </label>
                  <input
                    type="text"
                    required
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    placeholder="Coach name"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="class-instructor-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Studio / Room
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="Studio A"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {DAYS.map((day, idx) => (
                      <option key={day} value={idx}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Class Capacity (Seats / Spots) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="class-capacity-input"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-border/80 text-foreground text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-class-btn"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  Publish Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Member Modal */}
      {enrollingClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="enroll-modal"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Enroll Member</h3>
                <p className="text-xs text-muted-foreground">{enrollingClass.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEnrollingClass(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Active Member
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="enroll-member-select"
                >
                  <option value="">-- Choose Member --</option>
                  {activeMembers.map((m) => {
                    const alreadyEnrolled = enrollingClass.enrolledMemberIds.includes(m.id);
                    return (
                      <option
                        key={m.id}
                        value={m.id}
                        disabled={alreadyEnrolled}
                      >
                        {m.customerName} ({m.planName}) {alreadyEnrolled ? '— Already enrolled' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {enrollError && (
                <div
                  className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2"
                  data-testid="enroll-error-banner"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{enrollError}</span>
                </div>
              )}

              {enrollSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{enrollSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEnrollingClass(null)}
                  className="px-4 py-2 rounded-lg border border-border/80 text-foreground text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMemberId}
                  data-testid="confirm-enroll-btn"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
