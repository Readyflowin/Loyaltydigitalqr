import React, { useState, useEffect } from 'react';
import {
  Grid,
  Plus,
  Search,
  Printer,
  ExternalLink,
  Edit2,
  Trash2,
  MapPin,
  Utensils,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { CafeTable, Menu } from '../../../types/cafe';
import { cafeService } from '../../../services/cafeService';
import { buildTableMenuUrl } from '../../../utils/qrUrlBuilder';
import { TableEditModal } from './TableEditModal';
import { TablePrintModal } from './TablePrintModal';

interface CafeTablesViewProps {
  business: Business;
  theme: ThemeMode;
}

export const CafeTablesView: React.FC<CafeTablesViewProps> = ({ business }) => {
  const isFoodService = business.businessType === 'cafe' || business.businessType === 'restaurant';

  const [tables, setTables] = useState<CafeTable[]>(() => cafeService.getTables(business.id));
  const [menus, setMenus] = useState<Menu[]>(() => cafeService.getMenus(business.id));

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CafeTable | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedTableForPrint, setSelectedTableForPrint] = useState<CafeTable | null>(null);

  // Subscribe to updates
  useEffect(() => {
    const unsub = cafeService.subscribe(() => {
      setTables(cafeService.getTables(business.id));
      setMenus(cafeService.getMenus(business.id));
    });
    return unsub;
  }, [business.id]);

  if (!isFoodService) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Grid className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-foreground">
            Table QR Management Not Available
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The active business (<strong>{business.name}</strong>) is configured as a{' '}
            <strong>{business.businessType}</strong>. Table QR code ordering is scoped strictly to café and restaurant businesses.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCreateTable = () => {
    setEditingTable(null);
    setEditModalOpen(true);
  };

  const handleOpenEditTable = (tbl: CafeTable) => {
    setEditingTable(tbl);
    setEditModalOpen(true);
  };

  const handleSaveTable = (data: {
    tableNumber: string;
    displayName: string;
    locationId: string;
    menuId: string;
    instruction?: string;
  }) => {
    if (editingTable) {
      cafeService.updateTable(business.id, editingTable.id, data);
    } else {
      cafeService.createTable(business.id, data);
    }
  };

  const handleDeleteTable = (tblId: string) => {
    if (window.confirm('Delete this table and deactivate its assigned QR standee?')) {
      cafeService.deleteTable(business.id, tblId);
    }
  };

  const handleOpenPrintModal = (tbl: CafeTable) => {
    setSelectedTableForPrint(tbl);
    setPrintModalOpen(true);
  };

  const businessSlug = business.slug;

  // Filtered tables
  const filteredTables = tables.filter((tbl) => {
    const matchesSearch =
      tbl.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tbl.tableNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || tbl.locationId === locationFilter;

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            TABLE MANAGEMENT & DIGITAL ORDERING
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-0.5">
            Tables & Standee QR Codes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Assign unique, durable QR codes to each physical table, patio seat, or counter pickup station.
          </p>
        </div>

        <button
          type="button"
          data-testid="add-table-btn"
          onClick={handleOpenCreateTable}
          className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            ACTIVE TABLES
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-foreground">
            {tables.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {business.locations.length} store location{business.locations.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            ASSIGNED DIGITAL MENUS
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {menus.filter((m) => m.status === 'published').length} Published
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Connected to instant mobile ordering
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
            QR CODE STATUS
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            100% Ready
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Standee print layouts generated
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="text"
            data-testid="search-tables"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables by number, display name (e.g. Table 01, Patio)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
          />
        </div>

        {business.locations.length > 1 && (
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Locations</option>
            {business.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 4. Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border">
          <Grid className="w-10 h-10 mx-auto text-subtle-foreground mb-3" />
          <h4 className="font-heading font-black text-base text-foreground">
            No Tables Found
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No tables match your search query.'
              : 'Add physical tables or patio seating to generate scannable ordering QR standees.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateTable}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Table</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.map((tbl) => {
            const loc = business.locations.find((l) => l.id === tbl.locationId) || business.locations[0];
            const assignedMenu = menus.find((m) => m.id === tbl.menuId) || menus[0];
            const { pathWithQuery } = buildTableMenuUrl({
              businessSlug,
              tableId: tbl.id,
            });

            return (
              <TableCardItem
                key={tbl.id}
                table={tbl}
                locationName={loc?.name || 'Main Room'}
                menuName={assignedMenu?.name || 'All-Day Menu'}
                menuPath={pathWithQuery}
                onPrint={() => handleOpenPrintModal(tbl)}
                onEdit={() => handleOpenEditTable(tbl)}
                onDelete={() => handleDeleteTable(tbl.id)}
              />
            );
          })}
        </div>
      )}

      {/* Edit Table Modal */}
      <TableEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveTable}
        initialTable={editingTable}
        business={business}
        menus={menus}
      />

      {/* Print Standee Modal */}
      {selectedTableForPrint && (
        <TablePrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          table={selectedTableForPrint}
          business={business}
        />
      )}
    </div>
  );
};

interface TableCardItemProps {
  table: CafeTable;
  locationName: string;
  menuName: string;
  menuPath: string;
  onPrint: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TableCardItem: React.FC<TableCardItemProps> = ({
  table,
  locationName,
  menuName,
  menuPath,
  onPrint,
  onEdit,
  onDelete,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(menuPath, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (active) setThumbUrl(url);
    });
    return () => {
      active = false;
    };
  }, [menuPath]);

  return (
    <div
      data-testid={`table-card-${table.id}`} className="p-5 rounded-3xl bg-card border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between" > <div> {/* Header Badge */} <div className="flex items-center justify-between mb-3"> <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174]"> Table {table.tableNumber} </span> <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"> ACTIVE </span> </div> {/* Table info with QR thumbnail */} <div className="flex items-start gap-4 mb-4"> <div onClick={onPrint} className="w-16 h-16 rounded-2xl bg-white border border-[#E5E3DB] p-1 shadow-inner flex-shrink-0 cursor-pointer hover:border-[#3027F5] transition-colors" title="Click to preview & print standee" > {thumbUrl ? ( <img src={thumbUrl} alt="QR Thumbnail" className="w-full h-full object-contain" /> ) : ( <div className="w-full h-full flex items-center justify-center text-xs text-subtle-foreground"> QR </div> )} </div> <div className="flex-1 min-w-0"> <h3 className="text-lg font-heading font-black text-foreground truncate"> {table.displayName} </h3> <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5"> <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{locationName}</span> </div> <div className="flex items-center gap-1.5 text-xs text-subtle-foreground mt-0.5"> <Utensils className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{menuName}</span> </div> </div> </div> {/* Public Path Preview */} <div className="p-2.5 rounded-xl bg-muted border border-border mb-4"> <div className="text-xs text-subtle-foreground uppercase tracking-wider mb-0.5"> Table Scannable URL </div> <div className="text-xs text-[#3027F5] dark:text-[#E4C174] truncate"> {menuPath} </div> </div> </div> {/* Bottom Actions */} <div className="pt-3 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between gap-2"> <div className="flex items-center gap-1"> <button type="button" data-testid={`edit-table-${table.id}`}
            onClick={onEdit}
            className="p-1.5 rounded-lg text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            title="Edit Table"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid={`delete-table-${table.id}`}
            onClick={onDelete}
            className="p-1.5 rounded-lg text-subtle-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="Delete Table"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <a
            href={menuPath}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`open-table-menu-${table.id}`}
            className="p-1.5 rounded-lg text-subtle-foreground hover:text-[#3027F5] dark:hover:text-[#E4C174] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            title="Test Menu URL"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <button
          type="button"
          data-testid={`print-standee-btn-${table.id}`}
          onClick={onPrint}
          className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Standee</span>
        </button>
      </div>
    </div>
  );
};
