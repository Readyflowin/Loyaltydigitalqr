import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Menu } from '../../../types/cafe';

interface MenuEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: Menu;
  onSave: (updates: Partial<Menu>) => void;
}

export const MenuEditModal: React.FC<MenuEditModalProps> = ({
  isOpen,
  onClose,
  menu,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <MenuEditModalForm
      key={menu.id}
      onClose={onClose}
      menu={menu}
      onSave={onSave}
    />
  );
};

interface InnerFormProps {
  onClose: () => void;
  menu: Menu;
  onSave: (updates: Partial<Menu>) => void;
}

const MenuEditModalForm: React.FC<InnerFormProps> = ({
  onClose,
  menu,
  onSave,
}) => {
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description || '');
  const [status, setStatus] = useState<'published' | 'draft'>(menu.status);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Menu name cannot be empty.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              MENU SETTINGS
            </span>
            <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              Edit Menu Information
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] mb-1.5">
              Menu Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. All-Day Café & Roastery Menu"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] mb-1.5">
              Public Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief summary visible to customers at the top of the digital menu..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] mb-1.5">
              Publish Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  status === 'published'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-[#F8F7F2] dark:bg-[#1A1916]'
                }`}
              >
                <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                  Published
                </div>
                <div className="text-[11px] text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                  Visible to table QR scanners
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  status === 'draft'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-[#F8F7F2] dark:bg-[#1A1916]'
                }`}
              >
                <div className="font-bold text-xs text-amber-700 dark:text-amber-400">
                  Draft
                </div>
                <div className="text-[11px] text-[#60646C] dark:text-[#D0CBC1] mt-0.5">
                  Hidden from public scanners
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-[#60646C] dark:text-[#D0CBC1] text-xs font-semibold hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              Save Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
