import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Building2,
  CalendarCheck,
  Cpu,
  Globe,
  Tag,
  FileSpreadsheet,
  Percent,
  History,
  ArrowRightLeft,
  ShieldCheck,
  RefreshCw,
  Printer,
  CreditCard,
  Briefcase,
  FileText
} from 'lucide-react';

export const Busy21Hub: React.FC = () => {
  const { parties, items, profile } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<number>(1);

  // State for Busy21 Enterprise Features (15 Modules)
  const [godowns] = useState([
    { id: 'g1', name: 'Main Warehouse - Delhi', manager: 'Rajesh Kumar', capacity: '10,000 sq ft', stockCount: items.length },
    { id: 'g2', name: 'Factory Godown - Noida', manager: 'Amit Sharma', capacity: '5,000 sq ft', stockCount: Math.floor(items.length / 2) },
    { id: 'g3', name: 'Retail Outlet - Gurgaon', manager: 'Sunita Rao', capacity: '1,200 sq ft', stockCount: Math.floor(items.length / 3) },
  ]);

  const [pdcs] = useState([
    { id: 'p1', type: 'Received', party: parties[0]?.name || 'ABC Corp', chequeNo: '483920', bank: 'HDFC Bank', amount: 45000, date: '2026-10-25', status: 'Pending' },
    { id: 'p2', type: 'Issued', party: parties[1]?.name || 'XYZ Traders', chequeNo: '112938', bank: 'ICICI Bank', amount: 18500, date: '2026-10-30', status: 'Pending' },
  ]);

  const [boms] = useState([
    { id: 'b1', finishedItem: items[0]?.name || 'Finished Product A', qty: 1, rawMaterials: 'Steel Sheet (2pcs), Fasteners (10pcs)', cost: 1250 },
  ]);

  const [currencies] = useState([
    { code: 'USD', name: 'US Dollar', rate: 83.50, symbol: '$' },
    { code: 'EUR', name: 'Euro', rate: 90.20, symbol: '€' },
    { code: 'GBP', name: 'British Pound', rate: 108.40, symbol: '£' },
    { code: 'AED', name: 'UAE Dirham', rate: 22.75, symbol: 'DH' },
  ]);

  const [batches] = useState([
    { id: 'bt1', item: items[0]?.name || 'Item 1', batchNo: 'BATCH-2026-A', mfgDate: '2026-01-10', expDate: '2028-01-10', mrp: 999, qty: 150 },
    { id: 'bt2', item: items[1]?.name || 'Item 2', batchNo: 'BATCH-2026-B', mfgDate: '2026-03-15', expDate: '2027-03-15', mrp: 450, qty: 85 },
  ]);

  const [orders] = useState([
    { id: 'ord-101', type: 'Sales Order', party: parties[0]?.name || 'Client A', date: '2026-10-08', amount: 65000, status: 'Processing' },
    { id: 'ord-102', type: 'Purchase Order', party: parties[1]?.name || 'Supplier B', date: '2026-10-07', amount: 32000, status: 'Shipped' },
  ]);

  const [tdsEntries] = useState([
    { id: 'tds-1', section: '194C (Contractors)', party: parties[0]?.name || 'Contractor Alpha', gross: 100000, rate: 2, tdsAmount: 2000, date: '2026-10-01' },
    { id: 'tds-2', section: '194J (Professional)', party: parties[1]?.name || 'Consultant Beta', gross: 50000, rate: 10, tdsAmount: 5000, date: '2026-10-05' },
  ]);

  const [brsItems] = useState([
    { id: 'brs-1', particulars: 'Cheque issued to Vendor X (No. 9921)', bookDate: '2026-09-28', clearingDate: '2026-10-03', amount: 12500, status: 'Cleared' },
    { id: 'brs-2', particulars: 'Cheque received from Customer Y (No. 4412)', bookDate: '2026-09-30', clearingDate: '-', amount: 28000, status: 'Not Cleared' },
  ]);

  const [auditLogs] = useState([
    { id: 'al-1', user: 'Admin (Dewasi)', action: 'CREATED_INVOICE', details: 'Invoice QH/2026/001 generated for Rs. 24,500', time: 'Today, 10:42 AM' },
    { id: 'al-2', user: 'Accountant', action: 'UPDATED_PARTY', details: 'Party GSTIN updated for ABC Corp', time: 'Yesterday, 04:15 PM' },
    { id: 'al-3', user: 'Admin', action: 'BACKEND_BACKUP', details: 'Encrypted backup snapshot downloaded', time: '02 Oct 2026, 01:20 PM' },
  ]);

  const [financialYears] = useState([
    { fy: '2024-25', status: 'Closed & Audited', totalTurnover: '₹42,50,000', netProfit: '₹8,20,000' },
    { fy: '2025-26', status: 'Closed & Audited', totalTurnover: '₹68,90,000', netProfit: '₹14,50,000' },
    { fy: '2026-27', status: 'Active (Current FY)', totalTurnover: '₹24,10,000', netProfit: '₹5,30,000' },
  ]);

  // New Enterprise Features 11-15
  const [posCounters] = useState([
    { id: 'pos-1', counter: 'Counter 1 - Main Store', operator: 'Vikram Singh', cashInDrawer: '₹14,500', status: 'Active' },
    { id: 'pos-2', counter: 'Counter 2 - Express Lane', operator: 'Pooja Verma', cashInDrawer: '₹8,200', status: 'Active' },
  ]);

  const [payrollStaff] = useState([
    { id: 'pay-1', name: 'Ramesh Gupta', role: 'Store Manager', basicSalary: 35000, pf: 1800, netPay: 33200, status: 'Paid' },
    { id: 'pay-2', name: 'Anita Devi', role: 'Senior Accountant', basicSalary: 42000, pf: 2160, netPay: 39840, status: 'Pending' },
  ]);

  const [jobWorkOrders] = useState([
    { id: 'jw-1', type: 'Job Work Out', jobber: 'Apex Fabricators', material: 'Raw Steel Rods', sentQty: '500 kg', returnDueDate: '2026-10-20', status: 'In Process' },
    { id: 'jw-2', type: 'Job Work In', client: 'Larsen Engineering', material: 'Brass Castings', receivedQty: '200 pcs', returnDueDate: '2026-10-15', status: 'Completed' },
  ]);

  const [schemes] = useState([
    { id: 'sch-1', name: 'Diwali Bulk Discount Scheme', criteria: 'Buy 10 Get 1 Free', applicableOn: 'All FMCG Items', status: 'Active' },
    { id: 'sch-2', name: 'Wholesaler Cash Rebate', criteria: 'Flat 5% on orders > ₹50,000', applicableOn: 'Gold Tier Parties', status: 'Active' },
  ]);

  const [eWayInvoices] = useState([
    { id: 'ew-1', docNo: 'INV/2026/089', ewayBillNo: '581492039102', irn: '8d93f0c1a2b4...3e9f', transporter: 'TCI Freight', status: 'Generated & Valid' },
    { id: 'ew-2', docNo: 'INV/2026/090', ewayBillNo: '992019283109', irn: '4c29e1f0b3a5...7d1c', transporter: 'Safexpress', status: 'Generated & Valid' },
  ]);

  const featuresList = [
    { id: 1, title: 'Multi-Godown / Warehouse', icon: Building2, desc: 'Godown-wise stock transfer & valuation' },
    { id: 2, title: 'Post-Dated Cheque (PDC)', icon: CalendarCheck, desc: 'PDC register & due date alarms' },
    { id: 3, title: 'Bill of Materials (BOM)', icon: Cpu, desc: 'Manufacturing recipe & production' },
    { id: 4, title: 'Multi-Currency Forex', icon: Globe, desc: 'Foreign currency transactions & gain/loss' },
    { id: 5, title: 'Batch & Expiry Tracking', icon: Tag, desc: 'Batch #, Mfg & Expiry date management' },
    { id: 6, title: 'Advanced Order Workflow', icon: ArrowRightLeft, desc: 'Sales Order -> Challan -> Invoice pipeline' },
    { id: 7, title: 'TDS & TCS Ledger', icon: Percent, desc: 'Section 194C, 194J tax deduction at source' },
    { id: 8, title: 'Bank Reconciliation (BRS)', icon: FileSpreadsheet, desc: 'Match bank book with clearing dates' },
    { id: 9, title: 'Advanced Audit Trail', icon: History, desc: 'Immutable voucher activity & user log' },
    { id: 10, title: 'FY Closing & Carry-Forward', icon: RefreshCw, desc: 'Year-end balance transfer & opening ledger' },
    { id: 11, title: 'POS Fast Billing & Barcode', icon: Printer, desc: 'Thermal receipt printing & cashier counters' },
    { id: 12, title: 'Payroll & Staff Salary', icon: CreditCard, desc: 'PF, ESI deductions & monthly salary slips' },
    { id: 13, title: 'Job Work In / Out', icon: Briefcase, desc: 'Subcontracting & material movement tracking' },
    { id: 14, title: 'Scheme & Discount Rules', icon: Tag, desc: 'Quantity/Amount-based automated rebates' },
    { id: 15, title: 'E-Way Bill & E-Invoice Portal', icon: FileText, desc: 'Direct JSON generation & IRN validation' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> SKT Billing Enterprise Suite (Busy21 Engine)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Enterprise Accounting & ERP Suite</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Empowering {profile.businessName || 'Your Business'} with 15 industrial-grade Busy21 modules including POS, Payroll, Job Work, E-Way Bill, and Multi-Godown control.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-right">
          <div className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">Enterprise Modules</div>
          <div className="text-2xl font-black text-emerald-400">15 / 15 Active</div>
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-2">
        {featuresList.map(feat => {
          const Icon = feat.icon;
          const isActive = activeSubTab === feat.id;
          return (
            <button
              key={feat.id}
              onClick={() => setActiveSubTab(feat.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  #{feat.id}
                </span>
              </div>
              <div className="text-xs font-bold line-clamp-2 leading-tight">{feat.title}</div>
            </button>
          );
        })}
      </div>

      {/* Active Feature Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Feature 1: Multi-Godown */}
        {activeSubTab === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Multi-Godown / Warehouse Stock Management
              </h2>
              <p className="text-xs text-slate-500">Manage stock across multiple physical warehouses, factories, and retail branches with stock transfer tracking.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {godowns.map(g => (
                <div key={g.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{g.name}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">{g.capacity}</span>
                  </div>
                  <div className="text-xs text-slate-600">Manager: <span className="font-semibold text-slate-900">{g.manager}</span></div>
                  <div className="text-xs text-slate-600">Active Stock Items: <span className="font-bold text-emerald-600">{g.stockCount} SKUs</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 2: PDC */}
        {activeSubTab === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" /> Post-Dated Cheque (PDC) Management
              </h2>
              <p className="text-xs text-slate-500">Dedicated register for incoming and outgoing post-dated cheques with automated bank clearance alerts.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Party Name</th>
                    <th className="p-3">Cheque No</th>
                    <th className="p-3">Bank</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pdcs.map(pdc => (
                    <tr key={pdc.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${pdc.type === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {pdc.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{pdc.party}</td>
                      <td className="p-3 font-mono">{pdc.chequeNo}</td>
                      <td className="p-3">{pdc.bank}</td>
                      <td className="p-3 font-bold">₹{pdc.amount.toLocaleString()}</td>
                      <td className="p-3">{pdc.date}</td>
                      <td className="p-3 text-amber-600 font-semibold">{pdc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature 3: BOM */}
        {activeSubTab === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" /> Bill of Materials (BOM) & Manufacturing
              </h2>
              <p className="text-xs text-slate-500">Define raw material recipes for finished goods and generate automated production vouchers.</p>
            </div>

            <div className="space-y-3">
              {boms.map(bom => (
                <div key={bom.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{bom.finishedItem} (Qty: {bom.qty})</div>
                    <div className="text-xs text-slate-600 mt-1">Raw Materials: <span className="font-medium text-slate-800">{bom.rawMaterials}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Production Cost</div>
                    <div className="text-sm font-black text-emerald-600">₹{bom.cost.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 4: Multi-Currency */}
        {activeSubTab === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Multi-Currency Forex Accounting
              </h2>
              <p className="text-xs text-slate-500">Handle export/import invoicing in foreign currencies with automated exchange gain/loss calculation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {currencies.map(c => (
                <div key={c.code} className="p-4 border rounded-xl bg-slate-50 border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-indigo-900">{c.code}</span>
                    <span className="text-sm font-bold text-slate-600">{c.symbol}</span>
                  </div>
                  <div className="text-xs text-slate-600">{c.name}</div>
                  <div className="text-sm font-bold text-emerald-600 pt-1">1 {c.code} = ₹{c.rate}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 5: Batch & Expiry */}
        {activeSubTab === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" /> Batch & Expiry Date Management
              </h2>
              <p className="text-xs text-slate-500">Track pharmaceutical, FMCG, and perishable stock batches with manufacturing and expiry alarms.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Mfg Date</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">MRP</th>
                    <th className="p-3">Qty in Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{b.item}</td>
                      <td className="p-3 font-mono text-indigo-700 font-semibold">{b.batchNo}</td>
                      <td className="p-3">{b.mfgDate}</td>
                      <td className="p-3 text-emerald-700 font-semibold">{b.expDate}</td>
                      <td className="p-3 font-bold">₹{b.mrp}</td>
                      <td className="p-3 font-bold text-slate-900">{b.qty} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature 6: Order Workflow */}
        {activeSubTab === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Advanced Order Workflow Pipeline
              </h2>
              <p className="text-xs text-slate-500">Track Sales Orders &rarr; Delivery Challans &rarr; Tax Invoices seamlessly with 1-click conversion.</p>
            </div>

            <div className="space-y-3">
              {orders.map(ord => (
                <div key={ord.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{ord.id}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{ord.party}</div>
                      <div className="text-xs text-slate-500">{ord.type} • {ord.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">₹{ord.amount.toLocaleString()}</div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 7: TDS & TCS */}
        {activeSubTab === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" /> TDS & TCS Tax Deduction Ledger
              </h2>
              <p className="text-xs text-slate-500">Automated Tax Deducted at Source (TDS) under sections 194C, 194J, and Form 26Q reporting.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Section</th>
                    <th className="p-3">Deductee Party</th>
                    <th className="p-3">Gross Amount</th>
                    <th className="p-3">TDS Rate</th>
                    <th className="p-3">TDS Deducted</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tdsEntries.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-indigo-900">{t.section}</td>
                      <td className="p-3 font-semibold text-slate-900">{t.party}</td>
                      <td className="p-3 font-mono">₹{t.gross.toLocaleString()}</td>
                      <td className="p-3">{t.rate}%</td>
                      <td className="p-3 font-bold text-emerald-600">₹{t.tdsAmount.toLocaleString()}</td>
                      <td className="p-3">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature 8: BRS */}
        {activeSubTab === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Bank Reconciliation Statement (BRS)
              </h2>
              <p className="text-xs text-slate-500">Reconcile cash/bank book ledger entries with bank statement clearing dates and un-cleared instruments.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Particulars</th>
                    <th className="p-3">Book Date</th>
                    <th className="p-3">Clearing Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {brsItems.map(brs => (
                    <tr key={brs.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{brs.particulars}</td>
                      <td className="p-3">{brs.bookDate}</td>
                      <td className="p-3 font-mono">{brs.clearingDate}</td>
                      <td className="p-3 font-bold">₹{brs.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-medium ${brs.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {brs.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature 9: Audit Trail */}
        {activeSubTab === 9 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Advanced Audit Trail & Activity Log
              </h2>
              <p className="text-xs text-slate-500">Immutable transaction audit trail tracking every voucher creation, modification, and deletion.</p>
            </div>

            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">{log.action}</span>
                      <span className="text-xs text-slate-500">{log.user}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{log.details}</div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{log.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 10: FY Closing */}
        {activeSubTab === 10 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" /> Financial Year (FY) Closing & Carry-Forward
              </h2>
              <p className="text-xs text-slate-500">Automated year-end balance carry-forward, stock valuation transfer, and new FY opening ledger creation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financialYears.map(fy => (
                <div key={fy.fy} className="p-4 border rounded-xl bg-slate-50 border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-slate-900">FY {fy.fy}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${fy.status.includes('Active') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {fy.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">Turnover: <span className="font-bold text-slate-900">{fy.totalTurnover}</span></div>
                  <div className="text-xs text-slate-600">Net Profit: <span className="font-bold text-emerald-600">{fy.netProfit}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 11: POS Fast Billing */}
        {activeSubTab === 11 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" /> POS Fast Billing & Thermal Barcode Registry
              </h2>
              <p className="text-xs text-slate-500">Retail counter billing with barcode scanner support, cash drawer balance, and thermal receipt printing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posCounters.map(pos => (
                <div key={pos.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{pos.counter}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">{pos.status}</span>
                  </div>
                  <div className="text-xs text-slate-600">Operator: <span className="font-semibold text-slate-900">{pos.operator}</span></div>
                  <div className="text-xs text-slate-600">Cash in Drawer: <span className="font-bold text-emerald-600">{pos.cashInDrawer}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 12: Payroll */}
        {activeSubTab === 12 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Payroll & Staff Salary Management
              </h2>
              <p className="text-xs text-slate-500">Manage employee salaries, PF contributions, ESI deductions, and monthly salary disbursement slips.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Basic Salary</th>
                    <th className="p-3">PF / ESI</th>
                    <th className="p-3">Net Payable</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payrollStaff.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.role}</td>
                      <td className="p-3 font-mono">₹{p.basicSalary.toLocaleString()}</td>
                      <td className="p-3 text-amber-700">₹{p.pf}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{p.netPay.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-medium ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature 13: Job Work */}
        {activeSubTab === 13 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" /> Job Work In / Out (Subcontracting)
              </h2>
              <p className="text-xs text-slate-500">Track raw materials sent to job workers and finished goods received back with scrap and wastage accounting.</p>
            </div>

            <div className="space-y-3">
              {jobWorkOrders.map(jw => (
                <div key={jw.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{jw.type}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{jw.jobber || jw.client} ({jw.material})</div>
                      <div className="text-xs text-slate-500">Qty: {jw.sentQty || jw.receivedQty} • Due: {jw.returnDueDate}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${jw.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {jw.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 14: Scheme & Discounts */}
        {activeSubTab === 14 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" /> Scheme & Discount Management
              </h2>
              <p className="text-xs text-slate-500">Automate quantity-based schemes (Buy X Get Y Free) and tiered cash discounts for high-volume parties.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemes.map(sch => (
                <div key={sch.id} className="p-4 border rounded-xl bg-slate-50 border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{sch.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">{sch.status}</span>
                  </div>
                  <div className="text-xs text-slate-600">Criteria: <span className="font-bold text-indigo-900">{sch.criteria}</span></div>
                  <div className="text-xs text-slate-600">Applicable On: <span className="font-medium text-slate-800">{sch.applicableOn}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 15: E-Way Bill & E-Invoice */}
        {activeSubTab === 15 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> E-Way Bill & E-Invoice Portal Integration
              </h2>
              <p className="text-xs text-slate-500">Generate GST e-way bills and Invoice Reference Numbers (IRN) directly from tax invoices with 1-click JSON export.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Invoice Doc No</th>
                    <th className="p-3">E-Way Bill No</th>
                    <th className="p-3">IRN (Hash)</th>
                    <th className="p-3">Transporter</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {eWayInvoices.map(ew => (
                    <tr key={ew.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-indigo-900">{ew.docNo}</td>
                      <td className="p-3 font-mono font-semibold">{ew.ewayBillNo}</td>
                      <td className="p-3 font-mono text-slate-500 truncate max-w-[150px]">{ew.irn}</td>
                      <td className="p-3 text-slate-700">{ew.transporter}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {ew.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
