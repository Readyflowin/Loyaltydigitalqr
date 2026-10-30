import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Award,
  CreditCard,
  Sliders,
  Check,
  Save,
  ExternalLink,
  X,
  UserPlus,
} from 'lucide-react';
import type { MockBusiness } from '../../types/business';
import type { ThemeMode } from '../../types';
import type { TeamMember, TeamRole, TeamPermission } from '../../types/growth';
import { CARD_COLORS } from '../../data/onboardingData';
import { mockGrowthService } from '../../services/mockGrowthService';

interface SettingsViewProps {
  business: MockBusiness;
  theme: ThemeMode;
  onUpdateBusiness: (updated: Partial<MockBusiness>) => void;
}

type SettingsTab =
  | 'profile'
  | 'locations'
  | 'loyalty'
  | 'team'
  | 'billing'
  | 'preferences';

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  theme: _theme,
  onUpdateBusiness,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Editable local state
  const [name, setName] = useState(business.name);
  const [contactEmail, setContactEmail] = useState(business.contactEmail);
  const [phoneNumber, setPhoneNumber] = useState(business.phoneNumber || '');
  const [programName, setProgramName] = useState(business.programName);
  const [stampsRequired, setStampsRequired] = useState(business.stampsRequired);
  const [rewardDescription, setRewardDescription] = useState(business.rewardDescription);
  const [accentColor, setAccentColor] = useState(business.accentColor);
  const [staffPin, setStaffPin] = useState(business.locations[0]?.staffPin || '4821');

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('staff');

  const refreshTeam = () => {
    setTeamMembers(mockGrowthService.getTeamMembers(business.id));
  };

  useEffect(() => {
    refreshTeam();
    const unsub = mockGrowthService.subscribe(() => {
      refreshTeam();
    });
    return unsub;
  }, [business.id]);

  const handleSave = (section: string) => {
    onUpdateBusiness({
      name,
      contactEmail,
      phoneNumber,
      programName,
      stampsRequired,
      rewardDescription,
      accentColor,
    });
    setSavedFeedback(`Saved changes to ${section} in local session.`);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    mockGrowthService.inviteTeamMember({
      businessId: business.id,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
    });

    setSavedFeedback(`Invitation created for ${inviteName} (${inviteRole}). Simulated mode.`);
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('staff');
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'locations', label: 'Locations & Counters', icon: MapPin },
    { id: 'loyalty', label: 'Loyalty Program', icon: Award },
    { id: 'team', label: 'Team & Staff PIN', icon: Users },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  const permissionsList: { key: TeamPermission; label: string }[] = [
    { key: 'view_analytics', label: 'View Analytics & Performance' },
    { key: 'manage_offers', label: 'Create & Manage Offers' },
    { key: 'issue_loyalty', label: 'Verify Counter Stamps & Redemptions' },
    { key: 'manage_team', label: 'Configure Team Members & Roles' },
    { key: 'manage_settings', label: 'Edit Workspace Settings' },
    { key: 'operate_orders', label: 'Manage Orders & Appointments' },
  ];

  const rolesList: TeamRole[] = ['owner', 'manager', 'staff', 'receptionist'];

  const regionalPricing =
    business.region === 'india'
      ? { price: '₹299/month', link: '/pricing', currency: 'INR', flag: '🇮🇳' }
      : { price: '$10/month', link: '/usa', currency: 'USD', flag: '🇺🇸' };

  return (
    <div data-testid="settings-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            WORKSPACE CONFIGURATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Settings & Permissions
          </h1>
        </div>

        {savedFeedback && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{savedFeedback}</span>
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 border-b border-black/10 dark:border-white/10 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'text-[#60646C] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] p-6 sm:p-8 shadow-sm">
        {/* TAB 1: Business Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                Business Profile Information
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                Configures how your business appears on counter displays and customer passes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Industry Category & Operating Region
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-[#60646C] dark:text-[#AAA499] flex items-center justify-between">
                <span>
                  {business.businessType.toUpperCase()} ·{' '}
                  {business.region === 'india' ? 'India Region' : 'United States'}
                </span>
                <span className="font-mono text-[11px] font-bold text-[#3027F5] dark:text-[#E4C174]">
                  Active
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSave('Business Profile')}
              className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        )}

        {/* TAB 2: Locations & Counters */}
        {activeTab === 'locations' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                Configured Counters & Venues
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                Each counter has a unique QR code stand and individual staff stamp validation PIN.
              </p>
            </div>

            <div className="space-y-3">
              {business.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                        {loc.name}
                      </h4>
                      {loc.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                      {loc.address}
                    </p>
                    <div className="text-[11px] font-mono text-[#868A94] mt-1.5">
                      Counter PIN:{' '}
                      <strong className="text-[#111318] dark:text-[#F7F3EB]">{loc.staffPin}</strong>
                    </div>
                  </div>

                  <span className="text-xs text-[#3027F5] dark:text-[#E4C174] font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-[#F0EEE6] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)] text-xs text-[#60646C] dark:text-[#AAA499]">
              Multi-counter real-time synchronization is scheduled for Task 10 Firebase Cloud Firestore.
            </div>
          </div>
        )}

        {/* TAB 3: Loyalty Program */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                Loyalty Reward Rules
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                Set customer visit thresholds and custom rewards.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Program Title
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Visits Required: {stampsRequired} stamps
              </label>
              <div className="flex gap-2">
                {[5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setStampsRequired(num)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                      stampsRequired === num
                        ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                        : 'bg-black/5 dark:bg-white/5 text-[#868A94]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Reward Description
              </label>
              <input
                type="text"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                Pass Accent Color
              </label>
              <div className="flex items-center gap-3">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      accentColor === c.hex
                        ? 'scale-110 ring-2 ring-offset-2 ring-[#111318] dark:ring-[#F7F3EB]'
                        : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {accentColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSave('Loyalty Program')}
              className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Reward Settings</span>
            </button>
          </div>
        )}

        {/* TAB 4: Team, Roles & Staff PIN */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            {/* Staff PIN Section */}
            <div className="max-w-xl space-y-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                  Counter Staff PIN Verification
                </h3>
                <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                  Staff members type this 4-digit code on the customer's phone to validate visits securely.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Active Counter Staff PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  className="w-40 font-mono text-center text-xl font-bold tracking-widest px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
                <p className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-1">
                  Keep this code confidential among counter staff.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSave('Staff PIN')}
                className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Update Staff PIN</span>
              </button>
            </div>

            {/* Role-to-Permissions Matrix */}
            <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                    ACCESS GOVERNANCE
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                    Role-to-Permission Matrix
                  </h3>
                  <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    Permissions enforce operational security across counter and administrative workflows.
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="invite-staff-btn"
                  onClick={() => setInviteModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Team Member</span>
                </button>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F7F2] dark:bg-[#181816] border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] font-mono uppercase text-[10px] text-[#868A94]">
                    <tr>
                      <th className="p-3.5">Capability / Permission</th>
                      {rolesList.map((r) => (
                        <th key={r} className="p-3.5 text-center">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DB] dark:divide-[rgba(228,193,116,0.1)]">
                    {permissionsList.map((perm) => (
                      <tr key={perm.key} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-medium text-[#111318] dark:text-[#F7F3EB]">
                          {perm.label}
                        </td>
                        {rolesList.map((r) => {
                          const hasIt = mockGrowthService.hasPermission(r, perm.key);
                          return (
                            <td key={r} className="p-3.5 text-center">
                              {hasIt ? (
                                <span className="inline-flex p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-block w-2 h-0.5 bg-black/20 dark:bg-white/20 rounded-full" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Team Members List */}
              <div className="space-y-3 pt-4">
                <h4 className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                  Assigned Team Members ({teamMembers.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
                          {member.email}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
                            {member.role}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            {member.status}
                          </span>
                        </div>
                      </div>

                      {member.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => {
                            mockGrowthService.removeTeamMember(business.id, member.id);
                            refreshTeam();
                          }}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Plan & Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                Subscription Plan & Billing Status
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                Preserves transparent regional pricing model established in Task 1.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                    ACTIVE SUBSCRIPTION
                  </span>
                  <div className="font-heading font-black text-2xl text-[#111318] dark:text-[#F7F3EB]">
                    {regionalPricing.price}
                  </div>
                  <div className="text-xs text-[#60646C] dark:text-[#AAA499] mt-0.5">
                    Tier: {business.planName}
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold">
                  Active Subscription
                </span>
              </div>

              <div className="text-xs text-[#60646C] dark:text-[#D0CBC1] pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span>Operating Region:</span>
                  <strong className="text-[#111318] dark:text-[#F7F3EB]">
                    {business.region === 'india' ? 'India (INR)' : 'United States (USD)'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Billing Cycle:</span>
                  <strong className="text-[#111318] dark:text-[#F7F3EB]">Monthly (No Lock-In Contract)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Next Renewal:</span>
                  <strong className="text-[#111318] dark:text-[#F7F3EB]">
                    {new Date(Date.now() + 25 * 86400000).toLocaleDateString()}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={regionalPricing.link}
                  className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline flex items-center gap-1"
                >
                  <span>Review Public Regional Plans</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
              <strong>Simulated Billing:</strong> Production payment gateway (Stripe / Razorpay) will be integrated in Task 10.
            </div>
          </div>
        )}

        {/* TAB 6: Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#111318] dark:text-[#F7F3EB]">
                Account & Workspace Preferences
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                Display preferences and simulated notifications.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#3027F5]" />
                <span className="font-medium text-[#111318] dark:text-[#F7F3EB]">
                  Play soft sound on staff PIN stamp verification
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#3027F5]" />
                <span className="font-medium text-[#111318] dark:text-[#F7F3EB]">
                  Show celebratory animation when customer unlocks reward
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#3027F5]" />
                <span className="font-medium text-[#111318] dark:text-[#F7F3EB]">
                  Send weekly summary email of counter activity
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Invite Staff Member (Simulated) */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                  TEAM INVITATION
                </span>
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  Invite Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <strong>Mock Environment:</strong> No actual email or SMS invitation is dispatched. A pending team record is added immediately.
            </div>

            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  data-testid="invite-name-input"
                  placeholder="e.g. David Vance"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  data-testid="invite-email-input"
                  placeholder="e.g. david@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Assigned Role
                </label>
                <select
                  data-testid="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
                >
                  <option value="manager">Manager (High Permissions)</option>
                  <option value="staff">Staff (Counter Verification & Orders)</option>
                  <option value="receptionist">Receptionist (Appointments & Check-Ins)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-invite-btn"
                  className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Send Invitation (Simulated)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
