import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Award,
  CreditCard,
  Check,
  Save,
  ExternalLink,
  X,
  UserPlus,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
  Upload,
} from 'lucide-react';
import type { Business, BusinessInvite, BusinessLocation } from '../../types/business';
import type { ThemeMode } from '../../types';
import type { TeamRole, TeamPermission } from '../../types/growth';
import { CARD_COLORS, syncRewardWithStamps } from '../../data/onboardingData';
import { growthService } from '../../services/growthService';
import { businessService } from '../../services/businessService';
import { loyaltyService } from '../../services/loyaltyService';
import { authService } from '../../services/authService';
import { getPublicAppOrigin } from '../../lib/firebase';
import { randomString } from '../../lib/ids';
import { isUploadConfigured, uploadImage } from '../../lib/uploads';

interface SettingsViewProps {
  business: Business;
  theme: ThemeMode;
  onUpdateBusiness?: (updated: Partial<Business>) => void;
}

type SettingsTab = 'profile' | 'locations' | 'loyalty' | 'team' | 'billing';

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174] disabled:opacity-60';
const labelClass = 'block text-xs font-mono font-bold text-foreground uppercase mb-1';
const primaryButton =
  'px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed';

const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim();

export const SettingsView: React.FC<SettingsViewProps> = ({ business }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const myRole = businessService.getMyRole(business.id);
  const canManage = myRole === 'owner' || myRole === 'manager';
  const currentUser = authService.getCurrentUser();

  // Profile
  const [name, setName] = useState(business.name);
  const [contactEmail, setContactEmail] = useState(business.contactEmail);
  const [phoneNumber, setPhoneNumber] = useState(business.phoneNumber || '');
  const [logoUrl, setLogoUrl] = useState<string | null>((business as Business & { logoUrl?: string }).logoUrl || null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Locations (including staff PINs)
  const [locations, setLocations] = useState<BusinessLocation[]>(() => business.locations.map((l) => ({ ...l })));

  // Loyalty program (source of truth: config/loyaltyProgram)
  const program = loyaltyService.getProgram(business.id);
  const [programName, setProgramName] = useState(program.name);
  const [stampsRequired, setStampsRequired] = useState(program.stampsRequired);
  const [rewardDescription, setRewardDescription] = useState(program.rewardDescription);
  const [rewardExpiry, setRewardExpiry] = useState(program.rewardExpiry || business.rewardExpiry || 'Never expires');
  const [accentColor, setAccentColor] = useState(program.accentColor || business.accentColor);

  // Team
  const [invites, setInvites] = useState<BusinessInvite[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('staff');
  const members = businessService.getMembers(business.id);

  const flash = (type: 'ok' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const refreshInvites = useCallback(async () => {
    if (!canManage) return;
    try {
      setInvites(await businessService.listInvites(business.id));
    } catch {
      setInvites([]);
    }
  }, [business.id, canManage]);

  useEffect(() => {
    void refreshInvites();
  }, [refreshInvites]);

  const run = async (label: string, fn: () => Promise<void>) => {
    if (!canManage) {
      flash('error', 'Only owners and managers can change settings.');
      return;
    }
    setSaving(true);
    try {
      await fn();
      flash('ok', `${label} saved.`);
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = () =>
    run('Business profile', async () => {
      if (name.trim().length < 2) throw new Error('Business name must be at least 2 characters.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) throw new Error('Please enter a valid contact email.');
      await businessService.updateBusiness(business.id, {
        name: name.trim(),
        contactEmail: contactEmail.trim(),
        phoneNumber: phoneNumber.trim(),
        logoUrl,
      });
    });

  const saveLocations = () =>
    run('Locations', async () => {
      if (locations.length === 0) throw new Error('At least one location is required.');
      await businessService.updateBusiness(business.id, {
        locations: locations.map((l, i) => ({ ...l, name: l.name.trim(), address: l.address.trim(), isPrimary: i === 0 })),
      });
    });

  const saveLoyalty = () =>
    run('Loyalty program', async () => {
      if (!programName.trim()) throw new Error('Program name is required.');
      if (!rewardDescription.trim()) throw new Error('Reward description is required.');
      loyaltyService.saveProgram(business.id, {
        name: programName.trim(),
        stampsRequired,
        rewardDescription: rewardDescription.trim(),
        rewardExpiry,
        accentColor,
      });
      await businessService.updateBusiness(business.id, {
        programName: programName.trim(),
        stampsRequired,
        rewardDescription: rewardDescription.trim(),
        rewardExpiry,
        accentColor,
      });
    });

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await uploadImage(business.id, 'logo', file);
      setLogoUrl(url);
      flash('ok', 'Logo uploaded. Click "Save profile" to apply it.');
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await run('Invite', async () => {
      await businessService.inviteMember(business.id, inviteEmail, inviteRole);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('staff');
      await refreshInvites();
    });
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'locations', label: 'Locations & Staff PINs', icon: MapPin },
    { id: 'loyalty', label: 'Loyalty Program', icon: Award },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
  ];

  const permissionsList: { key: TeamPermission; label: string }[] = [
    { key: 'view_analytics', label: 'View Analytics & Performance' },
    { key: 'manage_offers', label: 'Create & Manage Offers' },
    { key: 'issue_loyalty', label: 'Issue Stamps & Redeem Rewards' },
    { key: 'manage_team', label: 'Manage Team Members & Roles' },
    { key: 'manage_settings', label: 'Edit Workspace Settings' },
    { key: 'operate_orders', label: 'Manage Orders & Appointments' },
  ];
  const rolesList: TeamRole[] = ['owner', 'manager', 'staff', 'receptionist'];

  const trialEnds = business.trialEndsAt ? new Date(business.trialEndsAt) : null;
  const trialDaysLeft = trialEnds ? Math.ceil((trialEnds.getTime() - Date.now()) / 86400000) : null;
  const regionalPrice = business.region === 'india' ? '₹299/month' : '$10/month';
  const publicOrigin = getPublicAppOrigin();

  return (
    <div data-testid="settings-view" className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            WORKSPACE CONFIGURATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-0.5">
            Settings
          </h1>
        </div>

        {feedback && (
          <div
            role="status"
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 animate-in fade-in ${
              feedback.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'ok' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {!canManage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
          You are signed in as <strong>{myRole || 'team member'}</strong>. Only owners and managers can change these settings.
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-black/10 dark:border-white/10 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">Business Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Shown on your public menu, booking page, catalogue and customer loyalty card.
              </p>
            </div>

            <div>
              <label className={labelClass}>Business Name</label>
              <input type="text" value={name} disabled={!canManage} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contact Email</label>
                <input type="email" value={contactEmail} disabled={!canManage} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number (shown publicly)</label>
                <input type="tel" value={phoneNumber} disabled={!canManage} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Logo</label>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-heading font-black text-xl overflow-hidden"
                  style={{ backgroundColor: business.accentColor }}
                >
                  {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : business.logoInitial}
                </div>
                {isUploadConfigured() ? (
                  <div className="flex items-center gap-2">
                    <label className={`${primaryButton} ${!canManage || logoUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <Upload className="w-4 h-4" />
                      <span>{logoUploading ? 'Uploading…' : 'Upload logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => void handleLogoFile(e.target.files?.[0])}
                      />
                    </label>
                    {logoUrl && canManage && (
                      <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-rose-600 hover:underline cursor-pointer">
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Logo upload becomes available once image storage is connected.</p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Industry & Region</label>
              <div className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-muted-foreground">
                {business.businessType.toUpperCase()} · {business.region === 'india' ? 'India (INR)' : 'United States (USD)'} · {business.timeZone}
              </div>
            </div>

            <div>
              <label className={labelClass}>Your public link name</label>
              <div className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-mono text-foreground flex items-center justify-between gap-2">
                <span className="truncate">{publicOrigin}/card/{business.slug}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(`${publicOrigin}/card/${business.slug}`).then(() => flash('ok', 'Link copied'))}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  aria-label="Copy loyalty card link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button type="button" disabled={!canManage || saving} onClick={saveProfile} className={primaryButton}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Save profile'}</span>
            </button>
          </div>
        )}

        {/* LOCATIONS */}
        {activeTab === 'locations' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">Locations & Staff PINs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Staff enter a location's PIN to issue stamps and redeem rewards. Keep PINs private to your team.
              </p>
            </div>

            <div className="space-y-3">
              {locations.map((loc, idx) => (
                <div
                  key={loc.id}
                  className="p-4 rounded-2xl bg-muted border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#3027F5] dark:text-[#E4C174]">
                      {idx === 0 ? 'Primary location' : `Location ${idx + 1}`}
                    </span>
                    {idx > 0 && canManage && (
                      <button
                        type="button"
                        onClick={() => setLocations((prev) => prev.filter((l) => l.id !== loc.id))}
                        className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px] gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        value={loc.name}
                        disabled={!canManage}
                        onChange={(e) => setLocations((prev) => prev.map((l) => (l.id === loc.id ? { ...l, name: e.target.value } : l)))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        type="text"
                        value={loc.address}
                        disabled={!canManage}
                        onChange={(e) => setLocations((prev) => prev.map((l) => (l.id === loc.id ? { ...l, address: e.target.value } : l)))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Staff PIN</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={loc.staffPin}
                        disabled={!canManage}
                        onChange={(e) =>
                          setLocations((prev) =>
                            prev.map((l) => (l.id === loc.id ? { ...l, staffPin: e.target.value.replace(/\D/g, '') } : l))
                          )
                        }
                        className={`${inputClass} font-mono text-center tracking-widest`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() =>
                  setLocations((prev) => [
                    ...prev,
                    { id: `loc_${randomString(8)}`, name: '', address: '', isPrimary: false, staffPin: randomString(4, '0123456789') },
                  ])
                }
                className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add location
              </button>
            )}

            <div>
              <button type="button" disabled={!canManage || saving} onClick={saveLocations} className={primaryButton}>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving…' : 'Save locations'}</span>
              </button>
            </div>
          </div>
        )}

        {/* LOYALTY */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">Loyalty Reward Rules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Changes apply to new stamps immediately. Customers' existing progress is kept.
              </p>
            </div>

            <div>
              <label className={labelClass}>Program Title</label>
              <input type="text" value={programName} disabled={!canManage} onChange={(e) => setProgramName(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Visits Required: {stampsRequired} stamps</label>
              <div className="flex gap-2 flex-wrap">
                {[5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      setStampsRequired(num);
                      setRewardDescription((prev) => syncRewardWithStamps(prev, num));
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                      stampsRequired === num
                        ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                        : 'bg-black/5 dark:bg-white/5 text-subtle-foreground'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Reward Description</label>
              <input type="text" value={rewardDescription} disabled={!canManage} onChange={(e) => setRewardDescription(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Reward Expiration Policy</label>
              <select
                value={rewardExpiry}
                disabled={!canManage}
                onChange={(e) => setRewardExpiry(e.target.value)}
                className={inputClass}
              >
                <option value="Never expires">Never expires</option>
                <option value="Expires in 30 days">Expires in 30 days</option>
                <option value="Expires in 60 days">Expires in 60 days</option>
                <option value="Expires in 90 days">Expires in 90 days</option>
                <option value="Expires in 6 months">Expires in 6 months</option>
                <option value="Expires in 1 year">Expires in 1 year</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Displayed on loyalty pass: 1 stamp per visit · {rewardExpiry}
              </p>
            </div>

            <div>
              <label className={labelClass}>Card Accent Color</label>
              <div className="flex items-center gap-3 flex-wrap">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!canManage}
                    onClick={() => setAccentColor(c.hex)}
                    aria-label={c.name}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      accentColor === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-[#111318] dark:ring-[#F7F3EB]' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {accentColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" disabled={!canManage || saving} onClick={saveLoyalty} className={primaryButton}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Save reward settings'}</span>
            </button>
          </div>
        )}

        {/* TEAM */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">Team Members ({members.length})</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Everyone listed here can sign in to this workspace with their own account.
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  data-testid="invite-staff-btn"
                  onClick={() => setInviteModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite team member</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member) => {
                const isOwner = member.uid === business.ownerUid;
                const isMe = member.uid === currentUser?.id;
                return (
                  <div
                    key={member.uid}
                    className="p-3.5 rounded-2xl bg-muted border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate">
                        {member.displayName || member.email} {isMe && <span className="text-subtle-foreground font-normal">(you)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                      <div className="mt-1">
                        {canManage && !isOwner && !isMe ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              void run('Role', () => businessService.updateMemberRole(business.id, member.uid, e.target.value as TeamRole))
                            }
                            className="px-2 py-1 rounded-lg border border-[#E5E3DB] dark:border-white/15 bg-white dark:bg-[#2D2D2D] text-xs uppercase"
                          >
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                            <option value="receptionist">Receptionist</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                    {canManage && !isOwner && !isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${member.email} from ${business.name}?`)) {
                            void run('Team', () => businessService.removeMember(business.id, member.uid));
                          }
                        }}
                        className="text-xs text-rose-600 hover:underline cursor-pointer flex-shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {canManage && invites.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-sm text-foreground">Pending invites ({invites.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {invites.map((inv) => (
                    <div
                      key={inv.email}
                      className="p-3.5 rounded-2xl border border-dashed border-[#E5E3DB] dark:border-white/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{inv.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Invited as {inv.role} · {new Date(inv.invitedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void run('Invite', async () => {
                            await businessService.revokeInvite(business.id, inv.email);
                            await refreshInvites();
                          })
                        }
                        className="text-xs text-rose-600 hover:underline cursor-pointer flex-shrink-0"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-3">
              <h4 className="font-heading font-bold text-sm text-foreground">What each role can do</h4>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] uppercase text-xs text-subtle-foreground">
                    <tr>
                      <th className="p-3.5">Permission</th>
                      {rolesList.map((r) => (
                        <th key={r} className="p-3.5 text-center">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DB] dark:divide-[rgba(228,193,116,0.1)]">
                    {permissionsList.map((perm) => (
                      <tr key={perm.key}>
                        <td className="p-3.5 font-medium text-foreground">{perm.label}</td>
                        {rolesList.map((r) => (
                          <td key={r} className="p-3.5 text-center">
                            {growthService.hasPermission(r, perm.key) ? (
                              <span className="inline-flex p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-block w-2 h-0.5 bg-black/20 dark:bg-white/20 rounded-full" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">Plan & Billing</h3>
            </div>

            <div className="p-5 rounded-2xl bg-muted border border-border space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">CURRENT PLAN</span>
                  <div className="font-heading font-black text-2xl text-foreground">
                    {business.planName || 'Starter'} · {regionalPrice}
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold ${
                    trialDaysLeft !== null && trialDaysLeft > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {trialDaysLeft !== null && trialDaysLeft > 0 ? 'Free trial' : 'Trial ended'}
                </span>
              </div>

              <div className="text-xs text-muted-foreground pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span>Workspace created:</span>
                  <strong className="text-foreground">
                    {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : '—'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Free trial {trialDaysLeft !== null && trialDaysLeft > 0 ? 'ends' : 'ended'}:</span>
                  <strong className="text-foreground">{trialEnds ? trialEnds.toLocaleDateString() : '—'}</strong>
                </div>
              </div>

              <a
                href={business.region === 'india' ? '/india' : '/usa'}
                className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline inline-flex items-center gap-1"
              >
                <span>View plan details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F0EEE6] dark:bg-[#2D2D2D] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)] text-xs text-muted-foreground">
              Online card payments are not available in the dashboard yet. No payment details are stored and you will not be
              charged automatically.
              {SUPPORT_EMAIL ? (
                <>
                  {' '}To continue after your trial, email{' '}
                  <a className="font-bold underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-xs uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">TEAM INVITATION</span>
                <h3 className="text-xl font-heading font-black text-foreground">Invite a team member</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F0EEE6] dark:bg-[#2D2D2D] text-xs text-muted-foreground">
              No email is sent automatically. After you create the invite, ask them to sign in at{' '}
              <strong className="text-foreground">{publicOrigin}/login</strong> using this exact email address.
              The invite will be waiting for them.
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  required
                  data-testid="invite-email-input"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <select
                  data-testid="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className={inputClass}
                >
                  <option value="manager">Manager (settings, team, offers, analytics)</option>
                  <option value="staff">Staff (stamps, customers, orders)</option>
                  <option value="receptionist">Receptionist (appointments, check-ins)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-white/15 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={primaryButton}>
                  {saving ? 'Creating…' : 'Create invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
