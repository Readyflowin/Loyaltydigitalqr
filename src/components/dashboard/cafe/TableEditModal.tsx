import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { CafeTable, Menu } from '../../../types/cafe';
import type { Business } from '../../../types/business';

interface TableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    tableNumber: string;
    displayName: string;
    locationId: string;
    menuId: string;
    instruction?: string;
  }) => void;
  initialTable?: CafeTable | null;
  business: Business;
  menus: Menu[];
}

export const TableEditModal: React.FC<TableEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTable,
  business,
  menus,
}) => {
  if (!isOpen) return null;

  return (
    <TableEditModalForm
      key={initialTable?.id || 'new_table'}
      onClose={onClose}
      onSave={onSave}
      initialTable={initialTable}
      business={business}
      menus={menus}
    />
  );
};

interface InnerFormProps {
  onClose: () => void;
  onSave: (data: {
    tableNumber: string;
    displayName: string;
    locationId: string;
    menuId: string;
    instruction?: string;
  }) => void;
  initialTable?: CafeTable | null;
  business: Business;
  menus: Menu[];
}

const TableEditModalForm: React.FC<InnerFormProps> = ({
  onClose,
  onSave,
  initialTable,
  business,
  menus,
}) => {
  const [tableNumber, setTableNumber] = useState(initialTable?.tableNumber || '');
  const [displayName, setDisplayName] = useState(initialTable?.displayName || '');
  const [locationId, setLocationId] = useState(
    initialTable?.locationId || business.locations[0]?.id || 'loc_main'
  );
  const [menuId, setMenuId] = useState(
    initialTable?.menuId || menus[0]?.id || ''
  );
  const [instruction, setInstruction] = useState(
    initialTable?.instruction || 'Scan with smartphone camera to view menu & order'
  );
  const [error, setError] = useState<string | null>(null);

  const handleTableNumberChange = (val: string) => {
    setTableNumber(val);
    if (!initialTable && (!displayName || displayName.startsWith('Table '))) {
      setDisplayName(val ? `Table ${val}` : '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Table number / identifier is required.');
      return;
    }
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!menuId) {
      setError('Please assign a menu to this table.');
      return;
    }

    onSave({
      tableNumber: tableNumber.trim(),
      displayName: displayName.trim(),
      locationId,
      menuId,
      instruction: instruction.trim() || undefined,
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

      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              {initialTable ? 'EDIT TABLE' : 'NEW TABLE'}
            </span>
            <h3 className="text-xl font-heading font-black text-foreground mt-0.5">
              {initialTable ? `Edit ${initialTable.displayName}` : 'Add Table & QR'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Table # / Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                data-testid="table-number-input"
                value={tableNumber}
                onChange={(e) => handleTableNumberChange(e.target.value)}
                placeholder="e.g. 05, P2, Bar"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                data-testid="table-display-name-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Table 05"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Assigned Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none cursor-pointer"
            >
              {business.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.address})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Assigned Digital Menu
            </label>
            <select
              value={menuId}
              onChange={(e) => setMenuId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none cursor-pointer"
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Printed Standee Instruction
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Scan with smartphone camera to view menu & order"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-semibold hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-table-btn"
              className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {initialTable ? 'Save Table' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
