'use client';

import React, { useState, useTransition } from 'react';
import {
  Tv,
  Wifi,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  TrendingUp,
  Wrench,
  Inbox,
  RefreshCw,
  FileText,
  BarChart,
  UserCheck,
  Coins,
  Package,
  Search,
  ChevronRight,
  Shield,
  Clock,
  Briefcase,
  AlertTriangle,
  Settings
} from 'lucide-react';

import {
  triggerReseed,
  createArea,
  createCollector,
  createTechnician,
  createServicePlan,
  createCustomer,
  payBill,
  settleCollector,
  submitComplaint,
  updateComplaint,
  createSTBBox,
  updateSTBStatus,
  createExpense,
  runMonthlyBilling
} from '@/app/actions';

// Define Serialized Types (Dates converted to ISO Strings for safe Next.js serialization)
interface Area {
  id: number;
  name: string;
  code: string;
}

interface Collector {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  areaId: number | null;
  balance: number;
}

interface Technician {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  specialization: string;
}

interface ServicePlan {
  id: number;
  name: string;
  type: string;
  monthlyCharge: number;
  tax: number;
  speedOrDetails: string | null;
}

interface Customer {
  id: number;
  name: string;
  customerCode: string;
  phone: string;
  email: string | null;
  address: string;
  areaId: number | null;
  collectorId: number | null;
  status: string;
  connectionType: string;
  cablePlanId: number | null;
  internetPlanId: number | null;
  installationDate: string;
  balance: number;
}

interface Bill {
  id: number;
  customerId: number;
  billDate: string;
  dueDate: string;
  planCharge: number;
  tax: number;
  totalAmount: number;
  status: string;
  paidDate: string | null;
  paidAmount: number;
  paymentMethod: string | null;
  collectorId: number | null;
}

interface Collection {
  id: number;
  customerId: number;
  collectorId: number;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  settlementStatus: string;
  settledDate: string | null;
}

interface Complaint {
  id: number;
  customerId: number;
  type: string;
  description: string;
  status: string;
  priority: string;
  assignedTechnicianId: number | null;
  createdDate: string;
  closedDate: string | null;
  comments: string | null;
}

interface STB {
  id: number;
  stbNumber: string;
  type: string;
  status: string;
  assignedCustomerName: string | null;
  updatedDate: string;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

interface Props {
  areas: Area[];
  collectors: Collector[];
  technicians: Technician[];
  servicePlans: ServicePlan[];
  customers: Customer[];
  bills: Bill[];
  collections: Collection[];
  complaints: Complaint[];
  stb: STB[];
  expenses: Expense[];
}

export default function DashboardClient({
  areas,
  collectors,
  technicians,
  servicePlans,
  customers,
  bills,
  collections,
  complaints,
  stb,
  expenses: initialExpenses
}: Props) {
  // Navigation & View Roles
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'collector' | 'technician'>('admin');
  
  // Simulated Persona IDs
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customers[0]?.id || 1);
  const [selectedCollectorId, setSelectedCollectorId] = useState<number>(collectors[0]?.id || 1);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number>(technicians[0]?.id || 1);

  // Admin Portal Sub-navigation (matching Excel tabs)
  const [adminTab, setAdminTab] = useState<'dashboard' | 'customer_master' | 'collector_master' | 'due_list' | 'complaints' | 'expenses' | 'inventory' | 'config'>('dashboard');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // UI state for creation forms
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals / Dropdowns / New Item Forms
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddCollector, setShowAddCollector] = useState(false);
  const [showAddTechnician, setShowAddTechnician] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddSTB, setShowAddSTB] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // New Item State Variables
  const [newCustName, setNewCustName] = useState('');
  const [newCustCode, setNewCustCode] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustArea, setNewCustArea] = useState(areas[0]?.id || 1);
  const [newCustCollector, setNewCustCollector] = useState(collectors[0]?.id || 1);
  const [newCustConnType, setNewCustConnType] = useState('Cable');
  const [newCustCablePlan, setNewCustCablePlan] = useState<number>(servicePlans.find(p => p.type === 'Cable')?.id || 0);
  const [newCustNetPlan, setNewCustNetPlan] = useState<number>(servicePlans.find(p => p.type === 'Internet')?.id || 0);

  const [newCollectorName, setNewCollectorName] = useState('');
  const [newCollectorPhone, setNewCollectorPhone] = useState('');
  const [newCollectorEmail, setNewCollectorEmail] = useState('');
  const [newCollectorArea, setNewCollectorArea] = useState(areas[0]?.id || 1);

  const [newTechName, setNewTechName] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechSpec, setNewTechSpec] = useState('Both');

  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCode, setNewAreaCode] = useState('');

  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanType, setNewPlanType] = useState('Cable');
  const [newPlanCharge, setNewPlanCharge] = useState(250);
  const [newPlanTax, setNewPlanTax] = useState(45);
  const [newPlanSpeed, setNewPlanSpeed] = useState('');

  const [newSTBNo, setNewSTBNo] = useState('');
  const [newSTBType, setNewSTBType] = useState('HD');
  const [newSTBStatus, setNewSTBStatus] = useState('New');

  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState(0);
  const [newExpCat, setNewExpCat] = useState('Cable');
  const [newExpNotes, setNewExpNotes] = useState('');

  // Customer Portal Interactions
  const [customerComplaintType, setCustomerComplaintType] = useState('Cable');
  const [customerComplaintDesc, setCustomerComplaintDesc] = useState('');
  const [customerComplaintPriority, setCustomerComplaintPriority] = useState('Medium');
  const [customerPayAmount, setCustomerPayAmount] = useState(0);
  const [customerPayMethod, setCustomerPayMethod] = useState('UPI');

  // Collector Portal Interactions
  const [collectorPayCustId, setCollectorPayCustId] = useState<number>(0);
  const [collectorPayAmount, setCollectorPayAmount] = useState(0);
  const [collectorPayMethod, setCollectorPayMethod] = useState('Cash');

  // Technician Portal Interactions
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [techComments, setTechComments] = useState('');

  // Auto-clear notification after 4 seconds
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Trigger Database Reseed
  const handleReseed = () => {
    if (confirm('Are you sure you want to reset all data back to original realistic values?')) {
      startTransition(async () => {
        const res = await triggerReseed();
        if (res.success) {
          showNotification('Database successfully restored to original seed values!');
        } else {
          showNotification(res.error || 'Failed to re-seed database', 'error');
        }
      });
    }
  };

  // Run Batch billing
  const handleBatchBilling = () => {
    if (confirm('Generate monthly bills for all active customers? This will append the service charges to their outstanding balances.')) {
      startTransition(async () => {
        const res = await runMonthlyBilling();
        if (res.success) {
          showNotification(`Successfully generated bills for ${res.count} active customers! Total ₹${res.totalAmount} invoiced.`);
        } else {
          showNotification(res.error || 'Failed to execute batch billing', 'error');
        }
      });
    }
  };

  // Handle Create Customer
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone || !newCustAddress || !newCustCode) {
      showNotification('Please fill in all mandatory fields', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createCustomer({
        name: newCustName,
        customerCode: newCustCode,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
        areaId: Number(newCustArea),
        collectorId: Number(newCustCollector),
        connectionType: newCustConnType,
        cablePlanId: newCustConnType !== 'Internet' ? Number(newCustCablePlan) : undefined,
        internetPlanId: newCustConnType !== 'Cable' ? Number(newCustNetPlan) : undefined,
      });
      if (res.success) {
        showNotification(`Customer ${newCustName} (${newCustCode.toUpperCase()}) created successfully!`);
        setShowAddCustomer(false);
        // Clear fields
        setNewCustName('');
        setNewCustCode('');
        setNewCustPhone('');
        setNewCustEmail('');
        setNewCustAddress('');
      } else {
        showNotification(res.error || 'Failed to create customer', 'error');
      }
    });
  };

  // Handle Create Collector
  const handleCreateCollectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectorName || !newCollectorPhone) {
      showNotification('Name and Phone are required', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createCollector({
        name: newCollectorName,
        phone: newCollectorPhone,
        email: newCollectorEmail,
        areaId: Number(newCollectorArea),
      });
      if (res.success) {
        showNotification(`Collector ${newCollectorName} added successfully!`);
        setShowAddCollector(false);
        setNewCollectorName('');
        setNewCollectorPhone('');
        setNewCollectorEmail('');
      } else {
        showNotification(res.error || 'Failed to create collector', 'error');
      }
    });
  };

  // Handle Create Technician
  const handleCreateTechnicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName || !newTechPhone) {
      showNotification('Name and Phone are required', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createTechnician({
        name: newTechName,
        phone: newTechPhone,
        email: newTechEmail,
        specialization: newTechSpec,
      });
      if (res.success) {
        showNotification(`Technician ${newTechName} added successfully!`);
        setShowAddTechnician(false);
        setNewTechName('');
        setNewTechPhone('');
        setNewTechEmail('');
      } else {
        showNotification(res.error || 'Failed to add technician', 'error');
      }
    });
  };

  // Handle Create Area
  const handleCreateAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName || !newAreaCode) {
      showNotification('Area Name and Code are required', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createArea({
        name: newAreaName,
        code: newAreaCode,
      });
      if (res.success) {
        showNotification(`Area "${newAreaName}" added successfully!`);
        setShowAddArea(false);
        setNewAreaName('');
        setNewAreaCode('');
      } else {
        showNotification(res.error || 'Failed to create area', 'error');
      }
    });
  };

  // Handle Create Service Plan
  const handleCreatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanCharge) {
      showNotification('Plan Name and Charge are required', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createServicePlan({
        name: newPlanName,
        type: newPlanType,
        monthlyCharge: newPlanCharge,
        tax: newPlanTax,
        speedOrDetails: newPlanSpeed,
      });
      if (res.success) {
        showNotification(`Plan "${newPlanName}" created successfully!`);
        setShowAddPlan(false);
        setNewPlanName('');
        setNewPlanSpeed('');
        setNewPlanCharge(250);
        setNewPlanTax(45);
      } else {
        showNotification(res.error || 'Failed to create service plan', 'error');
      }
    });
  };

  // Handle Create STB Box
  const handleCreateSTBSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSTBNo) {
      showNotification('STB Number is required', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createSTBBox({
        stbNumber: newSTBNo,
        type: newSTBType,
        status: newSTBStatus,
      });
      if (res.success) {
        showNotification(`STB ${newSTBNo} added to inventory!`);
        setShowAddSTB(false);
        setNewSTBNo('');
      } else {
        showNotification(res.error || 'Failed to add STB', 'error');
      }
    });
  };

  // Handle Create Expense
  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle || !newExpAmount) {
      showNotification('Title and Amount are required', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createExpense({
        title: newExpTitle,
        amount: newExpAmount,
        category: newExpCat,
        notes: newExpNotes,
      });
      if (res.success) {
        showNotification(`Expense of ₹${newExpAmount} logged!`);
        setShowAddExpense(false);
        setNewExpTitle('');
        setNewExpAmount(0);
        setNewExpNotes('');
      } else {
        showNotification(res.error || 'Failed to log expense', 'error');
      }
    });
  };

  // Settle Collector Cash Action
  const handleSettleCollector = (colId: number, colName: string) => {
    if (confirm(`Confirm settlement of collected cash from ${colName}? This resets their transit cash balance.`)) {
      startTransition(async () => {
        const res = await settleCollector(colId);
        if (res.success) {
          showNotification(`Cash settled from ${colName}!`);
        } else {
          showNotification(res.error || 'Failed to settle collector', 'error');
        }
      });
    }
  };

  // Customer Portal Payment Submit
  const handleCustomerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerPayAmount <= 0) {
      showNotification('Payment amount must be greater than 0', 'error');
      return;
    }
    startTransition(async () => {
      const res = await payBill({
        customerId: selectedCustomerId,
        amountPaid: customerPayAmount,
        paymentMethod: customerPayMethod,
      });
      if (res.success) {
        showNotification(`Payment of ₹${customerPayAmount} successfully recorded! Outstanding balance is now ₹${res.updatedBalance}.`);
        setCustomerPayAmount(0);
      } else {
        showNotification(res.error || 'Payment failed', 'error');
      }
    });
  };

  // Customer Portal Complaint Submit
  const handleCustomerComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerComplaintDesc) {
      showNotification('Please describe your issue', 'error');
      return;
    }
    startTransition(async () => {
      const res = await submitComplaint({
        customerId: selectedCustomerId,
        type: customerComplaintType,
        description: customerComplaintDesc,
        priority: customerComplaintPriority,
      });
      if (res.success) {
        showNotification(`Complaint submitted successfully! Our technicians are on it.`);
        setCustomerComplaintDesc('');
      } else {
        showNotification(res.error || 'Failed to submit complaint', 'error');
      }
    });
  };

  // Collector Portal Cash Record Submit
  const handleCollectorCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectorPayCustId === 0 || collectorPayAmount <= 0) {
      showNotification('Please select a customer and enter an amount', 'error');
      return;
    }
    startTransition(async () => {
      const res = await payBill({
        customerId: collectorPayCustId,
        amountPaid: collectorPayAmount,
        paymentMethod: collectorPayMethod,
        collectorId: selectedCollectorId,
      });
      if (res.success) {
        showNotification(`Successfully collected ₹${collectorPayAmount} from customer!`);
        setCollectorPayAmount(0);
        setCollectorPayCustId(0);
      } else {
        showNotification(res.error || 'Failed to record collection', 'error');
      }
    });
  };

  // Technician Resolve Complaint Submit
  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;
    startTransition(async () => {
      const res = await updateComplaint(selectedComplaintId, {
        status: 'Closed',
        comments: techComments || 'Resolved by field technician.',
        assignedTechnicianId: selectedTechnicianId,
      });
      if (res.success) {
        showNotification('Complaint resolved and closed successfully!');
        setSelectedComplaintId(null);
        setTechComments('');
      } else {
        showNotification(res.error || 'Failed to resolve complaint', 'error');
      }
    });
  };

  // Helper variables to compute values
  const totalBilled = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCollected = collections.reduce((acc, c) => acc + c.amount, 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + c.balance, 0);
  const openComplaintsCount = complaints.filter(c => c.status === 'Open').length;
  const closedComplaintsCount = complaints.filter(c => c.status === 'Closed').length;

  const activeCustomersCount = customers.filter(c => c.status === 'Active').length;
  const inactiveCustomersCount = customers.filter(c => c.status === 'Inactive').length;
  const freeCustomersCount = customers.filter(c => c.status === 'Free').length;

  const cableActive = customers.filter(c => c.status === 'Active' && (c.connectionType === 'Cable' || c.connectionType === 'Both')).length;
  const cableInactive = customers.filter(c => c.status === 'Inactive' && (c.connectionType === 'Cable' || c.connectionType === 'Both')).length;
  const internetActive = customers.filter(c => c.status === 'Active' && (c.connectionType === 'Internet' || c.connectionType === 'Both')).length;
  const internetInactive = customers.filter(c => c.status === 'Inactive' && (c.connectionType === 'Internet' || c.connectionType === 'Both')).length;

  // SVS metrics for Box Inventory
  const stbSDNew = stb.filter(s => s.type === 'SD' && s.status === 'New').length;
  const stbSDUsed = stb.filter(s => s.type === 'SD' && s.status === 'Used').length;
  const stbSDFaulty = stb.filter(s => s.type === 'SD' && s.status === 'Faulty').length;

  const stbHDNew = stb.filter(s => s.type === 'HD' && s.status === 'New').length;
  const stbHDUsed = stb.filter(s => s.type === 'HD' && s.status === 'Used').length;
  const stbHDFaulty = stb.filter(s => s.type === 'HD' && s.status === 'Faulty').length;

  // Expenses breakdown
  const expCableTotal = initialExpenses.filter(e => e.category === 'Cable').reduce((acc, e) => acc + e.amount, 0);
  const expInternetTotal = initialExpenses.filter(e => e.category === 'Internet').reduce((acc, e) => acc + e.amount, 0);
  const expOtherTotal = initialExpenses.filter(e => e.category === 'Other').reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = expCableTotal + expInternetTotal + expOtherTotal;

  // Active customer object for customer portal
  const activeCustomerObj = customers.find(c => c.id === Number(selectedCustomerId));
  // Active collector object for collector portal
  const activeCollectorObj = collectors.find(c => c.id === Number(selectedCollectorId));
  // Active technician object for technician portal
  const activeTechnicianObj = technicians.find(c => c.id === Number(selectedTechnicianId));

  // Filtered lists for Admin search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* PERSISTENT FLOATING HEADER WITH PERSONA SWITCHER */}
      <div className="bg-slate-900 text-white border-b-4 border-[#881b4c] sticky top-0 z-50 shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#881b4c] text-white p-2 rounded-lg font-black text-xl tracking-tight shadow-md flex items-center gap-1.5">
              <Tv className="w-6 h-6 stroke-[2.5]" />
              <span>SV2</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">PRAPTI MEDIA SERVICES</h1>
              <p className="text-xs text-slate-400 mt-1">Multi-Portal Broadband & Cable ERP</p>
            </div>
          </div>

          {/* SIMULATED ROLE SELECTOR */}
          <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block md:inline">
              Select Portal Demo:
            </span>
            <button
              onClick={() => { setActivePortal('admin'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePortal === 'admin'
                  ? 'bg-[#881b4c] text-white shadow'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              🛡️ Admin
            </button>
            <button
              onClick={() => { setActivePortal('customer'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePortal === 'customer'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              👤 Customer
            </button>
            <button
              onClick={() => { setActivePortal('collector'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePortal === 'collector'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              🤝 Collector
            </button>
            <button
              onClick={() => { setActivePortal('technician'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePortal === 'technician'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              🛠️ Technician
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReseed}
              disabled={isPending}
              className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1 border border-slate-700"
              title="Reset Database to original seeding values"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset & Seed</span>
            </button>
            
            {/* Quick status indicator */}
            <div className="hidden lg:flex flex-col items-end text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
              <span className="text-slate-400 text-[10px]">Postgres Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP NOTIFICATION BAR */}
      {notification && (
        <div className={`p-4 text-center text-sm font-bold shadow-lg transition-all z-40 flex items-center justify-center gap-2 ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* REFRESHING/LOADING INDICATOR */}
      {isPending && (
        <div className="bg-amber-500 text-white py-1 px-4 text-center text-xs font-medium animate-pulse flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5 animate-spin" /> Synchronizing data securely with PostgreSQL...
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col">

        {/* ======================================= */}
        {/*           1. ADMIN PORTAL               */}
        {/* ======================================= */}
        {activePortal === 'admin' && (
          <div className="flex-1 flex flex-col md:flex-row">
            {/* LEFT SIDEBAR - SVS STYLE */}
            <div className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
              
              {/* OPERATOR CARD */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#881b4c] text-white flex items-center justify-center font-bold text-lg border-2 border-slate-600 shadow-sm">
                  PS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">Pradip Sah</h4>
                  <p className="text-xs text-[#d15d8d] font-semibold mt-0.5">Admin & Operator</p>
                </div>
              </div>

              {/* SIDEBAR NAVIGATION ITEMS (MATCHING IMAGE 2 EXCEL TABS) */}
              <nav className="p-3 flex-1 flex flex-col gap-1">
                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'dashboard' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <BarChart className="w-4 h-4" />
                  Dashboard Snapshot
                </button>

                <button
                  onClick={() => setAdminTab('customer_master')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'customer_master' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Customer Master
                </button>

                <button
                  onClick={() => setAdminTab('collector_master')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'collector_master' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Collector Master
                </button>

                <button
                  onClick={() => setAdminTab('due_list')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'due_list' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Pending Due List
                </button>

                <button
                  onClick={() => setAdminTab('complaints')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'complaints' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  Complaints Desk
                  {openComplaintsCount > 0 && (
                    <span className="ml-auto bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                      {openComplaintsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('expenses')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'expenses' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Expense Manager
                </button>

                <button
                  onClick={() => setAdminTab('inventory')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'inventory' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  STB Inventory
                </button>

                <button
                  onClick={() => setAdminTab('config')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    adminTab === 'config' ? 'bg-[#881b4c] text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  System Configuration
                </button>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400 font-bold mb-2">RUN MONTHLY BILLING</p>
                    <button
                      onClick={handleBatchBilling}
                      className="w-full text-center bg-[#881b4c] hover:bg-[#72153f] text-white py-1.5 px-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all"
                    >
                      💳 Run Batch Bill
                    </button>
                    <p className="text-[9px] text-slate-500 mt-1">Generates recurring invoice</p>
                  </div>
                </div>
              </nav>

              <div className="p-3 border-t border-slate-800 text-center text-[10px] text-slate-500">
                Prapti ERP v2.46 (Secure)
              </div>
            </div>

            {/* MAIN PORTAL BODY */}
            <div className="flex-1 p-4 overflow-y-auto max-w-7xl mx-auto w-full">
              
              {/* ADMIN SUB-VIEW: 1. DASHBOARD OVERVIEW */}
              {adminTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* EXCEL BANNER (AS IN SECOND SCREENSHOT) */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-950 text-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-wider text-amber-400 uppercase">Live Business Snapshot</h3>
                      <h2 className="text-xl font-extrabold tracking-tight">PRAPTI MEDIA SERVICES — EXCELLENCE IN ERP</h2>
                      <p className="text-xs text-slate-300 mt-1">
                        Use the sidebar to jump to any module — real-time billing and payment collection logs.
                      </p>
                    </div>
                    <div className="text-left sm:text-right text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 font-semibold block">Last Refreshed:</span>
                      <span className="text-white font-extrabold">{new Date().toDateString()}</span>
                    </div>
                  </div>

                  {/* EXCEL-STYLE METRICS BOARD (IMAGE 2) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="bg-blue-800 text-white rounded-lg p-4 shadow">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-90">Total Customers</p>
                      <h4 className="text-3xl font-black mt-1">{customers.length}</h4>
                      <p className="text-[10px] mt-1 opacity-75">All registered users</p>
                    </div>
                    <div className="bg-emerald-800 text-white rounded-lg p-4 shadow">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-90">Active Customers</p>
                      <h4 className="text-3xl font-black mt-1">{activeCustomersCount}</h4>
                      <p className="text-[10px] mt-1 opacity-75">Receiving active feeds</p>
                    </div>
                    <div className="bg-[#6b21a8] text-white rounded-lg p-4 shadow">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-90">Total Billed</p>
                      <h4 className="text-3xl font-black mt-1">₹{totalBilled}</h4>
                      <p className="text-[10px] mt-1 opacity-75">All-time generated invoices</p>
                    </div>
                    <div className="bg-teal-800 text-white rounded-lg p-4 shadow">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-90">Total Collected</p>
                      <h4 className="text-3xl font-black mt-1">₹{totalCollected}</h4>
                      <p className="text-[10px] mt-1 opacity-75">Actual payment received</p>
                    </div>
                    <div className="bg-rose-800 text-white rounded-lg p-4 shadow">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-90">Total Outstanding</p>
                      <h4 className="text-3xl font-black mt-1">₹{totalOutstanding}</h4>
                      <p className="text-[10px] mt-1 opacity-75">Unpaid ledger balances</p>
                    </div>
                    <div className="bg-amber-600 text-white rounded-lg p-4 shadow">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-90">Open Complaints</p>
                      <h4 className="text-3xl font-black mt-1">{openComplaintsCount}</h4>
                      <p className="text-[10px] mt-1 opacity-75">Pending action in field</p>
                    </div>
                  </div>

                  {/* LOWER DETAIL COUNTERS (EXCEL METRIC SUB-DETAILS) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                    <div className="text-center py-2">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">Service Areas</p>
                      <h5 className="text-2xl font-bold mt-1 text-amber-400">{areas.length}</h5>
                    </div>
                    <div className="text-center py-2 border-l border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">Collectors</p>
                      <h5 className="text-2xl font-bold mt-1 text-emerald-400">{collectors.length}</h5>
                    </div>
                    <div className="text-center py-2 border-l border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">Technicians</p>
                      <h5 className="text-2xl font-bold mt-1 text-blue-400">{technicians.length}</h5>
                    </div>
                    <div className="text-center py-2 border-l border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">Service Plans</p>
                      <h5 className="text-2xl font-bold mt-1 text-[#d15d8d]">{servicePlans.length}</h5>
                    </div>
                  </div>

                  {/* SVS SYSTEM VIEW CARDS (IMAGE 1) */}
                  <div className="border-t pt-4 border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">SVS Operator Metrics (SVS.IN)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      {/* CARD 1: CUSTOMERS BREAKDOWN */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-3 bg-rose-50 text-[#881b4c] font-bold text-xs flex items-center justify-between border-b">
                          <span className="flex items-center gap-1.5 uppercase"><Users className="w-4 h-4" /> Customers</span>
                          <span className="bg-[#881b4c] text-white px-1.5 py-0.5 rounded text-[10px]">TOTAL: {customers.length}</span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Active</span>
                            <span className="text-base font-bold text-emerald-600 block">{activeCustomersCount}</span>
                          </div>
                          <div className="border-l">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Inactive</span>
                            <span className="text-base font-bold text-rose-600 block">{inactiveCustomersCount}</span>
                          </div>
                          <div className="border-l">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Free</span>
                            <span className="text-base font-bold text-blue-500 block">{freeCustomersCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: CABLE CONNECTIONS */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-3 bg-blue-50 text-blue-800 font-bold text-xs flex items-center justify-between border-b">
                          <span className="flex items-center gap-1.5 uppercase"><Tv className="w-4 h-4" /> Cable Connections</span>
                          <span className="bg-blue-800 text-white px-1.5 py-0.5 rounded text-[10px]">Active: {cableActive}</span>
                        </div>
                        <div className="p-3 grid grid-cols-4 gap-1 text-center">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block">Analog</span>
                            <span className="text-sm font-extrabold block text-slate-600">0</span>
                          </div>
                          <div className="border-l">
                            <span className="text-[9px] text-slate-400 font-bold block">HD</span>
                            <span className="text-sm font-extrabold block text-indigo-600">
                              {customers.filter(c => c.cablePlanId === servicePlans.find(p => p.name.includes('HD'))?.id).length}
                            </span>
                          </div>
                          <div className="border-l">
                            <span className="text-[9px] text-slate-400 font-bold block">SD</span>
                            <span className="text-sm font-extrabold block text-amber-600">
                              {customers.filter(c => c.cablePlanId === servicePlans.find(p => p.name.includes('SD'))?.id).length}
                            </span>
                          </div>
                          <div className="border-l">
                            <span className="text-[9px] text-slate-400 font-bold block">Free</span>
                            <span className="text-sm font-extrabold block text-emerald-600">0</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD 3: INTERNET MODULE */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-3 bg-amber-50 text-amber-800 font-bold text-xs flex items-center justify-between border-b">
                          <span className="flex items-center gap-1.5 uppercase"><Wifi className="w-4 h-4" /> Internet Status</span>
                          <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded text-[10px]">Active: {internetActive}</span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Active</span>
                            <span className="text-base font-bold text-emerald-600 block">{internetActive}</span>
                          </div>
                          <div className="border-l">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Inactive</span>
                            <span className="text-base font-bold text-rose-600 block">{internetInactive}</span>
                          </div>
                          <div className="border-l">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Free</span>
                            <span className="text-base font-bold text-blue-500 block">0</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD 4: STB INVENTORY METRICS */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-3 bg-purple-50 text-purple-800 font-bold text-xs flex items-center justify-between border-b">
                          <span className="flex items-center gap-1.5 uppercase"><Package className="w-4 h-4" /> STB Box Inventory</span>
                          <span className="bg-purple-800 text-white px-1.5 py-0.5 rounded text-[10px]">Total STBs: {stb.length}</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-2 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">SD Boxes</span>
                            <span className="text-xs text-slate-600 block">
                              New: <strong className="text-emerald-600">{stbSDNew}</strong> | Used: <strong className="text-blue-600">{stbSDUsed}</strong> | F: <strong className="text-rose-600">{stbSDFaulty}</strong>
                            </span>
                          </div>
                          <div className="border-l">
                            <span className="text-[10px] text-slate-400 font-semibold block">HD Boxes</span>
                            <span className="text-xs text-slate-600 block">
                              New: <strong className="text-emerald-600">{stbHDNew}</strong> | Used: <strong className="text-blue-600">{stbHDUsed}</strong> | F: <strong className="text-rose-600">{stbHDFaulty}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* EXPENSES BREAKDOWN & PAYMENTS REAL TIME LOG */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT PANEL: TODAY'S PAYMENT COLLECTION TABLE */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                          <Coins className="text-[#881b4c] w-5 h-5" />
                          Payment Collections Transit & Settlement (Today)
                        </h4>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">
                          Pending Settlement
                        </span>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="p-2.5 font-bold text-slate-600">Collector User</th>
                              <th className="p-2.5 font-bold text-slate-600 text-center">Assigned Customers</th>
                              <th className="p-2.5 font-bold text-slate-600 text-right font-mono">Amount Collected</th>
                              <th className="p-2.5 font-bold text-slate-600 text-center">Transit Settlement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {collectors.map(col => {
                              const assignedCount = customers.filter(c => c.collectorId === col.id).length;
                              return (
                                <tr key={col.id} className="border-b hover:bg-slate-50">
                                  <td className="p-2.5 font-bold text-slate-800">{col.name}</td>
                                  <td className="p-2.5 text-center text-slate-500 font-semibold">{assignedCount}</td>
                                  <td className="p-2.5 text-right font-bold text-emerald-600 font-mono">
                                    ₹{col.balance}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    {col.balance > 0 ? (
                                      <button
                                        onClick={() => handleSettleCollector(col.id, col.name)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-all"
                                      >
                                        Settle Cash (₹{col.balance})
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">All Settled</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT PANEL: SVS OPERATIONAL EXPENSES */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                      <h4 className="text-sm font-extrabold text-slate-700 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>Operational Expenses</span>
                        <span className="text-rose-600 font-bold font-mono">₹{totalExpenses}</span>
                      </h4>

                      <div className="mt-4 space-y-3.5">
                        <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span className="text-xs font-bold text-slate-700">Cable Distribution</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 font-mono">₹{expCableTotal}</span>
                        </div>

                        <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-slate-700">Broadband Internet</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 font-mono">₹{expInternetTotal}</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                            <span className="text-xs font-bold text-slate-700">Other Overhead/Licences</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 font-mono">₹{expOtherTotal}</span>
                        </div>

                        <button
                          onClick={() => setAdminTab('expenses')}
                          className="w-full text-center border border-dashed border-[#881b4c] text-[#881b4c] hover:bg-[#881b4c] hover:text-white transition-all text-xs font-bold py-2 rounded-lg"
                        >
                          + Log Operational Expense
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ADMIN SUB-VIEW: 2. CUSTOMER MASTER */}
              {adminTab === 'customer_master' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-[#881b4c]" />
                        Customer Master Directory
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Manage broadband and cable television subscribers</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add Subscriber
                      </button>
                    </div>
                  </div>

                  {/* SEARCH FILTERS */}
                  <div className="mt-4 flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200 max-w-md">
                    <Search className="text-slate-400 w-4 h-4 mr-2" />
                    <input
                      type="text"
                      placeholder="Search by Name, Code (e.g. PMS001), or Phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent text-xs text-slate-800 outline-none w-full"
                    />
                  </div>

                  {/* CUSTOMER DIRECTORY TABLE */}
                  <div className="mt-4 overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-600">Code</th>
                          <th className="p-3 font-bold text-slate-600">Subscriber Name</th>
                          <th className="p-3 font-bold text-slate-600">Contact Details</th>
                          <th className="p-3 font-bold text-slate-600">Zone Area</th>
                          <th className="p-3 font-bold text-slate-600">Connection</th>
                          <th className="p-3 font-bold text-slate-600">Active Packages</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Ledger Balance</th>
                          <th className="p-3 font-bold text-slate-600 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map(cust => {
                          const area = areas.find(a => a.id === cust.areaId);
                          const collector = collectors.find(col => col.id === cust.collectorId);
                          const cablePlan = servicePlans.find(p => p.id === cust.cablePlanId);
                          const netPlan = servicePlans.find(p => p.id === cust.internetPlanId);

                          return (
                            <tr key={cust.id} className="border-b hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-[#881b4c]">{cust.customerCode}</td>
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900">{cust.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1" title={cust.address}>
                                  📍 {cust.address}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-slate-800">{cust.phone}</div>
                                <div className="text-[10px] text-slate-500">{cust.email || 'No email registered'}</div>
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[10px]">
                                  {area ? area.name : 'Unassigned'}
                                </span>
                                <div className="text-[9px] text-slate-400 mt-1">Collector: {collector?.name}</div>
                              </td>
                              <td className="p-3 font-bold text-slate-700 text-center">
                                {cust.connectionType === 'Both' ? (
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-max">
                                    <Tv className="w-3 h-3" />+<Wifi className="w-3 h-3" /> Both
                                  </span>
                                ) : cust.connectionType === 'Cable' ? (
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-max">
                                    <Tv className="w-3 h-3" /> Cable
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-max">
                                    <Wifi className="w-3 h-3" /> Internet
                                  </span>
                                )}
                              </td>
                              <td className="p-3 max-w-[200px]">
                                {cablePlan && (
                                  <div className="text-[10px] text-blue-700 truncate font-semibold">
                                    📺 {cablePlan.name} (₹{cablePlan.monthlyCharge + cablePlan.tax})
                                  </div>
                                )}
                                {netPlan && (
                                  <div className="text-[10px] text-amber-700 truncate font-semibold mt-0.5">
                                    🌐 {netPlan.name} (₹{netPlan.monthlyCharge + netPlan.tax})
                                  </div>
                                )}
                              </td>
                              <td className={`p-3 text-right font-mono font-black text-sm ${cust.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                ₹{cust.balance}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  cust.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {cust.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredCustomers.length === 0 && (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 font-medium text-xs">
                              No subscribers found matching "{searchTerm}"
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ADD CUSTOMER MODAL */}
                  {showAddCustomer && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Register New PMS Subscriber</h3>
                          <button onClick={() => setShowAddCustomer(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>

                        <form onSubmit={handleCreateCustomerSubmit} className="p-5 space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer Code (PMS###) *</label>
                              <input
                                type="text"
                                placeholder="PMS007"
                                value={newCustCode}
                                onChange={(e) => setNewCustCode(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs font-mono focus:border-[#881b4c]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Subscriber Full Name *</label>
                              <input
                                type="text"
                                placeholder="Debolina Dey"
                                value={newCustName}
                                onChange={(e) => setNewCustName(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
                              <input
                                type="text"
                                placeholder="9830554433"
                                value={newCustPhone}
                                onChange={(e) => setNewCustPhone(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Email Address (Optional)</label>
                              <input
                                type="email"
                                placeholder="debolina@gmail.com"
                                value={newCustEmail}
                                onChange={(e) => setNewCustEmail(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Installation Address *</label>
                            <textarea
                              placeholder="House 44/C, Garia, South Zone, Kolkata"
                              value={newCustAddress}
                              onChange={(e) => setNewCustAddress(e.target.value)}
                              rows={2}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Service Area *</label>
                              <select
                                value={newCustArea}
                                onChange={(e) => setNewCustArea(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                              >
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Collector *</label>
                              <select
                                value={newCustCollector}
                                onChange={(e) => setNewCustCollector(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                              >
                                {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="border-t pt-3 border-slate-100">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Connection & Plan Mapping</label>
                            
                            <div className="flex gap-4 p-2 bg-slate-50 rounded border mb-3">
                              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="connType"
                                  checked={newCustConnType === 'Cable'}
                                  onChange={() => setNewCustConnType('Cable')}
                                />
                                Cable TV only
                              </label>
                              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="connType"
                                  checked={newCustConnType === 'Internet'}
                                  onChange={() => setNewCustConnType('Internet')}
                                />
                                Internet Broadband only
                              </label>
                              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="connType"
                                  checked={newCustConnType === 'Both'}
                                  onChange={() => setNewCustConnType('Both')}
                                />
                                Both (Bundle)
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {(newCustConnType === 'Cable' || newCustConnType === 'Both') && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Cable TV Plan</label>
                                  <select
                                    value={newCustCablePlan}
                                    onChange={(e) => setNewCustCablePlan(Number(e.target.value))}
                                    className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                                  >
                                    <option value={0}>-- Choose Plan --</option>
                                    {servicePlans.filter(p => p.type === 'Cable').map(p => (
                                      <option key={p.id} value={p.id}>{p.name} (₹{p.monthlyCharge + p.tax}/mo)</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {(newCustConnType === 'Internet' || newCustConnType === 'Both') && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Broadband Plan</label>
                                  <select
                                    value={newCustNetPlan}
                                    onChange={(e) => setNewCustNetPlan(Number(e.target.value))}
                                    className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                                  >
                                    <option value={0}>-- Choose Plan --</option>
                                    {servicePlans.filter(p => p.type === 'Internet').map(p => (
                                      <option key={p.id} value={p.id}>{p.name} (₹{p.monthlyCharge + p.tax}/mo)</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-amber-50 text-amber-800 p-2.5 rounded text-[11px] leading-relaxed border border-amber-200">
                            💡 Saving this subscriber will auto-generate an initial billing ledger and outstanding debit representing the package selected.
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddCustomer(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Register Subscriber
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN SUB-VIEW: 3. COLLECTOR MASTER */}
              {adminTab === 'collector_master' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Coins className="text-[#881b4c]" />
                        Collector Master (Cash Handling Operators)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Authorised billing personnel for cash/door-to-door collections</p>
                    </div>
                    <button
                      onClick={() => setShowAddCollector(true)}
                      className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Collector
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {collectors.map(col => {
                      const linkedArea = areas.find(a => a.id === col.areaId);
                      const assignedCustomers = customers.filter(c => c.collectorId === col.id);
                      const unpaidCustomers = assignedCustomers.filter(c => c.balance > 0);
                      const totalOutstandingCol = assignedCustomers.reduce((acc, c) => acc + c.balance, 0);

                      return (
                        <div key={col.id} className="border rounded-xl p-4 shadow-sm hover:shadow transition-all bg-slate-50/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-950">{col.name}</h3>
                              <p className="text-xs text-slate-500 font-medium">📞 {col.phone}</p>
                              {col.email && <p className="text-[10px] text-slate-400 mt-0.5">✉️ {col.email}</p>}
                            </div>
                            <span className="bg-slate-200 text-slate-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                              ID: {col.id}
                            </span>
                          </div>

                          <div className="mt-3.5 space-y-1.5 border-t pt-3 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>Linked Zone:</span>
                              <strong className="text-slate-800">{linkedArea ? linkedArea.name : 'All Zones'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Assigned Accounts:</span>
                              <strong className="text-slate-800">{assignedCustomers.length}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Active Unpaid Accounts:</span>
                              <strong className="text-rose-600 font-bold">{unpaidCustomers.length}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Book Debt:</span>
                              <strong className="text-slate-800">₹{totalOutstandingCol}</strong>
                            </div>
                          </div>

                          <div className="mt-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Transit Cash</span>
                              <span className="text-lg font-black text-emerald-800 font-mono">₹{col.balance}</span>
                            </div>
                            {col.balance > 0 ? (
                              <button
                                onClick={() => handleSettleCollector(col.id, col.name)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded transition-all shadow-sm"
                              >
                                Settle SVS Cash
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs italic font-semibold">Fully Settled</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ADD COLLECTOR MODAL */}
                  {showAddCollector && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Register New SVS Cash Collector</h3>
                          <button onClick={() => setShowAddCollector(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateCollectorSubmit} className="p-5 space-y-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Collector Full Name *</label>
                            <input
                              type="text"
                              placeholder="Subrata Das"
                              value={newCollectorName}
                              onChange={(e) => setNewCollectorName(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Mobile Number *</label>
                              <input
                                type="text"
                                placeholder="9830112233"
                                value={newCollectorPhone}
                                onChange={(e) => setNewCollectorPhone(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Email ID</label>
                              <input
                                type="email"
                                placeholder="subrata@getsvs.in"
                                value={newCollectorEmail}
                                onChange={(e) => setNewCollectorEmail(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Service Zone Area</label>
                            <select
                              value={newCollectorArea}
                              onChange={(e) => setNewCollectorArea(Number(e.target.value))}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                            >
                              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddCollector(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Add Collector
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN SUB-VIEW: 4. DUE LIST */}
              {adminTab === 'due_list' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="text-[#881b4c]" />
                      Ledger Outstanding Due List
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Subscribers with active outstanding debt balances, grouped by their assigned zone collectors.
                    </p>
                  </div>

                  <div className="mt-5 overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-600">Subscriber Code</th>
                          <th className="p-3 font-bold text-slate-600">Name / Address</th>
                          <th className="p-3 font-bold text-slate-600">Assigned Collector</th>
                          <th className="p-3 font-bold text-slate-600">Zone Code</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Outstanding Debit</th>
                          <th className="p-3 font-bold text-slate-600 text-center">Action Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.filter(c => c.balance > 0).map(cust => {
                          const area = areas.find(a => a.id === cust.areaId);
                          const collector = collectors.find(col => col.id === cust.collectorId);

                          return (
                            <tr key={cust.id} className="border-b hover:bg-rose-50/20">
                              <td className="p-3 font-mono font-bold text-[#881b4c]">{cust.customerCode}</td>
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900">{cust.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">📍 {cust.address}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{collector ? collector.name : 'Direct Pay'}</div>
                                <div className="text-[10px] text-slate-400">📞 {collector?.phone}</div>
                              </td>
                              <td className="p-3 font-bold text-indigo-700">
                                {area ? area.code : 'PMS-DIRECT'}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-sm text-rose-600 bg-rose-50/40">
                                ₹{cust.balance}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    // Switch context to Collector portal of this customer's collector to record payment
                                    if (cust.collectorId) {
                                      setSelectedCollectorId(cust.collectorId);
                                      setCollectorPayCustId(cust.id);
                                      setCollectorPayAmount(cust.balance);
                                      setActivePortal('collector');
                                      showNotification(`Switched to Collector ${collector?.name} portal with outstanding balance loaded!`);
                                    } else {
                                      showNotification('No collector assigned. Switch to Customer portal to pay directly.');
                                    }
                                  }}
                                  className="text-white bg-[#881b4c] hover:bg-[#6c143d] font-bold px-2 py-1 rounded text-[10px] transition-all"
                                  title="Open Collector terminal to settle cash"
                                >
                                  Collect Cash →
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {customers.filter(c => c.balance > 0).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-emerald-600 font-bold text-xs bg-emerald-50/20">
                              🎉 Wonderful! Zero pending outstandings on the network ledger!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN SUB-VIEW: 5. COMPLAINTS DESK */}
              {adminTab === 'complaints' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Inbox className="text-[#881b4c]" />
                        Complaints Dispatch & Technician Allocation
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Track, delegate, and resolve technical service requests</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {complaints.map(comp => {
                      const cust = customers.find(c => c.id === comp.customerId);
                      const tech = technicians.find(t => t.id === comp.assignedTechnicianId);

                      return (
                        <div
                          key={comp.id}
                          className={`border rounded-xl p-4 shadow-sm transition-all ${
                            comp.status === 'Open' ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200 bg-slate-50/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                comp.type === 'Internet' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {comp.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                comp.priority === 'High'
                                  ? 'bg-rose-100 text-rose-800'
                                  : comp.priority === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {comp.priority} PRIORITY
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-400">Date Logged:</span>
                              <strong className="text-slate-700">{new Date(comp.createdDate).toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Subscriber Detail</p>
                              <p className="font-extrabold text-slate-950 mt-1">{cust ? cust.name : 'Unknown Customer'}</p>
                              <p className="text-slate-500 font-medium">📞 {cust?.phone} | Code: {cust?.customerCode}</p>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">📍 {cust?.address}</p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Reported Breakdown</p>
                              <p className="text-slate-700 mt-1 bg-white p-2 rounded border leading-relaxed font-semibold">
                                "{comp.description}"
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Technician Allocation</p>
                              {comp.status === 'Open' ? (
                                <div className="mt-1 space-y-2">
                                  <select
                                    onChange={(e) => {
                                      const techId = Number(e.target.value);
                                      if (techId > 0) {
                                        startTransition(async () => {
                                          await updateComplaint(comp.id, {
                                            status: 'Open',
                                            assignedTechnicianId: techId,
                                          });
                                          showNotification(`Assigned complaint to technician!`);
                                        });
                                      }
                                    }}
                                    className="p-1.5 border rounded bg-slate-50 text-xs w-full outline-none"
                                    value={comp.assignedTechnicianId || 0}
                                  >
                                    <option value={0}>-- Click to Delegate --</option>
                                    {technicians.filter(t => comp.type === 'Both' || t.specialization === 'Both' || t.specialization === comp.type).map(t => (
                                      <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                                    ))}
                                  </select>
                                  
                                  <button
                                    onClick={() => {
                                      if (comp.assignedTechnicianId) {
                                        setSelectedTechnicianId(comp.assignedTechnicianId);
                                        setSelectedComplaintId(comp.id);
                                        setActivePortal('technician');
                                        showNotification('Switched context to assigned technician workspace!');
                                      } else {
                                        showNotification('Please delegate to a technician first!', 'error');
                                      }
                                    }}
                                    className="w-full text-center py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] uppercase transition-all"
                                  >
                                    Resolve as Tech →
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded">
                                  <p className="text-emerald-800 font-bold">✅ CLOSED / RESOLVED</p>
                                  <p className="text-[10px] text-slate-600 mt-1 italic font-medium">
                                    "{comp.comments || 'No comment logged'}"
                                  </p>
                                  <p className="text-[9px] text-slate-400 mt-1">
                                    Closed on: {comp.closedDate ? new Date(comp.closedDate).toLocaleDateString() : 'N/A'} by {tech?.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ADMIN SUB-VIEW: 6. EXPENSE MANAGER */}
              {adminTab === 'expenses' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="text-[#881b4c]" />
                        Operational Expense Ledger
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Audit network maintenance, fiber joints, hardware splitters and licensing costs</p>
                    </div>

                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Log Expense
                    </button>
                  </div>

                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-4 gap-4 mt-5">
                    <div className="bg-rose-50 text-rose-900 rounded-lg p-3 text-center border border-rose-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Cable Overhead</span>
                      <strong className="text-lg font-black font-mono">₹{expCableTotal}</strong>
                    </div>
                    <div className="bg-amber-50 text-amber-900 rounded-lg p-3 text-center border border-amber-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Internet Fiber/Splicing</span>
                      <strong className="text-lg font-black font-mono">₹{expInternetTotal}</strong>
                    </div>
                    <div className="bg-slate-100 text-slate-800 rounded-lg p-3 text-center border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">License/Other Fees</span>
                      <strong className="text-lg font-black font-mono">₹{expOtherTotal}</strong>
                    </div>
                    <div className="bg-slate-900 text-white rounded-lg p-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">All Expenses</span>
                      <strong className="text-lg font-black font-mono">₹{totalExpenses}</strong>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-600">Date Logged</th>
                          <th className="p-3 font-bold text-slate-600">Category Tag</th>
                          <th className="p-3 font-bold text-slate-600">Expense Description</th>
                          <th className="p-3 font-bold text-slate-600">Administrative Notes</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Debit Cash (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {initialExpenses.map(exp => (
                          <tr key={exp.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 text-slate-500 font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                exp.category === 'Cable'
                                  ? 'bg-blue-100 text-blue-800'
                                  : exp.category === 'Internet'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-800'
                              }`}>
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-slate-900">{exp.title}</td>
                            <td className="p-3 text-slate-500 italic">{exp.notes || 'No notes appended'}</td>
                            <td className="p-3 text-right font-mono font-black text-sm text-red-600">
                              ₹{exp.amount}
                            </td>
                          </tr>
                        ))}

                        {initialExpenses.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-medium text-xs">
                              No expense records logged in the system ledger.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ADD EXPENSE MODAL */}
                  {showAddExpense && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Log Operational Expenditure</h3>
                          <button onClick={() => setShowAddExpense(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateExpenseSubmit} className="p-5 space-y-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Expense Title / Vendor *</label>
                            <input
                              type="text"
                              placeholder="Fiber Joint Splicing Sleeves (Pack of 50)"
                              value={newExpTitle}
                              onChange={(e) => setNewExpTitle(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Cost (₹) *</label>
                              <input
                                type="number"
                                placeholder="1800"
                                value={newExpAmount}
                                onChange={(e) => setNewExpAmount(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Operational Category</label>
                              <select
                                value={newExpCat}
                                onChange={(e) => setNewExpCat(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                              >
                                <option value="Cable">Cable Television</option>
                                <option value="Internet">Broadband Internet</option>
                                <option value="Other">Overheads & Other Fees</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Administrative Notes</label>
                            <textarea
                              placeholder="Joint repaired on Salt Lake central Ring-2 feed after truck damage."
                              value={newExpNotes}
                              onChange={(e) => setNewExpNotes(e.target.value)}
                              rows={2.5}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddExpense(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Save Ledger Entry
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN SUB-VIEW: 7. STB INVENTORY */}
              {adminTab === 'inventory' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Package className="text-[#881b4c]" />
                        Set-Top Box (STB) Physical Inventory
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Control HD/SD receivers, stock counts, faulty units, and subscriber deployments</p>
                    </div>

                    <button
                      onClick={() => setShowAddSTB(true)}
                      className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Box Serial
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-200 text-center">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Ready / New Boxes</span>
                      <strong className="text-2xl font-black block mt-1">{stb.filter(s => s.status === 'New').length} Units</strong>
                    </div>
                    <div className="bg-blue-50 text-blue-900 p-3 rounded-lg border border-blue-200 text-center">
                      <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">Active Deployments</span>
                      <strong className="text-2xl font-black block mt-1">{stb.filter(s => s.status === 'Used').length} Units</strong>
                    </div>
                    <div className="bg-red-50 text-red-900 p-3 rounded-lg border border-red-200 text-center">
                      <span className="text-[10px] font-extrabold uppercase text-red-800 tracking-wider">Faulty / Under Repair</span>
                      <strong className="text-2xl font-black block mt-1 text-red-700">{stb.filter(s => s.status === 'Faulty').length} Units</strong>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-600">STB Serial Number</th>
                          <th className="p-3 font-bold text-slate-600">Model Type</th>
                          <th className="p-3 font-bold text-slate-600">Assigned Subscriber</th>
                          <th className="p-3 font-bold text-slate-600">Last Checked Date</th>
                          <th className="p-3 font-bold text-slate-600">Status</th>
                          <th className="p-3 font-bold text-slate-600 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stb.map(box => (
                          <tr key={box.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-900">{box.stbNumber}</td>
                            <td className="p-3 font-extrabold text-slate-700">{box.type === 'HD' ? '📺 Full High Definition (HD)' : '📺 Standard Definition (SD)'}</td>
                            <td className="p-3 font-semibold text-slate-800">
                              {box.assignedCustomerName ? (
                                <span className="text-blue-700 flex items-center gap-1">
                                  👤 {box.assignedCustomerName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned (In Depot)</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500">{new Date(box.updatedDate).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                box.status === 'New'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : box.status === 'Used'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {box.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <select
                                value={box.status}
                                onChange={(e) => {
                                  const nextStatus = e.target.value;
                                  startTransition(async () => {
                                    await updateSTBStatus(box.id, nextStatus, box.assignedCustomerName || undefined);
                                    showNotification(`STB ${box.stbNumber} status changed to ${nextStatus}!`);
                                  });
                                }}
                                className="p-1 border rounded bg-slate-50 text-xs text-slate-800"
                              >
                                <option value="New">New</option>
                                <option value="Used">Used</option>
                                <option value="Faulty">Faulty</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ADD STB MODAL */}
                  {showAddSTB && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Inward New STB Hardware</h3>
                          <button onClick={() => setShowAddSTB(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateSTBSubmit} className="p-5 space-y-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">STB Serial Number *</label>
                            <input
                              type="text"
                              placeholder="STB-HD-5050"
                              value={newSTBNo}
                              onChange={(e) => setNewSTBNo(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs font-mono focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Model Specification</label>
                              <select
                                value={newSTBType}
                                onChange={(e) => setNewSTBType(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                              >
                                <option value="HD">HD Receiver</option>
                                <option value="SD">SD Receiver</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Initial Status</label>
                              <select
                                value={newSTBStatus}
                                onChange={(e) => setNewSTBStatus(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                              >
                                <option value="New">Ready / New</option>
                                <option value="Used">Already Deployed</option>
                                <option value="Faulty">Faulty Box</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddSTB(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Add To Stock
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN SUB-VIEW: 8. CONFIGURATION / MASTERS */}
              {adminTab === 'config' && (
                <div className="space-y-6">
                  
                  {/* SERVICE PLANS CONFIG */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between pb-3 border-b mb-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">Service Plan Tariffs & Pricing</h3>
                        <p className="text-xs text-slate-500">Configure Cable TV and Broadband packages</p>
                      </div>
                      <button
                        onClick={() => setShowAddPlan(true)}
                        className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3 py-1.5 rounded transition-all"
                      >
                        + Create Package
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {servicePlans.map(plan => (
                        <div key={plan.id} className="border rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              plan.type === 'Cable' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {plan.type} Plan
                            </span>
                            <h4 className="font-bold text-xs text-slate-900 mt-1">{plan.name}</h4>
                            <p className="text-[10px] text-slate-500">{plan.speedOrDetails}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block font-semibold">Monthly Charge:</span>
                            <span className="font-black text-slate-950 text-sm font-mono">₹{plan.monthlyCharge}</span>
                            <span className="text-[10px] text-slate-500 block">+ ₹{plan.tax} Tax</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SERVICE ZONES / AREAS MASTER */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* ZONE MASTER */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center justify-between pb-3 border-b mb-4">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">Distribution Areas (Zones)</h3>
                          <p className="text-xs text-slate-500">Geographical billing areas mapped to collectors</p>
                        </div>
                        <button
                          onClick={() => setShowAddArea(true)}
                          className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3 py-1.5 rounded transition-all"
                        >
                          + Add Zone Area
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {areas.map(a => {
                          const numCust = customers.filter(c => c.areaId === a.id).length;
                          return (
                            <div key={a.id} className="p-2.5 bg-slate-50 rounded border flex items-center justify-between text-xs">
                              <div>
                                <span className="font-mono text-[10px] text-[#881b4c] font-bold uppercase tracking-wider bg-pink-50 px-1 rounded">
                                  {a.code}
                                </span>
                                <strong className="text-slate-800 ml-2">{a.name}</strong>
                              </div>
                              <span className="bg-slate-200 text-slate-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                                {numCust} Accounts
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* TECHNICIANS DIRECTORY */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center justify-between pb-3 border-b mb-4">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">On-field Tech Engineers</h3>
                          <p className="text-xs text-slate-500">Service team assigned for fiber splicing & STB repairs</p>
                        </div>
                        <button
                          onClick={() => setShowAddTechnician(true)}
                          className="bg-[#881b4c] hover:bg-[#72153f] text-white text-xs font-bold px-3 py-1.5 rounded transition-all"
                        >
                          + Add Engineer
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[250px] overflow-y-auto text-xs">
                        {technicians.map(t => {
                          const activeJobs = complaints.filter(c => c.assignedTechnicianId === t.id && c.status === 'Open').length;
                          return (
                            <div key={t.id} className="p-2.5 bg-slate-50 rounded border flex items-center justify-between">
                              <div>
                                <strong className="text-slate-800">{t.name}</strong>
                                <div className="text-[10px] text-slate-500">📞 {t.phone} | Spec: {t.specialization}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                activeJobs > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {activeJobs} Pending Jobs
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* MODALS */}
                  {/* ADD PLAN MODAL */}
                  {showAddPlan && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Configure Service Tariff Package</h3>
                          <button onClick={() => setShowAddPlan(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreatePlanSubmit} className="p-5 space-y-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Plan Name *</label>
                            <input
                              type="text"
                              placeholder="Super Fiber Unlimited 150 Mbps"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Service Type</label>
                              <select
                                value={newPlanType}
                                onChange={(e) => setNewPlanType(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs"
                              >
                                <option value="Cable">Cable TV</option>
                                <option value="Internet">Internet</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Monthly (₹) *</label>
                              <input
                                type="number"
                                placeholder="550"
                                value={newPlanCharge}
                                onChange={(e) => setNewPlanCharge(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Tax (₹) *</label>
                              <input
                                type="number"
                                placeholder="99"
                                value={newPlanTax}
                                onChange={(e) => setNewPlanTax(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Details / Speed Tag</label>
                            <input
                              type="text"
                              placeholder="150 Mbps Symmetrical Optical Link, Free Dual ONT router"
                              value={newPlanSpeed}
                              onChange={(e) => setNewPlanSpeed(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddPlan(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Add Plan
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* ADD AREA MODAL */}
                  {showAddArea && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Configure Distribution Zone</h3>
                          <button onClick={() => setShowAddArea(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateAreaSubmit} className="p-5 space-y-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Zone Area Name *</label>
                            <input
                              type="text"
                              placeholder="Central Garia Lane"
                              value={newAreaName}
                              onChange={(e) => setNewAreaName(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Zone Short Code *</label>
                            <input
                              type="text"
                              placeholder="SZ-GAR-CENTRAL"
                              value={newAreaCode}
                              onChange={(e) => setNewAreaCode(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs font-mono focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddArea(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Add Area
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* ADD TECHNICIAN MODAL */}
                  {showAddTechnician && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-300">
                        <div className="p-4 bg-[#881b4c] text-white font-bold flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wider">Register Service Engineer</h3>
                          <button onClick={() => setShowAddTechnician(false)} className="text-white hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateTechnicianSubmit} className="p-5 space-y-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Engineer Full Name *</label>
                            <input
                              type="text"
                              placeholder="Rohan Bose"
                              value={newTechName}
                              onChange={(e) => setNewTechName(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
                              <input
                                type="text"
                                placeholder="9007123456"
                                value={newTechPhone}
                                onChange={(e) => setNewTechPhone(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Field Specialization</label>
                              <select
                                value={newTechSpec}
                                onChange={(e) => setNewTechSpec(e.target.value)}
                                className="w-full mt-1 p-2 border rounded bg-slate-50 text-xs"
                              >
                                <option value="Cable">Cable Television</option>
                                <option value="Internet">Broadband Fibre</option>
                                <option value="Both">All-round Speciality</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Official Email</label>
                            <input
                              type="email"
                              placeholder="rohan.bose@getsvs.in"
                              value={newTechEmail}
                              onChange={(e) => setNewTechEmail(e.target.value)}
                              className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none text-xs focus:border-[#881b4c]"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAddTechnician(false)}
                              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#881b4c] hover:bg-[#72153f] text-white font-bold rounded shadow-sm"
                            >
                              Register Engineer
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}


        {/* ======================================= */}
        {/*          2. CUSTOMER PORTAL             */}
        {/* ======================================= */}
        {activePortal === 'customer' && (
          <div className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-6">
            
            {/* PERSONA CHANGER IN CUSTOMER VIEW */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-blue-800 font-bold text-xs uppercase tracking-wider block">Simulating Subscriber Terminal</span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-lg font-black text-blue-950">
                    Logged in: <strong className="text-blue-700">{activeCustomerObj?.name}</strong> ({activeCustomerObj?.customerCode})
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">📍 Address: {activeCustomerObj?.address}</p>
              </div>

              <div className="flex items-center gap-1 bg-white p-2 rounded-lg border">
                <span className="text-xs text-slate-500 font-semibold mr-1">Switch Subscriber:</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="p-1 border rounded bg-slate-50 text-xs font-semibold outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* MAIN STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* CURRENT MONTH DEBIT LEDGER */}
              <div className="bg-gradient-to-br from-rose-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm">
                <span className="text-rose-800 font-extrabold text-[10px] uppercase tracking-wider block">Total Outstanding Balance</span>
                <h2 className="text-4xl font-black text-rose-950 mt-1.5 font-mono">
                  ₹{activeCustomerObj?.balance}
                </h2>
                <p className="text-[11px] text-rose-700 mt-2 font-medium">
                  {activeCustomerObj && activeCustomerObj.balance > 0 
                    ? "⚠️ Please clear your bills to avoid internet suspension."
                    : "✅ Your account ledger has zero outstanding debt."}
                </p>
              </div>

              {/* ACTIVE BROADBAND */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block flex items-center gap-1 text-amber-600">
                    <Wifi className="w-3.5 h-3.5" /> Broadband Plan
                  </span>
                  {activeCustomerObj?.internetPlanId ? (
                    (() => {
                      const plan = servicePlans.find(p => p.id === activeCustomerObj.internetPlanId);
                      return (
                        <div className="mt-2">
                          <h4 className="text-base font-black text-slate-900">{plan?.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{plan?.speedOrDetails}</p>
                          <span className="text-xs font-bold text-slate-800 mt-2 block font-mono">₹{plan ? plan.monthlyCharge + plan.tax : 0}/month (Inc. Tax)</span>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-slate-400 italic text-xs mt-3">No active broadband package mapped.</p>
                  )}
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold w-max mt-3 uppercase tracking-wider">
                  {activeCustomerObj?.status}
                </span>
              </div>

              {/* ACTIVE CABLE TV */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block flex items-center gap-1 text-blue-600">
                    <Tv className="w-3.5 h-3.5" /> Cable TV Set-Top Box
                  </span>
                  {activeCustomerObj?.cablePlanId ? (
                    (() => {
                      const plan = servicePlans.find(p => p.id === activeCustomerObj.cablePlanId);
                      const mappedBox = stb.find(s => s.assignedCustomerName === activeCustomerObj.name);
                      return (
                        <div className="mt-2">
                          <h4 className="text-base font-black text-slate-900">{plan?.name}</h4>
                          {mappedBox && <p className="text-[10px] font-mono text-slate-400 mt-1">Serial: {mappedBox.stbNumber} ({mappedBox.type})</p>}
                          <span className="text-xs font-bold text-slate-800 mt-2 block font-mono">₹{plan ? plan.monthlyCharge + plan.tax : 0}/month (Inc. Tax)</span>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-slate-400 italic text-xs mt-3">No active television packages mapped.</p>
                  )}
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold w-max mt-3 uppercase tracking-wider">
                  {activeCustomerObj?.status}
                </span>
              </div>

            </div>

            {/* TWO ROW SUBMISSION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PAY BILL / LEDGER PAYER */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
                  <CreditCard className="text-blue-600" />
                  Settle Outstanding Bill Online (Simulated UPI/NetBanking)
                </h3>

                <form onSubmit={handleCustomerPayment} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Amount to pay (₹)</label>
                    <input
                      type="number"
                      max={activeCustomerObj?.balance || 0}
                      value={customerPayAmount}
                      onChange={(e) => setCustomerPayAmount(Number(e.target.value))}
                      placeholder={activeCustomerObj?.balance ? activeCustomerObj.balance.toString() : '0'}
                      className="w-full mt-1 p-2.5 border rounded bg-slate-50 font-mono font-bold text-sm outline-none focus:border-blue-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Maximum payable: ₹{activeCustomerObj?.balance}</span>
                      <button
                        type="button"
                        onClick={() => setCustomerPayAmount(activeCustomerObj?.balance || 0)}
                        className="text-blue-600 hover:underline"
                      >
                        Pay Full Amount
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Method</label>
                    <select
                      value={customerPayMethod}
                      onChange={(e) => setCustomerPayMethod(e.target.value)}
                      className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none font-semibold text-slate-700"
                    >
                      <option value="UPI">Secure BHIM UPI QR (Simulated)</option>
                      <option value="NetBanking">NetBanking Secure Gateway</option>
                      <option value="Cash">Cash to Collector (Pradip Sah)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={!activeCustomerObj || activeCustomerObj.balance === 0}
                    className={`w-full py-2.5 rounded-lg text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow ${
                      activeCustomerObj && activeCustomerObj.balance > 0
                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    🚀 Trigger Safe Digital Settlement (₹{customerPayAmount})
                  </button>
                </form>
              </div>

              {/* REGISTER COMPLAINT DESK */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
                  <Inbox className="text-amber-600" />
                  Submit Technical Support Ticket
                </h3>

                <form onSubmit={handleCustomerComplaintSubmit} className="mt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Breakdown Domain</label>
                      <select
                        value={customerComplaintType}
                        onChange={(e) => setCustomerComplaintType(e.target.value)}
                        className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none"
                      >
                        <option value="Cable">Cable TV / Set-Top Box issue</option>
                        <option value="Internet">Fibre Internet / WiFi Router issue</option>
                        <option value="Other">Billing / Accounts query</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Urgency Priority</label>
                      <select
                        value={customerComplaintPriority}
                        onChange={(e) => setCustomerComplaintPriority(e.target.value)}
                        className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none"
                      >
                        <option value="Low">Low - Cosmetic issue</option>
                        <option value="Medium">Medium - Disturbed feed</option>
                        <option value="High">High - Link Down / Red Light blinking</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Breakdown Description *</label>
                    <textarea
                      value={customerComplaintDesc}
                      onChange={(e) => setCustomerComplaintDesc(e.target.value)}
                      placeholder="My dual-band router is showing a stable RED alarm light and fiber link is down."
                      rows={2.5}
                      className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none focus:border-amber-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow"
                  >
                    📡 Broadcast To On-field Technicians
                  </button>
                </form>
              </div>

            </div>

            {/* BILL HISTORY */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3">
                Broadband & Cable TV Bill Ledger History
              </h3>

              <div className="mt-4 overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="p-3 font-bold text-slate-600">Bill Date</th>
                      <th className="p-3 font-bold text-slate-600">Due Date</th>
                      <th className="p-3 font-bold text-slate-600">Tariff Charge</th>
                      <th className="p-3 font-bold text-slate-600">Service Tax</th>
                      <th className="p-3 font-bold text-slate-600">Invoiced Amount</th>
                      <th className="p-3 font-bold text-slate-600 text-center">Status</th>
                      <th className="p-3 font-bold text-slate-600 text-center">Paid Amount & Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.filter(b => b.customerId === selectedCustomerId).map(bill => (
                      <tr key={bill.id} className="border-b hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500 font-semibold">{new Date(bill.billDate).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-500 font-semibold">{new Date(bill.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">₹{bill.planCharge}</td>
                        <td className="p-3 font-mono text-slate-500">₹{bill.tax}</td>
                        <td className="p-3 font-mono font-black text-slate-900">₹{bill.totalAmount}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {bill.status === 'Paid' ? (
                            <span className="text-emerald-700 font-bold">
                              ₹{bill.paidAmount} ({bill.paymentMethod})
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold italic">Unpaid (₹{bill.totalAmount - bill.paidAmount} pending)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* ======================================= */}
        {/*          3. COLLECTOR PORTAL            */}
        {/* ======================================= */}
        {activePortal === 'collector' && (
          <div className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-6">
            
            {/* PERSONA SWITCHER */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider block">Authorized Collection Agent Workspace</span>
                <h3 className="text-lg font-black text-emerald-950 mt-1">
                  Active Agent: <strong className="text-emerald-700">{activeCollectorObj?.name}</strong>
                </h3>
                <p className="text-xs text-slate-600 mt-1">📞 Phone: {activeCollectorObj?.phone}</p>
              </div>

              <div className="flex items-center gap-1 bg-white p-2 rounded-lg border">
                <span className="text-xs text-slate-500 font-semibold mr-1">Switch Agent:</span>
                <select
                  value={selectedCollectorId}
                  onChange={(e) => {
                    const nextId = Number(e.target.value);
                    setSelectedCollectorId(nextId);
                    setCollectorPayCustId(0);
                  }}
                  className="p-1 border rounded bg-slate-50 text-xs font-semibold outline-none"
                >
                  {collectors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* COLLECTOR IN-HAND CASH CARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Collected In-Transit (Pending Settlement)</span>
                  <h2 className="text-4xl font-black text-emerald-800 font-mono mt-1">
                    ₹{activeCollectorObj?.balance}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    This represents door-to-door cash collections logged by you that have not yet been physically deposited & settled with the main Prapti Office admin.
                  </p>
                </div>

                {activeCollectorObj && activeCollectorObj.balance > 0 && (
                  <button
                    onClick={() => handleSettleCollector(activeCollectorObj.id, activeCollectorObj.name)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-2 rounded-lg transition-all"
                  >
                    💵 Complete Cash Deposit Settlement with Office
                  </button>
                )}
              </div>

              {/* QUICK COLLECTION FORM */}
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
                  <Coins className="text-emerald-600" />
                  Log Door-To-Door Field Cash Collection
                </h3>

                <form onSubmit={handleCollectorCollectSubmit} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Subscriber Account</label>
                    <select
                      value={collectorPayCustId}
                      onChange={(e) => {
                        const custId = Number(e.target.value);
                        setCollectorPayCustId(custId);
                        const selectedC = customers.find(cu => cu.id === custId);
                        if (selectedC) {
                          setCollectorPayAmount(selectedC.balance);
                        }
                      }}
                      className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none"
                    >
                      <option value={0}>-- Select Customer --</option>
                      {customers.filter(c => c.collectorId === selectedCollectorId).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.customerCode}) - Outstanding: ₹{c.balance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Amount Received (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={collectorPayAmount}
                        onChange={(e) => setCollectorPayAmount(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Mode</label>
                      <select
                        value={collectorPayMethod}
                        onChange={(e) => setCollectorPayMethod(e.target.value)}
                        className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none"
                      >
                        <option value="Cash">Cash Handover</option>
                        <option value="UPI">UPI / GPay / PhonePe to Agent</option>
                        <option value="Card">Direct Card Terminal Swipe</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow"
                  >
                    🤝 Log Collection Ledger Entry
                  </button>
                </form>
              </div>
            </div>

            {/* PENDING DUE LIST FOR THIS COLLECTOR */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3">
                Your Assigned Pending Dues List
              </h3>

              <div className="mt-4 overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="p-3 font-bold text-slate-600">Subscriber Code</th>
                      <th className="p-3 font-bold text-slate-600">Name / Phone</th>
                      <th className="p-3 font-bold text-slate-600">Installation Address</th>
                      <th className="p-3 font-bold text-slate-600 text-right">Outstanding Amount</th>
                      <th className="p-3 font-bold text-slate-600 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.filter(c => c.collectorId === selectedCollectorId && c.balance > 0).map(cust => (
                      <tr key={cust.id} className="border-b hover:bg-rose-50/20">
                        <td className="p-3 font-mono font-bold text-[#881b4c]">{cust.customerCode}</td>
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{cust.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">📞 {cust.phone}</div>
                        </td>
                        <td className="p-3 text-slate-500">{cust.address}</td>
                        <td className="p-3 text-right font-mono font-black text-sm text-rose-600 bg-rose-50/20">
                          ₹{cust.balance}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setCollectorPayCustId(cust.id);
                              setCollectorPayAmount(cust.balance);
                              showNotification(`Loaded dues for subscriber ${cust.name}!`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-[10px] transition-all"
                          >
                            Select For Payment
                          </button>
                        </td>
                      </tr>
                    ))}

                    {customers.filter(c => c.collectorId === selectedCollectorId && c.balance > 0).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-emerald-600 font-bold text-xs bg-emerald-50/10">
                          🎉 Magnificent! There are no pending outstanding balances on your assigned subscriber ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* ======================================= */}
        {/*         4. TECHNICIAN PORTAL            */}
        {/* ======================================= */}
        {activePortal === 'technician' && (
          <div className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-6">
            
            {/* PERSONA HEADER */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-amber-800 font-bold text-xs uppercase tracking-wider block">Service Engineer Technical Portal</span>
                <h3 className="text-lg font-black text-amber-950 mt-1">
                  Active Engineer: <strong className="text-amber-700">{activeTechnicianObj?.name}</strong>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  📞 Contact: {activeTechnicianObj?.phone} | Speciality: <strong>{activeTechnicianObj?.specialization} Support</strong>
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white p-2 rounded-lg border">
                <span className="text-xs text-slate-500 font-semibold mr-1">Switch Engineer:</span>
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => {
                    setSelectedTechnicianId(Number(e.target.value));
                    setSelectedComplaintId(null);
                  }}
                  className="p-1 border rounded bg-slate-50 text-xs font-semibold outline-none"
                >
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* ASSIGNED TICKETS (OPEN COMPLAINTS) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <Wrench className="text-amber-600" />
                  Your Dispatched Service Jobs
                </h3>

                {complaints
                  .filter(c => c.status === 'Open' && (activeTechnicianObj?.specialization === 'Both' || c.type === 'Both' || c.type === activeTechnicianObj?.specialization))
                  .map(comp => {
                    const cust = customers.find(cu => cu.id === comp.customerId);

                    return (
                      <div
                        key={comp.id}
                        className={`border rounded-xl p-4 shadow-sm bg-white transition-all cursor-pointer ${
                          selectedComplaintId === comp.id ? 'ring-2 ring-amber-500 border-transparent' : 'hover:border-amber-300'
                        }`}
                        onClick={() => {
                          setSelectedComplaintId(comp.id);
                          setTechComments('');
                        }}
                      >
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            comp.type === 'Internet' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {comp.type} Support
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            comp.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {comp.priority} PRIORITY
                          </span>
                        </div>

                        <div className="mt-3 text-xs">
                          <p className="font-extrabold text-slate-900">👤 {cust ? cust.name : 'Unknown Subscriber'}</p>
                          <p className="text-slate-500 mt-0.5 font-medium">📍 {cust?.address} | 📞 {cust?.phone}</p>
                          <p className="mt-2.5 p-2 bg-slate-50 rounded border italic text-slate-700 leading-relaxed font-semibold">
                            "{comp.description}"
                          </p>
                        </div>

                        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>Logged: {new Date(comp.createdDate).toLocaleString()}</span>
                          <span className="text-amber-600 flex items-center gap-0.5">
                            Click to Resolve Job <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {complaints.filter(c => c.status === 'Open' && (activeTechnicianObj?.specialization === 'Both' || c.type === 'Both' || c.type === activeTechnicianObj?.specialization)).length === 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-8 text-center text-xs font-semibold">
                    🎉 Excellent! No pending field complaints logged in your speciality.
                  </div>
                )}
              </div>

              {/* ACTION TERMINAL PANEL */}
              <div className="bg-white border rounded-xl p-5 shadow-sm h-max">
                <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
                  <CheckCircle className="text-emerald-600" />
                  Technician Action Terminal
                </h3>

                {selectedComplaintId ? (
                  (() => {
                    const comp = complaints.find(c => c.id === selectedComplaintId);
                    const cust = customers.find(cu => cu.id === comp?.customerId);
                    return (
                      <form onSubmit={handleResolveComplaint} className="mt-4 space-y-4 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded border">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Job</p>
                          <strong className="text-slate-800 text-xs block mt-0.5">#{comp?.id} - {cust?.name}</strong>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">"{comp?.description}"</p>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Resolution Notes & Actions Taken *</label>
                          <textarea
                            value={techComments}
                            onChange={(e) => setTechComments(e.target.value)}
                            placeholder="Replaced damaged coaxial connector joint / Spliced the cut optical fiber core and power levels are restored to -18dBm."
                            rows={3.5}
                            className="w-full mt-1 p-2 border rounded bg-slate-50 outline-none focus:border-emerald-600"
                            required
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedComplaintId(null)}
                            className="flex-1 py-2 border rounded font-bold text-slate-600 hover:bg-slate-100"
                          >
                            Deselect Job
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider rounded"
                          >
                            Mark as Solved
                          </button>
                        </div>
                      </form>
                    );
                  })()
                ) : (
                  <p className="text-slate-400 text-xs italic mt-4 text-center leading-relaxed">
                    Select any assigned dispatched job on the left to activate the resolution terminal.
                  </p>
                )}

                {/* HARDWARE REPLACEMENT INVENTORY CHECK */}
                <div className="mt-6 pt-5 border-t border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Your Field STB Spare Inventory</h4>
                  <div className="mt-3 space-y-2">
                    <div className="p-2 bg-slate-50 border rounded flex justify-between items-center text-[11px]">
                      <span>Ready SD Set-Top Box Spare:</span>
                      <strong className="text-emerald-700">{stbSDNew} Units</strong>
                    </div>
                    <div className="p-2 bg-slate-50 border rounded flex justify-between items-center text-[11px]">
                      <span>Ready HD Set-Top Box Spare:</span>
                      <strong className="text-emerald-700">{stbHDNew} Units</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* SYSTEMFOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-bold text-slate-300">Prapti Media Services Private Limited</p>
            <p className="text-[11px] text-slate-500 mt-1">Multi-Tenant Cable TV Network & Fiber Optic Billing System Operator</p>
          </div>
          <div className="text-xs text-slate-500">
            Powered by Next.js & PostgreSQL via Drizzle Kit • SVS-Compatible API Engine
          </div>
        </div>
      </footer>

    </div>
  );
}
