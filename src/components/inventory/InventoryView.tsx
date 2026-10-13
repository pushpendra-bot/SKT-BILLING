import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, UnitType } from '../../types';
import { formatINR, GST_RATES } from '../../utils/gstUtils';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Sliders,
  X,
  TrendingUp,
  Tag,
  Warehouse,
  Download,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  downloadFile,
  downloadBinaryFile,
  generateBusy21ItemsCsv,
  generateBusy21ItemsExcel,
  parseAnyBusy21Data,
} from '../../utils/busy21Data';
import {
  ALL_SUPPORTED_UNITS,
  POPULAR_CONVERSION_PRESETS,
  formatDualStock,
} from '../../utils/unitConversionUtils';

const COMMON_UNITS: UnitType[] = [
  'PCS',
  'BOX',
  'KGS',
  'MTR',
  'NOS',
  'SET',
  'LTR',
  'PKT',
  'BAG',
  'CTN',
  'DOZ',
  'CASE',
  'TIN',
  'ROLL',
  'BNDL',
];

export const InventoryView: React.FC = () => {
  const { items, addItem, updateItem, adjustStock, invoices } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [hsnSac, setHsnSac] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState<UnitType>('PCS');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Unit Conversion (Alternate / Secondary Unit)
  const [hasSecondaryUnit, setHasSecondaryUnit] = useState<boolean>(false);
  const [secondaryUnit, setSecondaryUnit] = useState<UnitType>('BOX');
  const [conversionFactor, setConversionFactor] = useState<number>(24);
  const [secondarySellingPrice, setSecondarySellingPrice] = useState<number>(0);
  const [secondaryPurchasePrice, setSecondaryPurchasePrice] = useState<number>(0);

  // Adjust Stock Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetItem, setAdjustTargetItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'reduce'>('add');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Inventory Count Correction');
  const [adjustInSecondaryUnit, setAdjustInSecondaryUnit] = useState<boolean>(false);

  // Bulk CSV & Busy 21 import/export state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportItemsCsv = () => {
    const csv = generateBusy21ItemsCsv(items, invoices);
    downloadFile(csv, `Inventory_Items_All_Details_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportItemsExcel = () => {
    const buffer = generateBusy21ItemsExcel(items, invoices);
    downloadBinaryFile(buffer, `Inventory_Items_All_Details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportItemsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseAnyBusy21Data(text);
        if (parsed.items.length === 0) {
          alert('No inventory items detected in file. Please verify CSV columns or Busy 21 XML tags.');
          return;
        }

        let updatedCount = 0;
        let addedCount = 0;

        parsed.items.forEach(newItem => {
          const existing = items.find(
            i => i.name.toLowerCase() === newItem.name.toLowerCase() || (newItem.itemCode && i.itemCode === newItem.itemCode)
          );
          if (existing) {
            updateItem({
              ...existing,
              sellingPrice: newItem.sellingPrice || existing.sellingPrice,
              purchasePrice: newItem.purchasePrice || existing.purchasePrice,
              currentStock: newItem.currentStock !== undefined ? newItem.currentStock : existing.currentStock,
              taxRate: newItem.taxRate || existing.taxRate,
              hsnSac: newItem.hsnSac || existing.hsnSac,
              unit: newItem.unit || existing.unit,
            });
            updatedCount++;
          } else {
            addItem(newItem);
            addedCount++;
          }
        });

        setImportStatus(`Bulk updated ${updatedCount} items and added ${addedCount} new items successfully!`);
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err: any) {
        alert(`Failed to import items: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Categories list
  const categories = Array.from(new Set(items.map(i => i.category || 'General'))).filter(Boolean);

  // Filtering
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.hsnSac && item.hsnSac.includes(searchTerm));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLowStock = !onlyLowStock || item.currentStock <= item.minStockAlert;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // KPI calculations
  const totalStockValuation = items.reduce((acc, i) => acc + i.currentStock * i.purchasePrice, 0);
  const totalSalesValuation = items.reduce((acc, i) => acc + i.currentStock * i.sellingPrice, 0);
  const lowStockCount = items.filter(i => i.currentStock <= i.minStockAlert).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setItemCode(`SKU-${Date.now().toString().slice(-4)}`);
    setHsnSac('8536');
    setCategory('General');
    setUnit('PCS');
    setPurchasePrice(0);
    setSellingPrice(0);
    setTaxRate(18);
    setOpeningStock(0);
    setCurrentStock(0);
    setMinStockAlert(5);
    setDescription('');
    setLocation('Warehouse Bay 1');
    setHasSecondaryUnit(false);
    setSecondaryUnit('BOX');
    setConversionFactor(24);
    setSecondarySellingPrice(0);
    setSecondaryPurchasePrice(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setItemCode(item.itemCode);
    setHsnSac(item.hsnSac);
    setCategory(item.category);
    setUnit(item.unit);
    setPurchasePrice(item.purchasePrice);
    setSellingPrice(item.sellingPrice);
    setTaxRate(item.taxRate);
    setOpeningStock(item.openingStock);
    setCurrentStock(item.currentStock);
    setMinStockAlert(item.minStockAlert);
    setDescription(item.description || '');
    setLocation(item.location || '');
    setHasSecondaryUnit(item.hasSecondaryUnit || false);
    setSecondaryUnit(item.secondaryUnit || 'BOX');
    setConversionFactor(item.conversionFactor || 24);
    setSecondarySellingPrice(item.secondarySellingPrice || 0);
    setSecondaryPurchasePrice(item.secondaryPurchasePrice || 0);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter Item Name');
      return;
    }

    if (editingItem) {
      updateItem({
        ...editingItem,
        name: name.trim(),
        itemCode: itemCode.trim(),
        hsnSac: hsnSac.trim(),
        category: category.trim() || 'General',
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        taxRate: Number(taxRate) || 0,
        openingStock: Number(openingStock) || 0,
        currentStock: Number(currentStock) || 0,
        minStockAlert: Number(minStockAlert) || 0,
        description,
        location,
        taxInclusive: false,
        hasSecondaryUnit,
        secondaryUnit: hasSecondaryUnit ? secondaryUnit : undefined,
        conversionFactor: hasSecondaryUnit ? (Number(conversionFactor) || 1) : undefined,
        secondarySellingPrice: hasSecondaryUnit ? (Number(secondarySellingPrice) || 0) : undefined,
        secondaryPurchasePrice: hasSecondaryUnit ? (Number(secondaryPurchasePrice) || 0) : undefined,
      });
    } else {
      addItem({
        name: name.trim(),
        itemCode: itemCode.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        hsnSac: hsnSac.trim() || '9999',
        category: category.trim() || 'General',
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        taxRate: Number(taxRate) || 0,
        openingStock: Number(openingStock) || 0,
        currentStock: Number(openingStock) || 0,
        minStockAlert: Number(minStockAlert) || 0,
        description,
        location,
        taxInclusive: false,
        hasSecondaryUnit,
        secondaryUnit: hasSecondaryUnit ? secondaryUnit : undefined,
        conversionFactor: hasSecondaryUnit ? (Number(conversionFactor) || 1) : undefined,
        secondarySellingPrice: hasSecondaryUnit ? (Number(secondarySellingPrice) || 0) : undefined,
        secondaryPurchasePrice: hasSecondaryUnit ? (Number(secondaryPurchasePrice) || 0) : undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustTargetItem(item);
    setAdjustQty(1);
    setAdjustType('add');
    setAdjustReason('Inventory Count Correction');
    setAdjustInSecondaryUnit(false);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetItem) return;
    const factor = (adjustInSecondaryUnit && adjustTargetItem.conversionFactor) ? adjustTargetItem.conversionFactor : 1;
    const effectiveQty = adjustQty * factor;
    const delta = adjustType === 'add' ? effectiveQty : -effectiveQty;
    const reasonText = (adjustInSecondaryUnit && adjustTargetItem.secondaryUnit)
      ? `${adjustReason} (${adjustQty} ${adjustTargetItem.secondaryUnit} = ${effectiveQty} ${adjustTargetItem.unit})`
      : adjustReason;
    adjustStock(adjustTargetItem.id, delta, reasonText);
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Items & Inventory</h1>
          <p className="text-xs text-slate-500">
            Track stock levels, HSN codes, GST tax rates, and purchase vs selling prices
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xml,.tsv,.txt,.json"
            onChange={handleImportItemsFile}
            className="hidden"
            id="inventory-bulk-import-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-all active:scale-95"
            title="Import items or bulk update prices & stock from CSV or Busy 21"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Import CSV / Busy 21</span>
          </button>

          <button
            type="button"
            onClick={handleExportItemsExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Export all inventory items with full details to MS-Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportItemsCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Export all items to CSV spreadsheet"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Items in Catalog</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {items.length} Products
          </p>
          <span className="text-[10px] text-slate-400">Tracked in warehouse</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Stock Value (Cost)</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalStockValuation)}
          </p>
          <span className="text-[10px] text-slate-400">At current purchase price</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Expected Sales Realization</span>
          <p className="text-lg font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalSalesValuation)}
          </p>
          <span className="text-[10px] text-emerald-600">At current selling rate</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Low Stock Alerts</span>
            {lowStockCount > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>}
          </span>
          <p className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {lowStockCount} Items
          </p>
          <span className="text-[10px] text-slate-400">Below reorder threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search items by name, SKU or HSN code..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              onlyLowStock
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                <th className="py-3 px-3">Item Name & SKU</th>
                <th className="py-3 px-3">HSN/SAC</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Stock Qty</th>
                <th className="py-3 px-3 text-right">Purchase Rate</th>
                <th className="py-3 px-3 text-right">Selling Rate</th>
                <th className="py-3 px-3 text-center">GST %</th>
                <th className="py-3 px-3 text-right">Stock Value (Cost)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <Package className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No items in this Business Profile yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Add inventory items with HSN/SAC code, purchase price, selling price, and GST rate.</p>
                    <button
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>Add Your First Item</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLow = item.currentStock <= item.minStockAlert;
                  const itemStockValue = item.currentStock * item.purchasePrice;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span>SKU: {item.itemCode}</span>
                          {item.location && <span>· Loc: {item.location}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {item.hsnSac || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                        <div className="font-bold">
                          {item.currentStock}{' '}
                          <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                        </div>
                        {item.hasSecondaryUnit && item.secondaryUnit && item.conversionFactor && item.conversionFactor > 1 && (
                          <div className="mt-0.5">
                            <span 
                              className="inline-block px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]"
                              title={`Conversion: 1 ${item.secondaryUnit} = ${item.conversionFactor} ${item.unit}`}
                            >
                              {formatDualStock(item.currentStock, item.unit, item.secondaryUnit, item.conversionFactor).secondaryText}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              1 {item.secondaryUnit} = {item.conversionFactor} {item.unit}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        <div>{formatINR(item.purchasePrice)}</div>
                        {item.hasSecondaryUnit && item.secondaryUnit && item.secondaryPurchasePrice ? (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {formatINR(item.secondaryPurchasePrice)}/{item.secondaryUnit}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        <div>{formatINR(item.sellingPrice)}</div>
                        {item.hasSecondaryUnit && item.secondaryUnit && (
                          <div className="text-[10px] text-indigo-700 font-semibold">
                            {formatINR(item.secondarySellingPrice || (item.sellingPrice * (item.conversionFactor || 1)))}/{item.secondaryUnit}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                        {item.taxRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-800">
                        {formatINR(itemStockValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                            title="Adjust Stock (+ / -)"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Inventory Item' : 'Add New Item to Inventory'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schneider Acti9 4-Pole 63A MCB"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Item Code / SKU</label>
                  <input
                    type="text"
                    value={itemCode}
                    onChange={e => setItemCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8536 or 8544"
                    value={hsnSac}
                    onChange={e => setHsnSac(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Switchgear, Cables"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Measuring Unit *</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as UnitType)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    {COMMON_UNITS.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Purchase Price (₹, Excl. GST)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-semibold tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Selling Price (₹, Excl. GST)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold text-slate-900 tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">GST Tax Rate *</label>
                  <select
                    value={taxRate}
                    onChange={e => setTaxRate(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-semibold"
                  >
                    {GST_RATES.map(rate => (
                      <option key={rate} value={rate}>
                        {rate}% GST
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">
                    {editingItem ? 'Current Stock Qty' : 'Opening Stock Qty'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingItem ? currentStock : openingStock}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if (editingItem) setCurrentStock(val);
                      else setOpeningStock(val);
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Warehouse Location / Rack</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack B-12"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Item Description / Technical Specs</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Technical specifications, warranty details, etc."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                {/* Unit Conversion (Alternate / Secondary Unit) Section */}
                <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-slate-50 border border-blue-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasSecondaryUnit}
                        onChange={e => setHasSecondaryUnit(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-blue-600" />
                        Enable Alternate / Wholesale Unit (पेटी / बॉक्स कन्वर्जन)
                      </span>
                    </label>
                    <span className="text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full font-semibold">
                      Dual Unit Inventory
                    </span>
                  </div>

                  {hasSecondaryUnit && (
                    <div className="space-y-3 pt-1 border-t border-blue-200/60 animate-in fade-in">
                      {/* Popular presets */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          ⚡ Popular Conversion Presets (क्लिक करके चुनें):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {POPULAR_CONVERSION_PRESETS.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                setSecondaryUnit(preset.secondary);
                                setUnit(preset.base);
                                setConversionFactor(preset.factor);
                                if (sellingPrice > 0) {
                                  setSecondarySellingPrice(Number((sellingPrice * preset.factor).toFixed(2)));
                                }
                                if (purchasePrice > 0) {
                                  setSecondaryPurchasePrice(Number((purchasePrice * preset.factor).toFixed(2)));
                                }
                              }}
                              className="text-[10px] font-semibold px-2 py-1 rounded bg-white hover:bg-blue-100 text-slate-700 hover:text-blue-900 border border-slate-200 transition-colors shadow-2xs"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Unit Multiplier Config */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-blue-200/70">
                        <div>
                          <label className="font-semibold text-slate-700 block text-[11px]">
                            Secondary Unit (थोक इकाई) *
                          </label>
                          <select
                            value={secondaryUnit}
                            onChange={e => setSecondaryUnit(e.target.value as UnitType)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-1 font-bold text-slate-800 bg-white"
                          >
                            {ALL_SUPPORTED_UNITS.map(u => (
                              <option key={u.code} value={u.code}>
                                {u.code} — {u.nameHi}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block text-[11px]">
                            Conversion Multiplier *
                          </label>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">1 {secondaryUnit} =</span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              required={hasSecondaryUnit}
                              value={conversionFactor}
                              onChange={e => {
                                const factor = parseFloat(e.target.value) || 1;
                                setConversionFactor(factor);
                              }}
                              className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-center"
                            />
                            <span className="text-xs text-slate-700 font-bold">{unit}</span>
                          </div>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              const factor = Number(conversionFactor) || 1;
                              if (sellingPrice > 0) {
                                setSecondarySellingPrice(Number((sellingPrice * factor).toFixed(2)));
                              }
                              if (purchasePrice > 0) {
                                setSecondaryPurchasePrice(Number((purchasePrice * factor).toFixed(2)));
                              }
                            }}
                            className="w-full py-1.5 px-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition-colors"
                          >
                            Auto Calc Rates (× {conversionFactor})
                          </button>
                        </div>

                        {/* Secondary Rates */}
                        <div>
                          <label className="font-semibold text-slate-700 block text-[11px]">
                            Selling Rate per {secondaryUnit} (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={secondarySellingPrice}
                            onChange={e => setSecondarySellingPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold text-slate-900"
                            placeholder={String((sellingPrice * (conversionFactor || 1)).toFixed(2))}
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block text-[11px]">
                            Purchase Rate per {secondaryUnit} (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={secondaryPurchasePrice}
                            onChange={e => setSecondaryPurchasePrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-medium text-slate-800"
                            placeholder={String((purchasePrice * (conversionFactor || 1)).toFixed(2))}
                          />
                        </div>

                        <div className="flex items-center text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span>
                            💡 <strong>Summary:</strong> 1 {secondaryUnit} = {conversionFactor} {unit}
                            {secondarySellingPrice > 0 && ` (₹${secondarySellingPrice} / ${secondaryUnit})`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustTargetItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Adjust Stock</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                  {adjustTargetItem.name}
                </p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Current Stock:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {adjustTargetItem.currentStock} {adjustTargetItem.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 px-3 rounded-lg font-bold text-center border transition-colors ${
                      adjustType === 'add'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    + Add Stock (In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('reduce')}
                    className={`py-2 px-3 rounded-lg font-bold text-center border transition-colors ${
                      adjustType === 'reduce'
                        ? 'bg-rose-50 text-rose-700 border-rose-400'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    - Reduce Stock (Out)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Quantity to Adjust ({adjustInSecondaryUnit ? adjustTargetItem.secondaryUnit : adjustTargetItem.unit})
                  </label>
                  {adjustTargetItem.hasSecondaryUnit && adjustTargetItem.secondaryUnit && (
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setAdjustInSecondaryUnit(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          !adjustInSecondaryUnit
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {adjustTargetItem.unit} (Base)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustInSecondaryUnit(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          adjustInSecondaryUnit
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {adjustTargetItem.secondaryUnit} (Wholesale)
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold text-slate-900 text-base"
                />
                {adjustInSecondaryUnit && adjustTargetItem.conversionFactor && (
                  <p className="text-[11px] text-blue-700 font-medium mt-1">
                    ℹ️ {adjustQty} {adjustTargetItem.secondaryUnit} will adjust{' '}
                    <strong>{adjustQty * adjustTargetItem.conversionFactor} {adjustTargetItem.unit}</strong> in base stock.
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                >
                  <option value="Inventory Count Correction">Physical Inventory Count Correction</option>
                  <option value="Damaged Stock">Damaged Stock</option>
                  <option value="Lost / Theft">Lost / Theft</option>
                  <option value="Internal Use">Internal Use / Demo</option>
                  <option value="Customer Return">Customer Return</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
