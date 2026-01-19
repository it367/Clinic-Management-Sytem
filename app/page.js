//Clinic Management System v0.48
// Devoloper: Mark Murillo 
// Company: Kidshine Hawaii

'use client';
import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { DollarSign, FileText, Building2, Bot, Send, Loader2, LogOut, User, Upload, X, File, Shield, Receipt, CreditCard, Package, RefreshCw, Monitor, Menu, Eye, EyeOff, FolderOpen, Edit3, Users, Plus, Trash2, Lock, Download, Settings, MessageCircle, Sparkles, AlertCircle, Maximize2, Minimize2, Headphones, Search, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3 } from 'lucide-react';
const MODULES = [
  { id: 'daily-recon', name: 'Daily Recon', icon: DollarSign, color: 'emerald', table: 'daily_recon' },
  { id: 'billing-inquiry', name: 'Billing Inquiry', icon: Receipt, color: 'blue', table: 'billing_inquiries' },
  { id: 'bills-payment', name: 'Bills Payment', icon: CreditCard, color: 'violet', table: 'bills_payment' },
  { id: 'order-requests', name: 'Order Requests', icon: Package, color: 'amber', table: 'order_requests' },
  { id: 'refund-requests', name: 'Refund Requests', icon: RefreshCw, color: 'rose', table: 'refund_requests' },
];

const SUPPORT_MODULES = [
  { id: 'it-requests', name: 'IT Requests', icon: Monitor, color: 'cyan', table: 'it_requests' },
];

const ALL_MODULES = [...MODULES, ...SUPPORT_MODULES];

const MODULE_COLORS = {
  'daily-recon': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', light: 'bg-emerald-100' },
  'billing-inquiry': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100' },
  'bills-payment': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500', light: 'bg-violet-100' },
  'order-requests': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500', light: 'bg-amber-100' },
  'refund-requests': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500', light: 'bg-rose-100' },
  'it-requests': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-500', light: 'bg-cyan-100' },
};

const IT_STATUSES = ['For Review', 'In Progress', 'On-hold', 'Resolved'];
const INQUIRY_TYPES = ['Refund', 'Balance', 'Insurance', 'Payment Plan', 'Other'];
const REFUND_TYPES = ['Refund', 'Credit', 'Adjustment'];
const CONTACT_METHODS = ['Phone', 'Email', 'Text'];
const DATE_RANGES = ['This Week', 'Last 2 Weeks', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Custom'];
const RECON_STATUSES = ['Pending', 'Accounted', 'Rejected'];
const formatRole = (role) => {
  const roleMap = {
    'it': 'IT',
    'staff': 'Staff',
    'super_admin': 'Super Admin',
    'finance_admin': 'Finance Admin'
  };
  return roleMap[role] || role;
};

function canEditRecord(createdAt) {
  const now = new Date();
  const hawaiiNow = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
  const recordDate = new Date(createdAt);
  const recordHawaii = new Date(recordDate.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
  const dayOfWeek = recordHawaii.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  const friday = new Date(recordHawaii);
  friday.setDate(recordHawaii.getDate() + daysUntilFriday);
  friday.setHours(23, 59, 59, 999);
  return hawaiiNow <= friday;
}

function PasswordField({ label, value, onChange, placeholder = '', disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className={`flex items-center border-2 border-gray-200 rounded-xl bg-white transition-all hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${disabled ? 'bg-gray-100' : ''}`}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-2.5 rounded-xl outline-none bg-transparent disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <button type="button" onClick={() => setShow(!show)} className="px-3 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', prefix, options, large, disabled, isNumber }) {
  if (options) {
    return (
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
        <select value={value} onChange={onChange} disabled={disabled} className="w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (large) {
    return (
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
        <textarea value={value} onChange={onChange} disabled={disabled} rows={4} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder={placeholder} />
      </div>
    );
  }

  const handleNumberInput = (e) => {
    const val = e.target.value;
    if (isNumber || prefix === '$') {
      if (val === '' || /^\d*\.?\d*$/.test(val)) {
        onChange(e);
      }
    } else {
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className={`flex items-center border-2 border-gray-200 rounded-xl bg-white transition-all hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${disabled ? 'bg-gray-100' : ''}`}>
        {prefix && <span className="pl-3 text-gray-400 font-medium">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={handleNumberInput}
          disabled={disabled}
          className="w-full p-2.5 rounded-xl outline-none bg-transparent disabled:cursor-not-allowed"
          placeholder={placeholder}
          inputMode={(isNumber || prefix === '$') ? 'decimal' : undefined}
        />
      </div>
    </div>
  );
}

function FileUpload({ label, files, onFilesChange, onViewFile, disabled }) {
  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
      isNew: true
    }));
    onFilesChange([...files, ...newFiles]);
  };
  
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className={`border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <label className={`flex flex-col items-center justify-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} text-gray-500 hover:text-blue-600`}>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Click to upload files</span>
          <input type="file" multiple onChange={handleFileChange} disabled={disabled} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
        </label>
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 truncate flex-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="truncate text-sm font-medium text-gray-700">{file.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {file.url && <button onClick={() => onViewFile(file)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>}
                  {!disabled && <button onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileViewer({ file, onClose }) {
  if (!file) return null;
  const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white/90 backdrop-blur-sm">
          <h3 className="font-semibold truncate text-gray-800">{file.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {isImage ? <img src={file.url} alt={file.name} className="max-w-full rounded-xl mx-auto shadow-lg" /> : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <File className="w-10 h-10 text-gray-400" />
              </div>
              <p className="mb-4">Preview not available</p>
              <a href={file.url} download={file.name} className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow">Download File</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryPreview({ entry, module, onClose, colors, onViewDocument, currentUser, itUsers, onUpdateStatus, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: entry?.status || 'For Review',
    assigned_to: entry?.assigned_to || '',
    resolution_notes: entry?.resolution_notes || ''
  });

  useEffect(() => {
    if (entry) {
      setEditForm({
        status: entry.status || 'For Review',
        assigned_to: entry.assigned_to || '',
        resolution_notes: entry.resolution_notes || ''
      });
      setIsEditing(false);
    }
  }, [entry]);

  if (!entry) return null;
  
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-';
  const formatCurrency = (val) => val ? `$${Number(val).toFixed(2)}` : '$0.00';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString() : '-';

  const isITRequest = module?.id === 'it-requests';
  const canEdit = isITRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin' || currentUser.role === 'it');

  const handleSave = () => {
    if (onUpdateStatus) {
      onUpdateStatus(entry.id, editForm.status, {
        assigned_to: editForm.assigned_to || null,
        resolution_notes: editForm.resolution_notes || null
      });
    }
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl max-h-[90vh] w-full overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`flex justify-between items-center p-4 border-b sticky top-0 ${colors?.bg || 'bg-gray-50'}`}>
          <div>
            <h3 className="font-semibold text-gray-800">Entry Details</h3>
            <p className="text-sm text-gray-500">{module?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Status and Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={entry.status || 'Pending'} />
            <span className="text-sm text-gray-500">Created: {formatDateTime(entry.created_at)}</span>
            {entry.updated_at !== entry.created_at && (
              <span className="text-sm text-gray-500">Updated: {formatDateTime(entry.updated_at)}</span>
            )}
          </div>
          
          {entry.locations?.name && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              <Building2 className="w-4 h-4" /> {entry.locations.name}
            </div>
          )}

          {/* Daily Recon */}
          {module?.id === 'daily-recon' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h4 className="col-span-2 font-semibold text-emerald-800 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Cash Can Entries</h4>
                <div><span className="text-gray-600 text-sm">Date:</span> <span className="font-medium">{entry.recon_date}</span></div>
                <div><span className="text-gray-600 text-sm">Cash:</span> <span className="font-medium">{formatCurrency(entry.cash)}</span></div>
                <div><span className="text-gray-600 text-sm">Credit Card:</span> <span className="font-medium">{formatCurrency(entry.credit_card)}</span></div>
                <div><span className="text-gray-600 text-sm">Checks OTC:</span> <span className="font-medium">{formatCurrency(entry.checks_otc)}</span></div>
                <div><span className="text-gray-600 text-sm">Insurance:</span> <span className="font-medium">{formatCurrency(entry.insurance_checks)}</span></div>
                <div><span className="text-gray-600 text-sm">Care Credit:</span> <span className="font-medium">{formatCurrency(entry.care_credit)}</span></div>
                <div><span className="text-gray-600 text-sm">VCC:</span> <span className="font-medium">{formatCurrency(entry.vcc)}</span></div>
                <div><span className="text-gray-600 text-sm">EFTs:</span> <span className="font-medium">{formatCurrency(entry.efts)}</span></div>
                <div className="col-span-2 pt-2 border-t border-emerald-200">
                  <span className="text-gray-600 text-sm">Total Collected:</span> <span className="font-bold text-emerald-700 text-lg">{formatCurrency(entry.total_collected)}</span>
                </div>
              </div>
              {(entry.deposit_cash > 0 || entry.status === 'Accounted') && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="col-span-2 font-semibold text-blue-800 flex items-center gap-2"><Building2 className="w-4 h-4" /> Bank Deposit</h4>
                  <div><span className="text-gray-600 text-sm">Cash:</span> <span className="font-medium">{formatCurrency(entry.deposit_cash)}</span></div>
                  <div><span className="text-gray-600 text-sm">Credit Card:</span> <span className="font-medium">{formatCurrency(entry.deposit_credit_card)}</span></div>
                  <div><span className="text-gray-600 text-sm">Checks:</span> <span className="font-medium">{formatCurrency(entry.deposit_checks)}</span></div>
                  <div><span className="text-gray-600 text-sm">Insurance:</span> <span className="font-medium">{formatCurrency(entry.deposit_insurance)}</span></div>
                  <div><span className="text-gray-600 text-sm">Care Credit:</span> <span className="font-medium">{formatCurrency(entry.deposit_care_credit)}</span></div>
                  <div><span className="text-gray-600 text-sm">VCC:</span> <span className="font-medium">{formatCurrency(entry.deposit_vcc)}</span></div>
                  <div><span className="text-gray-600 text-sm">EFTs:</span> <span className="font-medium">{formatCurrency(entry.deposit_efts)}</span></div>
                  <div className="col-span-2 pt-2 border-t border-blue-200">
                    <span className="text-gray-600 text-sm">Total Deposit:</span> <span className="font-bold text-blue-700 text-lg">{formatCurrency(entry.total_deposit)}</span>
                  </div>
                </div>
              )}
              {entry.notes && <div className="p-4 bg-gray-50 rounded-xl"><span className="text-gray-600 text-sm block mb-1">Notes:</span><p className="text-gray-800">{entry.notes}</p></div>}
            </div>
          )}

          {/* Billing Inquiry */}
          {module?.id === 'billing-inquiry' && (
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-600 text-sm block">Patient Name</span><span className="font-medium">{entry.patient_name || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Chart Number</span><span className="font-medium">{entry.chart_number || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Parent Name</span><span className="font-medium">{entry.parent_name || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Date of Request</span><span className="font-medium">{formatDate(entry.date_of_request)}</span></div>
              <div><span className="text-gray-600 text-sm block">Inquiry Type</span><span className="font-medium">{entry.inquiry_type || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Amount in Question</span><span className="font-medium text-emerald-600">{formatCurrency(entry.amount_in_question)}</span></div>
              <div><span className="text-gray-600 text-sm block">Contact Method</span><span className="font-medium">{entry.best_contact_method || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Best Time to Contact</span><span className="font-medium">{entry.best_contact_time || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Billing Team Reviewed</span><span className="font-medium">{entry.billing_team_reviewed || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Date Reviewed</span><span className="font-medium">{formatDate(entry.date_reviewed)}</span></div>
              <div><span className="text-gray-600 text-sm block">Result</span><span className="font-medium">{entry.result || '-'}</span></div>
              <div className="col-span-2"><span className="text-gray-600 text-sm block">Description</span><p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{entry.description || '-'}</p></div>
            </div>
          )}

          {/* Bills Payment */}
          {module?.id === 'bills-payment' && (
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-600 text-sm block">Bill Date</span><span className="font-medium">{formatDate(entry.bill_date)}</span></div>
              <div><span className="text-gray-600 text-sm block">Vendor</span><span className="font-medium">{entry.vendor || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Amount</span><span className="font-medium text-emerald-600">{formatCurrency(entry.amount)}</span></div>
              <div><span className="text-gray-600 text-sm block">Due Date</span><span className="font-medium">{formatDate(entry.due_date)}</span></div>
              <div><span className="text-gray-600 text-sm block">Bill Status</span><span className="font-medium">{entry.bill_status || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Manager Initials</span><span className="font-medium">{entry.manager_initials || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">AP Reviewed</span><span className="font-medium">{entry.ap_reviewed || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Date Reviewed</span><span className="font-medium">{formatDate(entry.date_reviewed)}</span></div>
              <div><span className="text-gray-600 text-sm block">Paid</span><span className="font-medium">{entry.paid || '-'}</span></div>
              <div className="col-span-2"><span className="text-gray-600 text-sm block">Description</span><p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{entry.description || '-'}</p></div>
            </div>
          )}

          {/* Order Requests */}
          {module?.id === 'order-requests' && (
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-600 text-sm block">Date Entered</span><span className="font-medium">{formatDate(entry.date_entered)}</span></div>
              <div><span className="text-gray-600 text-sm block">Vendor</span><span className="font-medium">{entry.vendor || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Invoice Number</span><span className="font-medium">{entry.invoice_number || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Invoice Date</span><span className="font-medium">{formatDate(entry.invoice_date)}</span></div>
              <div><span className="text-gray-600 text-sm block">Due Date</span><span className="font-medium">{formatDate(entry.due_date)}</span></div>
              <div><span className="text-gray-600 text-sm block">Amount</span><span className="font-medium text-emerald-600">{formatCurrency(entry.amount)}</span></div>
              <div><span className="text-gray-600 text-sm block">Entered By</span><span className="font-medium">{entry.entered_by || '-'}</span></div>
              <div className="col-span-2"><span className="text-gray-600 text-sm block">Notes</span><p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{entry.notes || '-'}</p></div>
            </div>
          )}

          {/* Refund Requests */}
          {module?.id === 'refund-requests' && (
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-600 text-sm block">Patient Name</span><span className="font-medium">{entry.patient_name || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Chart Number</span><span className="font-medium">{entry.chart_number || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Parent Name</span><span className="font-medium">{entry.parent_name || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">RP Address</span><span className="font-medium">{entry.rp_address || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Date of Request</span><span className="font-medium">{formatDate(entry.date_of_request)}</span></div>
              <div><span className="text-gray-600 text-sm block">Type</span><span className="font-medium">{entry.type || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">Amount Requested</span><span className="font-medium text-emerald-600">{formatCurrency(entry.amount_requested)}</span></div>
              <div><span className="text-gray-600 text-sm block">Contact Method</span><span className="font-medium">{entry.best_contact_method || '-'}</span></div>
              <div><span className="text-gray-600 text-sm block">eAssist Audited</span><span className="font-medium">{entry.eassist_audited === true ? 'Yes' : entry.eassist_audited === false ? 'No' : '-'}</span></div>
              <div className="col-span-2"><span className="text-gray-600 text-sm block">Description</span><p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{entry.description || '-'}</p></div>
            </div>
          )}

          {/* IT Requests */}
          {module?.id === 'it-requests' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-600 text-sm block">Ticket Number</span><span className="font-medium text-cyan-600">IT-{entry.ticket_number}</span></div>
                <div><span className="text-gray-600 text-sm block">Date Reported</span><span className="font-medium">{formatDate(entry.date_reported)}</span></div>
                <div><span className="text-gray-600 text-sm block">Urgency</span><span className={`font-medium ${entry.urgency === 'Critical' ? 'text-red-600' : entry.urgency === 'High' ? 'text-orange-600' : ''}`}>{entry.urgency || '-'}</span></div>
                <div><span className="text-gray-600 text-sm block">Requester Name</span><span className="font-medium">{entry.requester_name || '-'}</span></div>
                <div><span className="text-gray-600 text-sm block">Device / System</span><span className="font-medium">{entry.device_system || '-'}</span></div>
                <div><span className="text-gray-600 text-sm block">Contact Method</span><span className="font-medium">{entry.best_contact_method || '-'}</span></div>
                <div><span className="text-gray-600 text-sm block">Best Contact Time</span><span className="font-medium">{entry.best_contact_time || '-'}</span></div>
                <div><span className="text-gray-600 text-sm block">Assigned To</span><span className="font-medium">{entry.assigned_to || '-'}</span></div>
                <div className="col-span-2"><span className="text-gray-600 text-sm block">Description of Issue</span><p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{entry.description_of_issue || '-'}</p></div>
                {entry.resolution_notes && <div className="col-span-2"><span className="text-gray-600 text-sm block">Resolution Notes</span><p className="font-medium bg-emerald-50 p-3 rounded-lg mt-1 text-emerald-800">{entry.resolution_notes}</p></div>}
                {entry.resolved_at && <div><span className="text-gray-600 text-sm block">Resolved At</span><span className="font-medium">{formatDateTime(entry.resolved_at)}</span></div>}
              </div>

              {/* Edit Section for IT Requests */}
              {canEdit && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" /> Update Status & Assignment
                    </button>
                  ) : (
                    <div className="space-y-4 bg-cyan-50 p-4 rounded-xl border border-cyan-200">
                      <h4 className="font-semibold text-cyan-800 flex items-center gap-2">
                        <Edit3 className="w-4 h-4" /> Update IT Request
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Status</label>
                          <select
                            value={editForm.status}
                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-cyan-400 bg-white"
                          >
                            {IT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Assign To</label>
                          <select
                            value={editForm.assigned_to}
                            onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-cyan-400 bg-white"
                          >
                            <option value="">Unassigned</option>
                            {itUsers?.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Resolution Notes</label>
                        <textarea
                          value={editForm.resolution_notes}
                          onChange={e => setEditForm({ ...editForm, resolution_notes: e.target.value })}
                          placeholder="Add resolution notes..."
                          rows={3}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-cyan-400 bg-white resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2.5 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Creator/Updater Info */}
          <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-500">
            {entry.creator?.name && <span>Created by: <span className="font-medium text-gray-700">{entry.creator.name}</span></span>}
            {entry.updater?.name && entry.updater.name !== entry.creator?.name && <span>Updated by: <span className="font-medium text-gray-700">{entry.updater.name}</span></span>}
          </div>
        </div>

<div className="p-4 border-t bg-gray-50 sticky bottom-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all">Close</button>
          {onDelete && (
            <button onClick={() => onDelete(entry.id)} className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'For Review': 'bg-purple-100 text-purple-700 border-purple-200',
    'Open': 'bg-red-100 text-red-700 border-red-200',
    'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
    'On-hold': 'bg-gray-100 text-gray-600 border-gray-200',
    'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Closed': 'bg-gray-100 text-gray-600 border-gray-200',
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'Approved': 'bg-blue-100 text-blue-700 border-blue-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Denied': 'bg-red-100 text-red-700 border-red-200',
    'Accounted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Rejected': 'bg-red-100 text-red-700 border-red-200'
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status || 'Pending'}</span>;
}

// Simple markdown renderer for chat messages
function renderMarkdown(text) {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let key = 0;
  
  lines.forEach((line) => {
    let processedLine = line;
    
    // Convert **bold** to <strong>
    processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Check for headers
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    
    // Check if line is a bullet point
    const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);
    const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    
    if (h3Match) {
      const content = h3Match[1].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      elements.push(
        <div key={key++} className="font-semibold text-gray-800 mt-2" dangerouslySetInnerHTML={{ __html: content }} />
      );
    } else if (h2Match) {
      const content = h2Match[1].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      elements.push(
        <div key={key++} className="font-bold text-gray-900 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: content }} />
      );
    } else if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[2]
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      elements.push(
        <div key={key++} className="flex gap-2" style={{ paddingLeft: `${indent * 8}px` }}>
          <span className="text-gray-400">•</span>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    } else if (numberMatch) {
      const indent = numberMatch[1].length;
      const num = numberMatch[2];
      const content = numberMatch[3]
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      elements.push(
        <div key={key++} className="flex gap-2" style={{ paddingLeft: `${indent * 8}px` }}>
          <span className="text-gray-500 font-medium">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    } else if (processedLine.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(
        <div key={key++} dangerouslySetInnerHTML={{ __html: processedLine }} />
      );
    }
  });
  
  return <div className="space-y-1">{elements}</div>;
}

function FloatingChat({ messages, input, setInput, onSend, loading, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAdmin = userRole === 'super_admin' || userRole === 'finance_admin' || userRole === 'it';

  const chatSize = isExpanded 
    ? 'w-[600px] h-[700px]' 
    : 'w-96 h-[500px]';

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl ${isOpen ? 'bg-gray-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 ${chatSize} bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300`}>
          <div className={`p-4 text-white ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs text-white/80">Powered by Claude</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isExpanded ? 'Compact view' : 'Expanded view'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md' : 'bg-white border border-gray-200 shadow-sm rounded-bl-md'}`}>
                  {msg.role === 'user' ? (
                    <span>{msg.content}</span>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSend()}
                placeholder="Ask me anything..."
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                onClick={onSend}
                disabled={loading}
                className="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ClinicSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
const [rememberMe, setRememberMe] = useState(false);
const [lastLogin, setLastLogin] = useState(null);
const [loginHistory, setLoginHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeModule, setActiveModule] = useState('daily-recon');
  const [view, setView] = useState('entry');
  const [adminView, setAdminView] = useState('records');
  const [moduleData, setModuleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewingFile, setViewingFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminLocation, setAdminLocation] = useState('all');
  const [editingStatus, setEditingStatus] = useState(null);
  const [editingRecon, setEditingRecon] = useState(null);
const [reconForm, setReconForm] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
const [sortOrder, setSortOrder] = useState('desc');
const [recordsPerPage, setRecordsPerPage] = useState(20);
const [currentPage, setCurrentPage] = useState(1);
const [nameForm, setNameForm] = useState('');
  const [editingStaffEntry, setEditingStaffEntry] = useState(null);
const [staffEditForm, setStaffEditForm] = useState({});
  const [viewingUserSessions, setViewingUserSessions] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [viewingEntry, setViewingEntry] = useState(null);
const [userSessionsData, setUserSessionsData] = useState([]);
const [loadingUserSessions, setLoadingUserSessions] = useState(false);
  const [staffRecordSearch, setStaffRecordSearch] = useState('');
const [staffSortOrder, setStaffSortOrder] = useState('desc');
const [staffRecordsPerPage, setStaffRecordsPerPage] = useState(20);
const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [itUsers, setItUsers] = useState([]);
const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, onCancel: null, confirmText: 'Confirm', confirmColor: 'blue' });
const [passwordDialog, setPasswordDialog] = useState({ open: false, title: '', message: '', onConfirm: null, onCancel: null, password: '', error: '' });
const [selectedRecords, setSelectedRecords] = useState([]);
const [selectAll, setSelectAll] = useState(false);
const [selectedDocuments, setSelectedDocuments] = useState([]);
const [docSelectAll, setDocSelectAll] = useState(false);
const [downloadingZip, setDownloadingZip] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: 'staff', locations: [] });

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });

  const [exportModule, setExportModule] = useState('daily-recon');
  const [exportLocation, setExportLocation] = useState('all');
  const [exportRange, setExportRange] = useState('This Month');
const [analyticsRange, setAnalyticsRange] = useState('This Month');
const [analyticsModule, setAnalyticsModule] = useState('daily-recon');
  const [chatMessages, setChatMessages] = useState([{
    role: 'assistant',
    content: "👋 Hi! I'm your AI assistant. I can help with:\n\n• Data summaries & reports\n• Weekly comparisons\n• Location analytics\n• IT request status\n\nWhat would you like to know?"
  }]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [entryDocuments, setEntryDocuments] = useState({});

  const loadEntryDocuments = async (recordType, recordId) => {
    const key = `${recordType}-${recordId}`;
    if (entryDocuments[key]) return; // Already loaded
    
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('record_type', recordType)
      .eq('record_id', recordId);
    
    if (data) {
      setEntryDocuments(prev => ({ ...prev, [key]: data }));
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const [forms, setForms] = useState({
    'daily-recon': { recon_date: today, cash: '', credit_card: '', checks_otc: '', insurance_checks: '', care_credit: '', vcc: '', efts: '', deposit_cash: '', deposit_credit_card: '', deposit_checks: '', deposit_insurance: '', deposit_care_credit: '', deposit_vcc: '', deposit_efts: '', notes: '', entered_by: '' },
    'billing-inquiry': { patient_name: '', chart_number: '', parent_name: '', date_of_request: today, inquiry_type: '', description: '', amount_in_question: '', best_contact_method: '', best_contact_time: '', billing_team_reviewed: '', date_reviewed: '', status: 'Pending', result: '' },
    'bills-payment': { bill_status: 'Pending', bill_date: today, vendor: '', description: '', amount: '', due_date: '', manager_initials: '', ap_reviewed: '', date_reviewed: '', paid: '' },
    'order-requests': { date_entered: today, vendor: '', invoice_number: '', invoice_date: '', due_date: '', amount: '', entered_by: '', notes: '' },
    'refund-requests': { patient_name: '', chart_number: '', parent_name: '', rp_address: '', date_of_request: today, type: '', description: '', amount_requested: '', best_contact_method: '', eassist_audited: '', status: 'Pending' },
   'it-requests': { date_reported: today, urgency: '', requester_name: '', device_system: '', description_of_issue: '', best_contact_method: '', best_contact_time: '', assigned_to: '', status: 'Open', resolution_notes: '', completed_by: '' }
  });

  const [files, setFiles] = useState({
  'daily-recon': { documents: [] },
    'billing-inquiry': { documentation: [] },
    'bills-payment': { documentation: [] },
    'order-requests': { orderInvoices: [] },
    'refund-requests': { documentation: [] },
    'it-requests': { documentation: [] }
  });

useEffect(() => {
  loadLocations();
  
  // Check for saved session on mount
  const savedSession = localStorage.getItem('cms_session') || sessionStorage.getItem('cms_session');
  if (savedSession) {
    try {
      const sessionData = JSON.parse(savedSession);
      
      // Check if session has expired
      if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
        // Session expired - clear it
        localStorage.removeItem('cms_session');
        sessionStorage.removeItem('cms_session');
        return;
      }
      
      // Verify session is still valid
      if (sessionData.user && sessionData.user.id) {
        setCurrentUser(sessionData.user);
        setUserLocations(sessionData.userLocations || []);
        if (sessionData.selectedLocation) {
          setSelectedLocation(sessionData.selectedLocation);
        }
        setLastLogin(sessionData.lastLogin);
// Load users if admin and set default view
if (sessionData.user.role === 'super_admin' || sessionData.user.role === 'finance_admin' || sessionData.user.role === 'it') {
  loadUsers();
  loadItUsers();
  setAdminView('analytics');
}
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem('cms_session');
      sessionStorage.removeItem('cms_session');
    }
  }
  
  // Multi-tab sync: Listen for storage changes
  const handleStorageChange = (e) => {
    if (e.key === 'cms_session') {
      if (e.newValue === null) {
        // Session was cleared in another tab - log out here too
        setCurrentUser(null);
        setUserLocations([]);
        setSelectedLocation(null);
        setLoginEmail('');
        setLoginPassword('');
        setView('entry');
        setAdminView('records');
        setModuleData({});
        setChatMessages([{ role: 'assistant', content: "👋 Hi! I'm your AI assistant." }]);
      } else if (e.newValue) {
        // Session was created/updated in another tab - sync here
        try {
          const sessionData = JSON.parse(e.newValue);
          if (sessionData.user) {
            setCurrentUser(sessionData.user);
            setUserLocations(sessionData.userLocations || []);
            if (sessionData.selectedLocation) {
              setSelectedLocation(sessionData.selectedLocation);
            }
            setLastLogin(sessionData.lastLogin);
            if (sessionData.user.role === 'super_admin' || sessionData.user.role === 'finance_admin') {
              loadUsers();
            }
          }
        } catch (err) {
          console.error('Failed to sync session:', err);
        }
      }
    }
    // Handle explicit logout broadcast
    if (e.key === 'cms_logout') {
      setCurrentUser(null);
      setUserLocations([]);
      setSelectedLocation(null);
      setModuleData({});
      setChatMessages([{ role: 'assistant', content: "👋 Hi! I'm your AI assistant." }]);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
useEffect(() => { if (currentUser) setNameForm(currentUser.name || ''); }, [currentUser]);
  useEffect(() => {
    if (currentUser && (selectedLocation || isAdmin)) {
      loadModuleData(activeModule);
    }
  }, [currentUser, selectedLocation, activeModule, adminLocation]);

useEffect(() => { setCurrentPage(1); setRecordSearch(''); }, [activeModule, adminLocation]);
  useEffect(() => { setStaffCurrentPage(1); setStaffRecordSearch(''); setEditingStaffEntry(null); }, [activeModule, selectedLocation]);
useEffect(() => { setSelectedRecords([]); setSelectAll(false); }, [activeModule, adminLocation, currentPage, recordSearch]);
  useEffect(() => { setSelectedDocuments([]); setDocSelectAll(false); }, [adminView, docSearch]);
  useEffect(() => {
  if (viewingEntry && activeModule === 'it-requests') {
    loadItUsers();
  }
}, [viewingEntry]);
  
// Load data when analytics module changes
useEffect(() => {
  const userIsAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin';
  if (userIsAdmin && adminView === 'analytics' && analyticsModule) {
    if (!moduleData[analyticsModule]) {
      loadModuleData(analyticsModule);
    }
  }
}, [analyticsModule, adminView, currentUser, moduleData]);
const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'it';
const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'it';

const showConfirm = (title, message, confirmText = 'Confirm', confirmColor = 'blue') => {
  return new Promise((resolve) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmText,
      confirmColor,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        resolve(true);
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        resolve(false);
      }
    });
  });
};

const showPasswordConfirm = (title, message) => {
  return new Promise((resolve) => {
    setPasswordDialog({
      open: true,
      title,
      message,
      password: '',
      error: '',
      onConfirm: (enteredPassword) => {
        if (enteredPassword === currentUser.password_hash) {
          setPasswordDialog(prev => ({ ...prev, open: false, password: '', error: '' }));
          resolve(true);
        } else {
          setPasswordDialog(prev => ({ ...prev, error: 'Incorrect password' }));
          resolve(false);
        }
      },
      onCancel: () => {
        setPasswordDialog(prev => ({ ...prev, open: false, password: '', error: '' }));
        resolve(null);
      }
    });
  });
};
  
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

const deleteRecord = async (moduleId, recordId) => {
  const confirmed = await showConfirm('Delete Record', 'Are you sure you want to delete this record? This action cannot be undone.', 'Delete', 'red');
  if (!confirmed) return false;

  const passwordValid = await showPasswordConfirm('Confirm Password', 'Enter your password to confirm deletion');
  if (!passwordValid) {
    if (passwordValid === false) showMessage('error', 'Incorrect password');
    return false;
  }

  const module = ALL_MODULES.find(m => m.id === moduleId);
  if (!module) return false;

  const { data: docs } = await supabase.from('documents').select('storage_path').eq('record_type', moduleId).eq('record_id', recordId);
  if (docs && docs.length > 0) {
    await supabase.storage.from('clinic-documents').remove(docs.map(d => d.storage_path));
    await supabase.from('documents').delete().eq('record_type', moduleId).eq('record_id', recordId);
  }

  const { error } = await supabase.from(module.table).delete().eq('id', recordId);
  if (error) {
    showMessage('error', 'Failed to delete record: ' + error.message);
    return false;
  }

  showMessage('success', '✓ Record deleted successfully');
  loadModuleData(moduleId);
  return true;
};

const deleteSelectedRecords = async () => {
  if (selectedRecords.length === 0) { showMessage('error', 'No records selected'); return; }

  const confirmed = await showConfirm('Delete Selected Records', `Are you sure you want to delete ${selectedRecords.length} record(s)? This action cannot be undone.`, 'Delete All', 'red');
  if (!confirmed) return;

  const passwordValid = await showPasswordConfirm('Confirm Password', `Enter your password to delete ${selectedRecords.length} record(s)`);
  if (!passwordValid) {
    if (passwordValid === false) showMessage('error', 'Incorrect password');
    return;
  }

  const module = ALL_MODULES.find(m => m.id === activeModule);
  if (!module) return;

  let successCount = 0, errorCount = 0;

  for (const recordId of selectedRecords) {
    const { data: docs } = await supabase.from('documents').select('storage_path').eq('record_type', activeModule).eq('record_id', recordId);
    if (docs && docs.length > 0) {
      await supabase.storage.from('clinic-documents').remove(docs.map(d => d.storage_path));
      await supabase.from('documents').delete().eq('record_type', activeModule).eq('record_id', recordId);
    }
    const { error } = await supabase.from(module.table).delete().eq('id', recordId);
    if (error) errorCount++; else successCount++;
  }

  setSelectedRecords([]);
  setSelectAll(false);
  showMessage(errorCount > 0 ? 'error' : 'success', errorCount > 0 ? `Deleted ${successCount} records. ${errorCount} failed.` : `✓ ${successCount} record(s) deleted successfully`);
  loadModuleData(activeModule);
};

const toggleRecordSelection = (recordId) => {
  setSelectedRecords(prev => prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]);
};

const toggleSelectAll = () => {
  if (selectAll) { setSelectedRecords([]); setSelectAll(false); }
  else { setSelectedRecords(getPaginatedEntries().map(e => e.id)); setSelectAll(true); }
};
  
  const loadLocations = async () => {
    const { data, error } = await supabase.from('locations').select('*').eq('is_active', true).order('name');
    if (data) setLocations(data);
  };

const loadItUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'it')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error('Error loading IT users:', error);
  }
  if (data) setItUsers(data);
};
  
  const loadUsers = async () => {
    console.log('Loading users...');
    
    // Get all users without any joins
const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (usersError) {
      console.error('Users load error:', usersError);
      return;
    }
    
    if (!usersData || usersData.length === 0) {
      setUsers([]);
      return;
    }
    
    // Get user_locations separately (no join to users)
    const { data: userLocsData } = await supabase
      .from('user_locations')
      .select('user_id, location_id');
    
    // Get all locations
    const { data: locsData } = await supabase
      .from('locations')
      .select('id, name');
    
    // Build a location map for quick lookup
    const locationMap = {};
    locsData?.forEach(loc => { locationMap[loc.id] = loc; });
    
    // Combine users with their locations
    const usersWithLocations = usersData.map(user => ({
      ...user,
      locations: userLocsData
        ?.filter(ul => ul.user_id === user.id)
        ?.map(ul => locationMap[ul.location_id])
        ?.filter(Boolean) || []
    }));
    
    console.log('Loaded users:', usersWithLocations.length);
    setUsers(usersWithLocations);
  };

  const loadDocuments = async () => {
    // Get documents without joining to users
    const { data: docsData, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(200);
    
    if (error) {
      console.error('Documents load error:', error);
      return;
    }
    
    if (!docsData || docsData.length === 0) {
      setDocuments([]);
      return;
    }
    
    // Get uploader names separately
    const uploaderIds = [...new Set(docsData.map(d => d.uploaded_by).filter(Boolean))];
    const { data: uploadersData } = await supabase
      .from('users')
      .select('id, name')
      .in('id', uploaderIds);
    
    const uploaderMap = {};
    uploadersData?.forEach(u => { uploaderMap[u.id] = u; });
    
    const docsWithUploaders = docsData.map(doc => ({
      ...doc,
      uploader: uploaderMap[doc.uploaded_by] || null
    }));
    
    console.log('Loaded documents:', docsWithUploaders.length);
    setDocuments(docsWithUploaders);
  };

  const loadModuleData = async (moduleId) => {
    setLoading(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    if (!module) return;

    let query = supabase.from(module.table).select('*').order('created_at', { ascending: false });

    if (!isAdmin && selectedLocation) {
      const loc = locations.find(l => l.name === selectedLocation);
      if (loc) query = query.eq('location_id', loc.id);
    } else if (isAdmin && adminLocation !== 'all') {
      const loc = locations.find(l => l.name === adminLocation);
      if (loc) query = query.eq('location_id', loc.id);
    }

    const { data, error } = await query.limit(500);
    if (error) {
      console.error('Module data load error:', moduleId, error);
    }
    if (data && data.length > 0) {
      // Get location names
      const locationIds = [...new Set(data.map(d => d.location_id).filter(Boolean))];
      const { data: locsData } = await supabase.from('locations').select('id, name').in('id', locationIds);
      const locMap = {};
      locsData?.forEach(l => { locMap[l.id] = l; });
      
      // Get creator/updater names
      const userIds = [...new Set([...data.map(d => d.created_by), ...data.map(d => d.updated_by)].filter(Boolean))];
      const { data: usersData } = await supabase.from('users').select('id, name').in('id', userIds);
      const userMap = {};
      usersData?.forEach(u => { userMap[u.id] = u; });
      
      // Combine
      const enrichedData = data.map(d => ({
        ...d,
        locations: locMap[d.location_id] || null,
        creator: userMap[d.created_by] || null,
        updater: userMap[d.updated_by] || null
      }));
      
      console.log(`Loaded ${moduleId}:`, enrichedData.length, 'records');
      setModuleData(prev => ({ ...prev, [moduleId]: enrichedData }));
    } else {
      setModuleData(prev => ({ ...prev, [moduleId]: [] }));
    }
    setLoading(false);
  };

  const saveSession = (user, locations, selectedLoc, lastLoginInfo, remember) => {
  const sessionData = {
    user,
    userLocations: locations,
    selectedLocation: selectedLoc,
    lastLogin: lastLoginInfo,
    savedAt: new Date().toISOString(),
    expiresAt: remember 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      : null // Session storage handles expiry on browser close
  };
  
  if (remember) {
    localStorage.setItem('cms_session', JSON.stringify(sessionData));
    sessionStorage.removeItem('cms_session');
  } else {
    sessionStorage.setItem('cms_session', JSON.stringify(sessionData));
    localStorage.removeItem('cms_session');
  }
};

const clearSession = () => {
  localStorage.removeItem('cms_session');
  sessionStorage.removeItem('cms_session');
  // Broadcast logout to other tabs
  localStorage.setItem('cms_logout', Date.now().toString());
  localStorage.removeItem('cms_logout');
};

const logLoginActivity = async (userId) => {
  try {
    // Get user agent info
    const userAgent = navigator.userAgent;
    let deviceInfo = 'Unknown Device';
    
    if (/mobile/i.test(userAgent)) {
      deviceInfo = 'Mobile Device';
      if (/iPhone/i.test(userAgent)) deviceInfo = 'iPhone';
      else if (/iPad/i.test(userAgent)) deviceInfo = 'iPad';
      else if (/Android/i.test(userAgent)) deviceInfo = 'Android Device';
    } else {
      deviceInfo = 'Desktop';
      if (/Windows/i.test(userAgent)) deviceInfo = 'Windows PC';
      else if (/Mac/i.test(userAgent)) deviceInfo = 'Mac';
      else if (/Linux/i.test(userAgent)) deviceInfo = 'Linux PC';
    }
    
    // Get browser info
    let browser = 'Unknown Browser';
    if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
    else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Edg/i.test(userAgent)) browser = 'Edge';
    
    const locationInfo = `${deviceInfo} - ${browser}`;
    
    // Try to get IP (this will only work with an external service)
    let ipAddress = null;
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (e) {
      console.log('Could not fetch IP address');
    }
    
    // Insert login activity
    await supabase.from('login_activity').insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent.substring(0, 500),
      location_info: locationInfo
    });
    
    return { ipAddress, locationInfo, login_at: new Date().toISOString() };
  } catch (e) {
    console.error('Login activity error:', e);
    return null;
  }
};

const getLastLoginForUser = async (userId) => {
  const { data } = await supabase
    .from('login_activity')
    .select('login_at, location_info, ip_address')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return data;
};

const loadLoginHistory = async (userId) => {
  const { data } = await supabase
    .from('login_activity')
    .select('*')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(10);
  
  if (data) setLoginHistory(data);
};

  const loadUserSessions = async (userId) => {
  setLoadingUserSessions(true);
  const { data } = await supabase
    .from('login_activity')
    .select('*')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(20);
  
  setUserSessionsData(data || []);
  setLoadingUserSessions(false);
};
  
const handleLogin = async () => {
  if (!loginEmail || !loginPassword) {
    showMessage('error', 'Please enter email/username and password');
    return;
  }

  setLoginLoading(true);
  
  try {
    // Try to find user by email OR username
    const loginValue = loginEmail.toLowerCase().trim();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${loginValue},username.eq.${loginValue}`)
      .eq('password_hash', loginPassword)
      .eq('is_active', true)
      .maybeSingle();

    if (userError) {
      console.error('Login error:', userError);
      showMessage('error', 'Login failed. Please try again.');
      setLoginLoading(false);
      return;
    }

    if (!user) {
      showMessage('error', 'Invalid email or password');
      setLoginLoading(false);
      return;
    }

    // Get last login BEFORE logging new activity
    const previousLogin = await getLastLoginForUser(user.id);
    setLastLogin(previousLogin);

    // Log this login activity
    await logLoginActivity(user.id);

    // Get user_locations separately without joins
    const { data: userLocsData } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('user_id', user.id);
    
    // Get location details
    const locIds = userLocsData?.map(ul => ul.location_id) || [];
    let locationsList = [];
    if (locIds.length > 0) {
      const { data: locsData } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', locIds);
      locationsList = locsData || [];
    }

    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const selectedLoc = locationsList.length === 1 ? locationsList[0].name : null;

    // Save session (with or without "Remember Me")
    saveSession(user, locationsList, selectedLoc, previousLogin, rememberMe);

setCurrentUser(user);
    setUserLocations(locationsList);

    if (selectedLoc) {
      setSelectedLocation(selectedLoc);
    }

if (user.role === 'super_admin' || user.role === 'finance_admin') {
      loadUsers();
      loadItUsers();
      loadLoginHistory(user.id);
      setAdminView('analytics'); // Default to analytics for admins
    }

    showMessage('success', '✓ Login successful!');

  } catch (err) {
    console.error('Login exception:', err);
    showMessage('error', 'An error occurred. Please try again.');
  }

  setLoginLoading(false);
};

const handleLogout = async () => {
  const confirmed = await showConfirm(
    'Logout', 
    'Are you sure you want to logout?', 
    'Logout', 
    'blue'
  );
  if (!confirmed) return;

  clearSession();
  setCurrentUser(null);
  setUserLocations([]);
  setSelectedLocation(null);
  setLoginEmail('');
  setLoginPassword('');
  setRememberMe(false);
  setLastLogin(null);
  setLoginHistory([]);
  setView('entry');
  setAdminView('records');
  setPwdForm({ current: '', new: '', confirm: '' });
  setChatMessages([{
    role: 'assistant',
    content: "👋 Hi! I'm your AI assistant. I can help with:\n\n• Data summaries & reports\n• Weekly comparisons\n• Location analytics\n• IT request status\n\nWhat would you like to know?"
  }]);
  setModuleData({});
};

const addUser = async () => {
  if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
    showMessage('error', 'Please fill all required fields');
    return;
  }

 const confirmed = await showConfirm('Create User', `Are you sure you want to create user "${newUser.name}"?`, 'Create', 'green');
if (!confirmed) return;

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', newUser.username.toLowerCase())
    .maybeSingle();
  
  if (existingUser) {
    showMessage('error', 'Username already exists');
    return;
  }

  const { data: createdUser, error } = await supabase
    .from('users')
    .insert({
      name: newUser.name,
      username: newUser.username.toLowerCase(),
      email: newUser.email.toLowerCase(),
      password_hash: newUser.password,
      role: newUser.role,
      created_by: currentUser.id
    })
    .select()
    .single();

  if (error) {
    showMessage('error', error.message.includes('duplicate') ? 'Email already exists' : 'Failed to create user');
    return;
  }

  if (newUser.role === 'staff' && newUser.locations.length > 0) {
    const locationAssignments = newUser.locations.map(locId => ({
      user_id: createdUser.id,
      location_id: locId,
      assigned_by: currentUser.id
    }));
    await supabase.from('user_locations').insert(locationAssignments);
  }

  showMessage('success', '✓ User created successfully!');
  setNewUser({ name: '', username: '', email: '', password: '', role: 'staff', locations: [] });
  setShowAddUser(false);
  loadUsers();
};

const updateUser = async () => {
  if (!editingUser.name || !editingUser.email) {
    showMessage('error', 'Please fill all required fields');
    return;
  }

const confirmed = await showConfirm('Update User', `Are you sure you want to update user "${editingUser.name}"?`, 'Update', 'blue');
if (!confirmed) return;

  // Check if username is taken by another user (if username provided)
  if (editingUser.username) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', editingUser.username.toLowerCase())
      .neq('id', editingUser.id)
      .maybeSingle();
    
    if (existingUser) {
      showMessage('error', 'Username already taken by another user');
      return;
    }
  }

  const updateData = {
    name: editingUser.name,
    email: editingUser.email.toLowerCase(),
    role: editingUser.role,
    updated_by: currentUser.id
  };

  // Only update username if provided
  if (editingUser.username) {
    updateData.username = editingUser.username.toLowerCase();
  }

  if (editingUser.newPassword) {
    updateData.password_hash = editingUser.newPassword;
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', editingUser.id);

  if (error) {
    showMessage('error', 'Failed to update user');
    return;
  }

  await supabase.from('user_locations').delete().eq('user_id', editingUser.id);
  if (editingUser.role === 'staff' && editingUser.locationIds?.length > 0) {
    const locationAssignments = editingUser.locationIds.map(locId => ({
      user_id: editingUser.id,
      location_id: locId,
      assigned_by: currentUser.id
    }));
    await supabase.from('user_locations').insert(locationAssignments);
  }

  showMessage('success', '✓ User updated!');
  setEditingUser(null);
  loadUsers();
};

const deleteUser = async (id) => {
    const confirmed = await showConfirm('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', 'Delete', 'red');
    if (!confirmed) return;
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: false, updated_by: currentUser.id })
      .eq('id', id);
    
    if (error) {
      showMessage('error', 'Failed to delete user: ' + error.message);
      return;
    }
    
    showMessage('success', '✓ User deleted');
    loadUsers();
  };
  const toggleUserLocation = (locId, isEditing = false) => {
    if (isEditing) {
      const locs = editingUser.locationIds || [];
      const newLocs = locs.includes(locId) ? locs.filter(l => l !== locId) : [...locs, locId];
      setEditingUser({ ...editingUser, locationIds: newLocs });
    } else {
      const locs = newUser.locations;
      const newLocs = locs.includes(locId) ? locs.filter(l => l !== locId) : [...locs, locId];
      setNewUser({ ...newUser, locations: newLocs });
    }
  };

const changePassword = async () => {
const confirmed = await showConfirm('Change Password', 'Are you sure you want to change your password?', 'Change', 'blue');
if (!confirmed) return;
    if (pwdForm.current !== currentUser.password_hash) {
      showMessage('error', 'Current password is incorrect');
      return;
    }
    if (pwdForm.new.length < 4) {
      showMessage('error', 'New password must be at least 4 characters');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ password_hash: pwdForm.new, updated_by: currentUser.id })
      .eq('id', currentUser.id);

    if (error) {
      showMessage('error', 'Failed to update password');
      return;
    }

    setCurrentUser({ ...currentUser, password_hash: pwdForm.new });
    setPwdForm({ current: '', new: '', confirm: '' });
    showMessage('success', '✓ Password changed successfully!');
  };
  
const changeName = async () => {
  if (!nameForm.trim()) {
    showMessage('error', 'Name cannot be empty');
    return;
  }
  const confirmed = await showConfirm('Update Name', 'Are you sure you want to update your display name?', 'Update', 'blue');
if (!confirmed) return;
  
  const { error } = await supabase
    .from('users')
    .update({ name: nameForm.trim(), updated_by: currentUser.id })
    .eq('id', currentUser.id);
  if (error) {
    showMessage('error', 'Failed to update name');
    return;
  }
  setCurrentUser({ ...currentUser, name: nameForm.trim() });
  showMessage('success', '✓ Name updated successfully!');
};
  
  const updateForm = (module, field, value) => {
    setForms(prev => ({ ...prev, [module]: { ...prev[module], [field]: value } }));
  };

  const updateFiles = (module, field, newFiles) => {
    setFiles(prev => ({ ...prev, [module]: { ...prev[module], [field]: newFiles } }));
  };

  const uploadFiles = async (recordType, recordId, filesByCategory) => {
    const uploadedFiles = [];
    console.log('Uploading files for', recordType, recordId, filesByCategory);

    for (const [category, fileList] of Object.entries(filesByCategory)) {
      for (const file of fileList) {
        if (!file.isNew || !file.file) {
          console.log('Skipping file (not new or no file object):', file.name);
          continue;
        }

        const filePath = `${recordType}/${recordId}/${category}/${Date.now()}_${file.name}`;
        console.log('Uploading to path:', filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('clinic-documents')
          .upload(filePath, file.file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          showMessage('error', `Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        console.log('Upload success, saving to documents table...');
        
        // Save file metadata to documents table
        const { data: docData, error: docError } = await supabase.from('documents').insert({
          record_type: recordType,
          record_id: recordId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          category: category,
          storage_path: filePath,
          uploaded_by: currentUser.id
        }).select().single();

        if (docError) {
          console.error('Document record error:', docError);
        } else {
          console.log('Document saved:', docData);
          uploadedFiles.push({ ...file, storage_path: filePath, id: docData.id });
        }
      }
    }

    console.log('Total files uploaded:', uploadedFiles.length);
    return uploadedFiles;
  };

const saveEntry = async (moduleId) => {
    const confirmed = await showConfirm('Submit Entry', 'Are you sure you want to submit this entry?', 'Submit', 'green');
    if (!confirmed) return;;
    setSaving(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    const form = forms[moduleId];
    const loc = locations.find(l => l.name === selectedLocation);

    if (!loc) {
      showMessage('error', 'Please select a location');
      setSaving(false);
      return;
    }

    let entryData = { location_id: loc.id, created_by: currentUser.id, updated_by: currentUser.id };

if (moduleId === 'daily-recon') {
  entryData = {
    ...entryData,
    recon_date: form.recon_date,
    cash: parseFloat(form.cash) || 0,
    credit_card: parseFloat(form.credit_card) || 0,
    checks_otc: parseFloat(form.checks_otc) || 0,
    insurance_checks: parseFloat(form.insurance_checks) || 0,
    care_credit: parseFloat(form.care_credit) || 0,
    vcc: parseFloat(form.vcc) || 0,
    efts: parseFloat(form.efts) || 0,
    deposit_cash: parseFloat(form.deposit_cash) || 0,
    deposit_credit_card: parseFloat(form.deposit_credit_card) || 0,
    deposit_checks: parseFloat(form.deposit_checks) || 0,
    deposit_insurance: parseFloat(form.deposit_insurance) || 0,
    deposit_care_credit: parseFloat(form.deposit_care_credit) || 0,
    deposit_vcc: parseFloat(form.deposit_vcc) || 0,
    deposit_efts: parseFloat(form.deposit_efts) || 0,
    notes: form.notes,
    entered_by: currentUser.name
  };
} else if (moduleId === 'billing-inquiry') {
  entryData = {
    ...entryData,
    patient_name: form.patient_name,
    chart_number: form.chart_number,
    parent_name: form.parent_name,
    date_of_request: form.date_of_request || null,
    inquiry_type: form.inquiry_type,
    description: form.description,
    amount_in_question: parseFloat(form.amount_in_question) || null,
    best_contact_method: form.best_contact_method || null,
    best_contact_time: form.best_contact_time,
    billing_team_reviewed: form.billing_team_reviewed,
    date_reviewed: form.date_reviewed || null,
    status: form.status || 'Pending',
    result: form.result
  };
} else if (moduleId === 'bills-payment') {
  entryData = {
    ...entryData,
    bill_status: form.bill_status || 'Pending',
    bill_date: form.bill_date,
    vendor: form.vendor,
    description: form.description,
    amount: parseFloat(form.amount) || 0,
    due_date: form.due_date || null,
    manager_initials: form.manager_initials,
    ap_reviewed: form.ap_reviewed,
    date_reviewed: form.date_reviewed || null,
    paid: form.paid
  };
} else if (moduleId === 'order-requests') {
  entryData = {
    ...entryData,
    date_entered: form.date_entered,
    vendor: form.vendor,
    invoice_number: form.invoice_number,
    invoice_date: form.invoice_date || null,
    due_date: form.due_date || null,
    amount: parseFloat(form.amount) || 0,
    entered_by: currentUser.name,
    notes: form.notes
  };
} else if (moduleId === 'refund-requests') {
      entryData = {
        ...entryData,
        patient_name: form.patient_name,
        chart_number: form.chart_number,
        parent_name: form.parent_name,
        rp_address: form.rp_address,
        date_of_request: form.date_of_request,
        type: form.type || null,
        description: form.description,
        amount_requested: parseFloat(form.amount_requested) || 0,
        best_contact_method: form.best_contact_method || null,
        eassist_audited: form.eassist_audited === 'Yes' ? true : form.eassist_audited === 'No' ? false : null,
        status: form.status || 'Pending'
      };
} else if (moduleId === 'it-requests') {
      entryData = {
        ...entryData,
        date_reported: form.date_reported,
        urgency: form.urgency || null,
        requester_name: form.requester_name,
        device_system: form.device_system,
        description_of_issue: form.description_of_issue,
        best_contact_method: form.best_contact_method || null,
        best_contact_time: form.best_contact_time,
        status: 'For Review'
      };
    }

    const { data: newEntry, error } = await supabase
      .from(module.table)
      .insert(entryData)
      .select()
      .single();

    if (error) {
      showMessage('error', 'Failed to save entry: ' + error.message);
      setSaving(false);
      return;
    }

    await uploadFiles(moduleId, newEntry.id, files[moduleId]);

    showMessage('success', '✓ Entry saved successfully!');

    const resetForm = { ...forms[moduleId] };
    Object.keys(resetForm).forEach(k => {
      if (!k.includes('date')) resetForm[k] = '';
    });
    setForms(prev => ({ ...prev, [moduleId]: { ...resetForm, [Object.keys(resetForm).find(k => k.includes('date'))]: today } }));
    setFiles(prev => ({
      ...prev,
      [moduleId]: Object.fromEntries(Object.entries(files[moduleId]).map(([k]) => [k, []]))
    }));

    loadModuleData(moduleId);
    setSaving(false);
  };

const updateDailyRecon = async (entryId) => {
  if (!reconForm[entryId]) return;
const confirmed = await showConfirm('Update Daily Recon', 'Are you sure you want to update this Daily Recon entry?', 'Update', 'green');
if (!confirmed) return;
  
  const form = reconForm[entryId];
  const updateData = {
    deposit_cash: parseFloat(form.deposit_cash) || 0,
    deposit_credit_card: parseFloat(form.deposit_credit_card) || 0,
    deposit_checks: parseFloat(form.deposit_checks) || 0,
    deposit_insurance: parseFloat(form.deposit_insurance) || 0,
    deposit_care_credit: parseFloat(form.deposit_care_credit) || 0,
    deposit_vcc: parseFloat(form.deposit_vcc) || 0,
    deposit_efts: parseFloat(form.deposit_efts) || 0,
    status: form.status || 'Pending',
    reviewed_by: currentUser.id,
    reviewed_at: new Date().toISOString(),
    updated_by: currentUser.id
  };

  const { error } = await supabase
    .from('daily_recon')
    .update(updateData)
    .eq('id', entryId);

  if (error) {
    showMessage('error', 'Failed to update record');
    return;
  }

  showMessage('success', '✓ Daily Recon updated!');
  setEditingRecon(null);
  setReconForm(prev => {
    const newForm = { ...prev };
    delete newForm[entryId];
    return newForm;
  });
  loadModuleData('daily-recon');
};

const startEditingRecon = (entry) => {
  setEditingRecon(entry.id);
  setReconForm(prev => ({
    ...prev,
    [entry.id]: {
      deposit_cash: entry.deposit_cash || '',
      deposit_credit_card: entry.deposit_credit_card || '',
      deposit_checks: entry.deposit_checks || '',
      deposit_insurance: entry.deposit_insurance || '',
      deposit_care_credit: entry.deposit_care_credit || '',
      deposit_vcc: entry.deposit_vcc || '',
      deposit_efts: entry.deposit_efts || '',
      status: entry.status || 'Pending'
    }
  }));
};

const updateReconForm = (entryId, field, value) => {
  setReconForm(prev => ({
    ...prev,
    [entryId]: {
      ...prev[entryId],
      [field]: value
    }
  }));
};
  
const updateEntryStatus = async (moduleId, entryId, newStatus, additionalFields = {}) => {
const confirmed = await showConfirm('Update Status', `Are you sure you want to update the status to "${newStatus}"?`, 'Update', 'blue');
if (!confirmed) return;
    const module = ALL_MODULES.find(m => m.id === moduleId);

    const updateData = {
      status: newStatus,
      updated_by: currentUser.id,
      ...additionalFields
    };

    if (moduleId === 'it-requests' && (newStatus === 'Resolved' || newStatus === 'Closed')) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = currentUser.id;
    }

    const { error } = await supabase
      .from(module.table)
      .update(updateData)
      .eq('id', entryId);

    if (error) {
      showMessage('error', 'Failed to update status');
      return;
    }

    showMessage('success', '✓ Status updated!');
    setEditingStatus(null);
    loadModuleData(moduleId);
  };

  const exportToCSV = async () => {
    const module = ALL_MODULES.find(m => m.id === exportModule);
    let query = supabase.from(module.table).select('*, locations(name)');

    if (exportLocation !== 'all') {
      const loc = locations.find(l => l.name === exportLocation);
      if (loc) query = query.eq('location_id', loc.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      showMessage('error', 'No data to export');
      return;
    }

    const headers = Object.keys(data[0]).filter(k => k !== 'locations' && k !== 'location_id');
    headers.push('location');

    const rows = data.map(row => {
      const newRow = {};
      headers.forEach(h => {
        if (h === 'location') {
          newRow[h] = row.locations?.name || '';
        } else {
          newRow[h] = row[h] ?? '';
        }
      });
      return newRow;
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportModule}_${exportLocation}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showMessage('success', '✓ Export complete!');
  };

const askAI = async () => {
  if (!chatInput.trim()) return;

  const userMessage = chatInput;
  setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setChatInput('');
  setAiLoading(true);

  try {
    // Send full user context so AI knows who is talking
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
        userContext: {
          userName: currentUser?.name || null,
          userEmail: currentUser?.email || null,
          userRole: currentUser?.role || null,
          userId: currentUser?.id || null,
          currentLocation: isAdmin ? (adminLocation || 'All Locations') : (selectedLocation || null),
          currentModule: activeModule || null,
          isLoggedIn: !!currentUser,
          isAdmin: currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin',
          isSuperAdmin: currentUser?.role === 'super_admin',
          isIT: currentUser?.role === 'it'
        }
      })
    });

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || 'Sorry, I could not process that request.';
    setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
  } catch (error) {
    console.error('AI error:', error);
    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
  }

  setAiLoading(false);
};

  const getDocumentUrl = async (storagePath) => {
    const { data } = await supabase.storage
      .from('clinic-documents')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    return data?.signedUrl;
  };

  const viewDocument = async (doc) => {
    const url = await getDocumentUrl(doc.storage_path);
    if (url) {
      setViewingFile({ ...doc, url, name: doc.file_name, type: doc.file_type });
    } else {
      showMessage('error', 'Could not load document');
    }
  };

  const downloadDocument = async (doc) => {
    const url = await getDocumentUrl(doc.storage_path);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
    } else {
      showMessage('error', 'Could not download document');
    }
  };

const deleteDocument = async (doc) => {
  const confirmed = await showConfirm('Delete Document', `Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`, 'Delete', 'red');
  if (!confirmed) return;

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('clinic-documents')
    .remove([doc.storage_path]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
  }

  // Delete from documents table
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', doc.id);

  if (dbError) {
    showMessage('error', 'Failed to delete document: ' + dbError.message);
    return;
  }

  showMessage('success', '✓ Document deleted successfully');
  loadDocuments();
};

const deleteSelectedDocuments = async (selectedDocs) => {
  if (selectedDocs.length === 0) {
    showMessage('error', 'No documents selected');
    return;
  }

  const confirmed = await showConfirm('Delete Selected Documents', `Are you sure you want to delete ${selectedDocs.length} document(s)? This action cannot be undone.`, 'Delete All', 'red');
  if (!confirmed) return;

  const passwordValid = await showPasswordConfirm('Confirm Password', `Enter your password to delete ${selectedDocs.length} document(s)`);
  if (!passwordValid) {
    if (passwordValid === false) showMessage('error', 'Incorrect password');
    return;
  }

  let successCount = 0, errorCount = 0;

  for (const doc of selectedDocs) {
    // Delete from storage
    await supabase.storage.from('clinic-documents').remove([doc.storage_path]);
    
    // Delete from database
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) errorCount++; else successCount++;
  }

  showMessage(errorCount > 0 ? 'error' : 'success', errorCount > 0 ? `Deleted ${successCount} documents. ${errorCount} failed.` : `✓ ${successCount} document(s) deleted successfully`);
  loadDocuments();
};

  const downloadSelectedDocuments = async (selectedDocs) => {
  if (selectedDocs.length === 0) {
    showMessage('error', 'No documents selected');
    return;
  }

  if (selectedDocs.length === 1) {
    // Just download single file directly
    await downloadDocument(selectedDocs[0]);
    return;
  }

  setDownloadingZip(true);
  showMessage('success', `Preparing ${selectedDocs.length} files for download...`);

  try {
    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;

    // Track filenames to handle duplicates
    const fileNameCounts = {};

    for (const doc of selectedDocs) {
      try {
        const url = await getDocumentUrl(doc.storage_path);
        if (url) {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            
            // Handle duplicate filenames
            let fileName = doc.file_name;
            if (fileNameCounts[fileName]) {
              const ext = fileName.lastIndexOf('.') > -1 ? fileName.substring(fileName.lastIndexOf('.')) : '';
              const baseName = fileName.lastIndexOf('.') > -1 ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
              fileName = `${baseName} (${fileNameCounts[fileName]})${ext}`;
              fileNameCounts[doc.file_name]++;
            } else {
              fileNameCounts[fileName] = 1;
            }
            
            zip.file(fileName, blob);
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error('Error fetching document:', doc.file_name, err);
        errorCount++;
      }
    }

    if (successCount === 0) {
      showMessage('error', 'Failed to download any documents');
      return;
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Create download link
    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `documents_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    if (errorCount > 0) {
      showMessage('success', `✓ Downloaded ${successCount} files. ${errorCount} failed.`);
    } else {
      showMessage('success', `✓ Downloaded ${successCount} files as ZIP`);
    }
} catch (err) {
    console.error('ZIP creation error:', err);
    showMessage('error', 'Failed to create ZIP file');
} finally {
    setDownloadingZip(false);
  }
};

const getModuleEntries = () => {
  let data = moduleData[activeModule] || [];
  
  // Apply search filter
  if (recordSearch.trim()) {
    const search = recordSearch.toLowerCase();
    data = data.filter(e => {
      // Search across common fields
      const searchableFields = [
        e.recon_date,
        e.patient_name,
        e.vendor,
        e.chart_number,
        e.parent_name,
        e.description,
        e.description_of_issue,
        e.invoice_number,
        e.requester_name,
        e.device_system,
        e.notes,
        e.result,
        e.locations?.name,
        e.creator?.name,
        e.status,
        e.ticket_number?.toString(),
        e.inquiry_type,
        e.type,
        e.urgency
      ];
      return searchableFields.some(field => field?.toLowerCase()?.includes(search));
    });
  }
  
  // Apply date sorting
  data = [...data].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  return data;
};

const getPaginatedEntries = () => {
  const allEntries = getModuleEntries();
  if (recordsPerPage === 'all') return allEntries;
  const startIndex = (currentPage - 1) * recordsPerPage;
  return allEntries.slice(startIndex, startIndex + recordsPerPage);
};

const getTotalPages = () => {
  const allEntries = getModuleEntries();
  if (recordsPerPage === 'all') return 1;
  return Math.ceil(allEntries.length / recordsPerPage);
};

  const startEditingStaffEntry = (entry) => {
  setEditingStaffEntry(entry.id);
  if (activeModule === 'daily-recon') {
    setStaffEditForm({
      recon_date: entry.recon_date || '',
      cash: entry.cash || '',
      credit_card: entry.credit_card || '',
      checks_otc: entry.checks_otc || '',
      insurance_checks: entry.insurance_checks || '',
      care_credit: entry.care_credit || '',
      vcc: entry.vcc || '',
      efts: entry.efts || '',
      notes: entry.notes || ''
    });
  } else if (activeModule === 'billing-inquiry') {
    setStaffEditForm({
      patient_name: entry.patient_name || '',
      chart_number: entry.chart_number || '',
      parent_name: entry.parent_name || '',
      date_of_request: entry.date_of_request || '',
      inquiry_type: entry.inquiry_type || '',
      description: entry.description || '',
      amount_in_question: entry.amount_in_question || '',
      best_contact_method: entry.best_contact_method || '',
      best_contact_time: entry.best_contact_time || ''
    });
  } else if (activeModule === 'bills-payment') {
    setStaffEditForm({
      bill_status: entry.bill_status || 'Pending',
      bill_date: entry.bill_date || '',
      vendor: entry.vendor || '',
      description: entry.description || '',
      amount: entry.amount || '',
      due_date: entry.due_date || '',
      manager_initials: entry.manager_initials || ''
    });
  } else if (activeModule === 'order-requests') {
    setStaffEditForm({
      date_entered: entry.date_entered || '',
      vendor: entry.vendor || '',
      invoice_number: entry.invoice_number || '',
      invoice_date: entry.invoice_date || '',
      due_date: entry.due_date || '',
      amount: entry.amount || '',
      notes: entry.notes || ''
    });
  } else if (activeModule === 'refund-requests') {
    setStaffEditForm({
      patient_name: entry.patient_name || '',
      chart_number: entry.chart_number || '',
      parent_name: entry.parent_name || '',
      rp_address: entry.rp_address || '',
      date_of_request: entry.date_of_request || '',
      type: entry.type || '',
      description: entry.description || '',
      amount_requested: entry.amount_requested || '',
      best_contact_method: entry.best_contact_method || ''
    });
  } else if (activeModule === 'it-requests') {
    setStaffEditForm({
      date_reported: entry.date_reported || '',
      urgency: entry.urgency || '',
      requester_name: entry.requester_name || '',
      device_system: entry.device_system || '',
      description_of_issue: entry.description_of_issue || '',
      best_contact_method: entry.best_contact_method || '',
      best_contact_time: entry.best_contact_time || ''
    });
  }
};

const updateStaffEditForm = (field, value) => {
  setStaffEditForm(prev => ({ ...prev, [field]: value }));
};

const saveStaffEntryUpdate = async () => {
  if (!editingStaffEntry) return;
 const confirmed = await showConfirm('Save Changes', 'Are you sure you want to save these changes?', 'Save', 'green');
if (!confirmed) return;;
  setSaving(true);
  
  const module = ALL_MODULES.find(m => m.id === activeModule);
  let updateData = { updated_by: currentUser.id };
  
  if (activeModule === 'daily-recon') {
    updateData = { ...updateData,
      recon_date: staffEditForm.recon_date,
      cash: parseFloat(staffEditForm.cash) || 0,
      credit_card: parseFloat(staffEditForm.credit_card) || 0,
      checks_otc: parseFloat(staffEditForm.checks_otc) || 0,
      insurance_checks: parseFloat(staffEditForm.insurance_checks) || 0,
      care_credit: parseFloat(staffEditForm.care_credit) || 0,
      vcc: parseFloat(staffEditForm.vcc) || 0,
      efts: parseFloat(staffEditForm.efts) || 0,
      notes: staffEditForm.notes
    };
  } else if (activeModule === 'billing-inquiry') {
    updateData = { ...updateData,
      patient_name: staffEditForm.patient_name,
      chart_number: staffEditForm.chart_number,
      parent_name: staffEditForm.parent_name,
      date_of_request: staffEditForm.date_of_request || null,
      inquiry_type: staffEditForm.inquiry_type,
      description: staffEditForm.description,
      amount_in_question: parseFloat(staffEditForm.amount_in_question) || null,
      best_contact_method: staffEditForm.best_contact_method || null,
      best_contact_time: staffEditForm.best_contact_time
    };
  } else if (activeModule === 'bills-payment') {
    updateData = { ...updateData,
      bill_status: staffEditForm.bill_status || 'Pending',
      bill_date: staffEditForm.bill_date,
      vendor: staffEditForm.vendor,
      description: staffEditForm.description,
      amount: parseFloat(staffEditForm.amount) || 0,
      due_date: staffEditForm.due_date || null,
      manager_initials: staffEditForm.manager_initials
    };
  } else if (activeModule === 'order-requests') {
    updateData = { ...updateData,
      date_entered: staffEditForm.date_entered,
      vendor: staffEditForm.vendor,
      invoice_number: staffEditForm.invoice_number,
      invoice_date: staffEditForm.invoice_date || null,
      due_date: staffEditForm.due_date || null,
      amount: parseFloat(staffEditForm.amount) || 0,
      notes: staffEditForm.notes
    };
  } else if (activeModule === 'refund-requests') {
    updateData = { ...updateData,
      patient_name: staffEditForm.patient_name,
      chart_number: staffEditForm.chart_number,
      parent_name: staffEditForm.parent_name,
      rp_address: staffEditForm.rp_address,
      date_of_request: staffEditForm.date_of_request,
      type: staffEditForm.type || null,
      description: staffEditForm.description,
      amount_requested: parseFloat(staffEditForm.amount_requested) || 0,
      best_contact_method: staffEditForm.best_contact_method || null
    };
  } else if (activeModule === 'it-requests') {
    updateData = { ...updateData,
      date_reported: staffEditForm.date_reported,
      urgency: staffEditForm.urgency || null,
      requester_name: staffEditForm.requester_name,
      device_system: staffEditForm.device_system,
      description_of_issue: staffEditForm.description_of_issue,
      best_contact_method: staffEditForm.best_contact_method || null,
      best_contact_time: staffEditForm.best_contact_time
    };
  }

  const { error } = await supabase.from(module.table).update(updateData).eq('id', editingStaffEntry);

  if (error) {
    showMessage('error', 'Failed to update: ' + error.message);
    setSaving(false);
    return;
  }

  showMessage('success', '✓ Entry updated!');
  setEditingStaffEntry(null);
  setStaffEditForm({});
  loadModuleData(activeModule);
  setSaving(false);
};

  const getStaffEntries = () => {
  let data = moduleData[activeModule] || [];
  
  if (staffRecordSearch.trim()) {
    const search = staffRecordSearch.toLowerCase();
    data = data.filter(e => {
      const searchableFields = [
        e.recon_date, e.patient_name, e.vendor, e.chart_number,
        e.parent_name, e.description, e.description_of_issue,
        e.invoice_number, e.requester_name, e.device_system,
        e.notes, e.result, e.status, e.ticket_number?.toString(),
        e.inquiry_type, e.type, e.urgency
      ];
      return searchableFields.some(field => field?.toLowerCase()?.includes(search));
    });
  }
  
  data = [...data].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return staffSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  return data;
};

const getStaffPaginatedEntries = () => {
  const allEntries = getStaffEntries();
  if (staffRecordsPerPage === 'all') return allEntries;
  const startIndex = (staffCurrentPage - 1) * staffRecordsPerPage;
  return allEntries.slice(startIndex, startIndex + staffRecordsPerPage);
};

const getStaffTotalPages = () => {
  const allEntries = getStaffEntries();
  if (staffRecordsPerPage === 'all') return 1;
  return Math.ceil(allEntries.length / staffRecordsPerPage);
};
  
  const currentColors = MODULE_COLORS[activeModule];
  const currentModule = ALL_MODULES.find(m => m.id === activeModule);

  const getModuleName = (moduleId) => {
    const mod = ALL_MODULES.find(m => m.id === moduleId);
    return mod?.name || moduleId;
  };

// LOGIN SCREEN
if (!currentUser) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white/20">
        <div className="text-center mb-8">
<div className="w-64 h-20 mx-auto mb-4">
            <img src="/kidshine.png" alt="KidShine Hawaii" className="w-full h-full object-contain" />
          </div>
<h1 className="text-2xl font-bold text-gray-800">CMS - KidShine Hawaii</h1>
          <p className="text-gray-500 text-sm mt-1">Clinic Management Portal</p>
        </div>

        {message.text && (
       <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
            <AlertCircle className="w-4 h-4" />
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email / Username</label>
            <input
              type="text"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white transition-all hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <input
                type={showLoginPwd ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full p-3.5 rounded-xl outline-none bg-transparent"
                placeholder="Enter password"
              />
              <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} className="px-4 text-gray-400 hover:text-gray-600">
                {showLoginPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-400'}`}
            >
              {rememberMe && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button> 
{/*SEASION ONLY FOR 30DAYS*/}
            <label 
              onClick={() => setRememberMe(!rememberMe)}
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              Stay logged in 
            </label>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
          >
            {loginLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Login →'}
          </button>
          
<p className="text-xs text-center text-gray-400">BETA Version 0.48</p>
        </div>
      </div>
    </div>
  );
}

  // LOCATION SELECTION

  if (!isAdmin && !selectedLocation && userLocations.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Welcome, {currentUser.name}!</h1>
            <p className="text-gray-500">Select your location</p>
          </div>
          <div className="space-y-2">
            {userLocations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.name)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 flex items-center gap-3 transition-all"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">{loc.name}</span>
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="w-full mt-6 py-2.5 text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  const entries = getModuleEntries();

return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex">
      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={confirmDialog.onCancel}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmDialog.confirmColor === 'red' ? 'bg-red-100' : 
                confirmDialog.confirmColor === 'green' ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                <AlertCircle className={`w-7 h-7 ${
                  confirmDialog.confirmColor === 'red' ? 'text-red-600' : 
                  confirmDialog.confirmColor === 'green' ? 'text-emerald-600' : 'text-amber-600'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">{confirmDialog.title}</h3>
              <p className="text-center text-gray-600">{confirmDialog.message}</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button 
                onClick={confirmDialog.onCancel} 
                className="flex-1 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className={`flex-1 py-4 text-white font-semibold transition-all ${
                  confirmDialog.confirmColor === 'red' ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' :
                  confirmDialog.confirmColor === 'green' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' :
                  'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

        {passwordDialog.open && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={passwordDialog.onCancel}>
    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
          <Lock className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">{passwordDialog.title}</h3>
        <p className="text-center text-gray-600 mb-4">{passwordDialog.message}</p>
        <div className="space-y-3">
          <input
            type="password"
            value={passwordDialog.password}
            onChange={e => setPasswordDialog(prev => ({ ...prev, password: e.target.value, error: '' }))}
            onKeyDown={e => e.key === 'Enter' && passwordDialog.onConfirm(passwordDialog.password)}
            placeholder="Enter your password"
            className={`w-full p-3 border-2 rounded-xl outline-none transition-all ${passwordDialog.error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400'}`}
            autoFocus
          />
          {passwordDialog.error && (
            <p className="text-sm text-red-600 text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" /> {passwordDialog.error}
            </p>
          )}
        </div>
      </div>
      <div className="flex border-t border-gray-200">
        <button onClick={passwordDialog.onCancel} className="flex-1 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={() => passwordDialog.onConfirm(passwordDialog.password)} className="flex-1 py-4 text-white font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all">Confirm Delete</button>
      </div>
    </div>
  </div>
)}
      <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />

        
<EntryPreview 
  entry={viewingEntry} 
  module={currentModule} 
  onClose={() => setViewingEntry(null)} 
  colors={currentColors} 
  onViewDocument={viewDocument}
  currentUser={currentUser}
  itUsers={itUsers}
  onUpdateStatus={(entryId, newStatus, additionalFields) => {
    updateEntryStatus('it-requests', entryId, newStatus, additionalFields);
    setViewingEntry(null);
  }}
  onDelete={async (recordId) => {
    const deleted = await deleteRecord(activeModule, recordId);
    if (deleted) setViewingEntry(null);
  }}
/>
      <FloatingChat messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={askAI} loading={aiLoading} userRole={currentUser?.role} />

      {/* Sidebar */}
<div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl flex flex-col transform transition-transform lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
<div className={`p-5 flex-shrink-0 ${currentUser?.role === 'it' ? 'bg-gradient-to-r from-cyan-600 to-teal-600' : isSuperAdmin ? 'bg-gradient-to-r from-rose-600 to-pink-600' : isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>       
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {currentUser?.role === 'it' ? <Monitor className="w-6 h-6 text-white" /> : isSuperAdmin ? <Shield className="w-6 h-6 text-white" /> : isAdmin ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
            </div>
            <div className="text-white">
              <p className="font-semibold">{currentUser.name}</p>
<p className="text-sm text-white/80">
  {isAdmin || currentUser?.role === 'it' ? formatRole(currentUser?.role) : selectedLocation}
</p>
            </div>
          </div>
        </div>

        {isAdmin && (
            <div className="p-4 border-b bg-purple-50 flex-shrink-0">
            <label className="text-xs font-medium text-purple-700 mb-1.5 block">Filter by Location</label>
            <select value={adminLocation} onChange={e => setAdminLocation(e.target.value)} className="w-full p-2.5 border-2 border-purple-200 rounded-xl text-sm focus:border-purple-400 outline-none bg-white">
              <option value="all">📍 All Locations</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        )}

        {!isAdmin && userLocations.length > 1 && (
  <div className="p-4 border-b bg-blue-50 flex-shrink-0">
            <label className="text-xs font-medium text-blue-700 mb-1.5 block">Switch Location</label>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full p-2.5 border-2 border-blue-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white">
              {userLocations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Analytics - Admin Only */}
          {isAdmin && (
            <>
              <button
                onClick={() => { setAdminView('analytics'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'analytics' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'analytics' ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <BarChart3 className={`w-4 h-4 ${adminView === 'analytics' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <span className="text-sm font-medium">Analytics</span>
              </button>
              <div className="border-t my-3"></div>
            </>
          )}
          
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Modules</p>
          {MODULES.map(m => {
            const colors = MODULE_COLORS[m.id];
            const isActive = activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'settings';
            return (
              <button
                key={m.id}
                onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? `${colors.bg} ${colors.text} ${colors.border} border-2` : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? colors.light : 'bg-gray-100'}`}>
                  <m.icon className={`w-4 h-4 ${isActive ? colors.text : 'text-gray-500'}`} />
                </div>
                <span className="text-sm font-medium">{m.name}</span>
              </button>
            );
          })}

          <div className="border-t my-4"></div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Support</p>
          {SUPPORT_MODULES.map(m => {
            const colors = MODULE_COLORS[m.id];
            const isActive = activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'settings';
            return (
              <button
                key={m.id}
                onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? `${colors.bg} ${colors.text} ${colors.border} border-2` : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? colors.light : 'bg-gray-100'}`}>
                  <m.icon className={`w-4 h-4 ${isActive ? colors.text : 'text-gray-500'}`} />
                </div>
                <span className="text-sm font-medium">{m.name}</span>
              </button>
            );
          })}

          {isAdmin && (
            <>
              <div className="border-t my-4"></div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Management</p>
              <button onClick={() => { setAdminView('documents'); loadDocuments(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'documents' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'documents' ? 'bg-purple-100' : 'bg-gray-100'}`}><FolderOpen className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Documents</span>
              </button>
              <button onClick={() => { setAdminView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'export' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'export' ? 'bg-purple-100' : 'bg-gray-100'}`}><Download className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Export</span>
              </button>
                <button onClick={() => { setAdminView('users'); loadUsers(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'users' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'users' ? 'bg-purple-100' : 'bg-gray-100'}`}><Users className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Users</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom buttons */}
        <div className="flex-shrink-0 p-4 border-t bg-gray-50">
          <button
            onClick={() => { isAdmin ? setAdminView('settings') : setView('settings'); setSidebarOpen(false); }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-xl transition-all ${(isAdmin ? adminView : view) === 'settings' ? (isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700') : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
<header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-2 min-h-[70px]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-5 h-5" /></button>
              <div>
<h1 className="font-bold text-gray-800 text-lg">
                  {isAdmin ? (adminView === 'users' ? 'User Management' : adminView === 'export' ? 'Export Data' : adminView === 'documents' ? 'All Documents' : adminView === 'settings' ? 'Settings' : adminView === 'analytics' ? 'Analytics' : currentModule?.name) : (view === 'settings' ? 'Settings' : currentModule?.name)}
                </h1>
                <p className="text-sm text-gray-500">{isAdmin ? (adminLocation === 'all' ? 'All Locations' : adminLocation) : selectedLocation}</p>
              </div>
</div>
            <div className="flex items-center gap-4">
              {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
           <img src="/kidshine.png" alt="KidShine Hawaii" className="h-14 w-44 hidden sm:block object-contain" />
            </div>
          </div>

{/* Tabs */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {isAdmin && adminView === 'records' ? (
              <button className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${currentColors?.accent} text-white shadow-lg`}>
                <FileText className="w-4 h-4" />Records
              </button>
            ) : !isAdmin && view !== 'settings' ? (
              [{ id: 'entry', label: '+ New Entry' }, { id: 'history', label: 'History' }].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === tab.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
              ))
            ) : null}
          </div>
        </header>

{/* Floating Toast Notification */}
      {message.text && (
        <div className={`fixed bottom-24 right-6 z-50 max-w-sm animate-in slide-in-from-right-5 fade-in duration-300`}>
          <div className={`p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3 ${
            message.type === 'error' 
              ? 'bg-white border-l-red-500 text-red-700 shadow-red-100' 
              : 'bg-white border-l-emerald-500 text-emerald-700 shadow-emerald-100'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'error' ? 'bg-red-100' : 'bg-emerald-100'
            }`}>
              {message.type === 'error' 
                ? <AlertCircle className="w-4 h-4 text-red-600" /> 
                : <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              }
            </div>
            <p className="font-medium text-sm">{message.text}</p>
            <button 
              onClick={() => setMessage({ type: '', text: '' })} 
              className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full pb-24 relative">
          {/* ADMIN: User Management */}
          {isAdmin && adminView === 'users' && (
            <div className="space-y-4">
<div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-700">{users.filter(u => {
                    if (!userSearch.trim()) return true;
                    const search = userSearch.toLowerCase();
                    return u.name?.toLowerCase().includes(search) || 
                           u.username?.toLowerCase().includes(search) || 
                           u.email?.toLowerCase().includes(search) ||
                           u.role?.toLowerCase().includes(search);
                  }).length} Users</h2>
                  <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />Add User
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name, username, email, or role..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 outline-none transition-all"
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {(showAddUser || editingUser) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="font-semibold mb-4 text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h3>
<div className="grid grid-cols-2 gap-4">
                    <InputField label="Name *" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                    <InputField label="Username *" value={editingUser ? (editingUser.username || '') : newUser.username} onChange={e => editingUser ? setEditingUser({...editingUser, username: e.target.value}) : setNewUser({...newUser, username: e.target.value})} placeholder="Login username" />
                    <InputField label="Email *" value={editingUser ? editingUser.email : newUser.email} onChange={e => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} />
                    <PasswordField label={editingUser ? "New Password" : "Password *"} value={editingUser ? (editingUser.newPassword || '') : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, newPassword: e.target.value}) : setNewUser({...newUser, password: e.target.value})} placeholder={editingUser ? "Leave blank to keep current" : ""} />
                    <InputField label="Role" value={editingUser ? editingUser.role : newUser.role} onChange={e => editingUser ? setEditingUser({...editingUser, role: e.target.value}) : setNewUser({...newUser, role: e.target.value})} options={isSuperAdmin ? ['staff', 'finance_admin', 'it', 'super_admin'] : ['staff', 'finance_admin']} />
                  </div>
                  {((editingUser ? editingUser.role : newUser.role) === 'staff') && (
                    <div className="mt-4">
                      <label className="text-xs font-medium text-gray-600 mb-2 block">Assigned Locations</label>
                      <div className="flex flex-wrap gap-2">
                        {locations.map(loc => (
                          <button
                            key={loc.id}
                            onClick={() => toggleUserLocation(loc.id, !!editingUser)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${(editingUser ? editingUser.locationIds : newUser.locations)?.includes(loc.id) ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-5">
                    <button onClick={editingUser ? updateUser : addUser} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                      {editingUser ? 'Update' : 'Add'} User
                    </button>
                    <button onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="px-6 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                  </div>
                </div>
              )}

<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
  <div className="divide-y">
    {users.filter(u => {
                    if (!userSearch.trim()) return true;
                    const search = userSearch.toLowerCase();
                    return u.name?.toLowerCase().includes(search) || 
                           u.username?.toLowerCase().includes(search) || 
                           u.email?.toLowerCase().includes(search) ||
                           u.role?.toLowerCase().includes(search);
                  }).map(u => (
      <div key={u.id}>
        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold ${u.role === 'super_admin' ? 'bg-gradient-to-br from-rose-500 to-pink-500' : u.role === 'it' ? 'bg-gradient-to-br from-cyan-500 to-teal-500' : u.role === 'finance_admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
              {u.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{u.name}</p>
             <p className="text-sm text-gray-500">{u.username && <span className="text-blue-600">@{u.username} • </span>}{u.email} • {formatRole(u.role)}</p>
              {u.role === 'staff' && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {u.locations?.map(loc => (
                    <span key={loc.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{loc.name}</span>
                  ))}
                </div>
              )}
{(u.role === 'finance_admin' || u.role === 'super_admin' || u.role === 'it') && (
  <span className={`text-xs font-medium ${u.role === 'it' ? 'text-cyan-600' : 'text-purple-600'}`}>All locations access</span>
)}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setViewingUserSessions(viewingUserSessions === u.id ? null : u.id);
                if (viewingUserSessions !== u.id) loadUserSessions(u.id);
              }}
              className={`p-2 rounded-lg transition-all ${viewingUserSessions === u.id ? 'text-cyan-600 bg-cyan-50' : 'text-gray-400 hover:text-cyan-600 hover:bg-cyan-50'}`}
              title="View login sessions"
            >
              <Monitor className="w-4 h-4" />
            </button>
            {u.id !== currentUser.id && (
              <>
                <button
                  onClick={() => setEditingUser({ ...u, username: u.username || '', locationIds: u.locations?.map(l => l.id) || [] })}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit user"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete user">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {viewingUserSessions === u.id && (
          <div className="px-4 pb-4">
            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-cyan-800 flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> Login Sessions for {u.name}
                </h4>
                <button onClick={() => setViewingUserSessions(null)} className="text-cyan-600 hover:text-cyan-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {loadingUserSessions ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                </div>
              ) : userSessionsData.length === 0 ? (
                <p className="text-sm text-cyan-700 text-center py-4">No login sessions recorded</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userSessionsData.map((session, idx) => (
                    <div key={session.id} className={`p-3 rounded-lg ${idx === 0 ? 'bg-emerald-100 border border-emerald-300' : 'bg-white border border-cyan-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(session.login_at).toLocaleString()}
                            {idx === 0 && <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Latest</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{session.location_info || 'Unknown device'}</p>
                        </div>
                        {session.ip_address && (
                          <span className="text-xs text-gray-400 font-mono">{session.ip_address}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    ))}
      </div>
    </div>
            </div>
          )}

{/* ADMIN: Analytics */}
{isAdmin && adminView === 'analytics' && (
  <div className="space-y-6">
    {/* Module Selector */}
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex flex-wrap items-center gap-2">
        {MODULES.map(m => {
          const colors = MODULE_COLORS[m.id];
          const isActive = analyticsModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setAnalyticsModule(m.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${isActive ? `${colors.accent} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <m.icon className="w-4 h-4" />
              {m.name}
            </button>
          );
        })}
      </div>
    </div>

    {/* Date Range & Location Filter */}
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${MODULE_COLORS[analyticsModule]?.light}`}>
            <BarChart3 className={`w-5 h-5 ${MODULE_COLORS[analyticsModule]?.text}`} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{ALL_MODULES.find(m => m.id === analyticsModule)?.name} Analytics</h2>
            <p className="text-sm text-gray-500">{adminLocation === 'all' ? 'All Locations' : adminLocation}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={adminLocation}
              onChange={e => setAdminLocation(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={analyticsRange}
              onChange={e => setAnalyticsRange(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white"
            >
              <option value="This Week">This Week</option>
              <option value="Last 2 Weeks">Last 2 Weeks</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
        </div>
      </div>
    </div>

{/* Analytics Content */}
    {(() => {
      let data = moduleData[analyticsModule] || [];
      
      // Show loading if no data yet
      if (!moduleData[analyticsModule]) {
        return (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading data...</p>
          </div>
        );
      }
      
      // Filter by location
      if (adminLocation !== 'all') {
        data = data.filter(r => r.locations?.name === adminLocation);
      }
      
      // Filter by date range
      const now = new Date();
      const filterByRange = (records) => {
        return records.filter(r => {
          const date = new Date(r.created_at);
          const diffDays = (now - date) / (1000 * 60 * 60 * 24);
          switch(analyticsRange) {
            case 'This Week': return diffDays <= 7;
            case 'Last 2 Weeks': return diffDays <= 14;
            case 'This Month': return diffDays <= 30;
            case 'Last Month': return diffDays <= 60;
            case 'This Quarter': return diffDays <= 90;
            case 'This Year': return diffDays <= 365;
            default: return true;
          }
        });
      };
      
      const filteredData = filterByRange(data);
      
      if (filteredData.length === 0) {
        return (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No data available for this period</p>
            <p className="text-gray-400 text-sm mt-1">Try selecting a different date range or location</p>
          </div>
        );
      }
      
      // Daily Recon Analytics
      if (analyticsModule === 'daily-recon') {
const totalCollected = filteredData.reduce((sum, r) => {
  return sum + 
    (parseFloat(r.cash) || 0) +
    (parseFloat(r.credit_card) || 0) +
    (parseFloat(r.checks_otc) || 0) +
    (parseFloat(r.insurance_checks) || 0) +
    (parseFloat(r.care_credit) || 0) +
    (parseFloat(r.vcc) || 0) +
    (parseFloat(r.efts) || 0);
}, 0);

const totalDeposited = filteredData.reduce((sum, r) => {
  return sum + 
    (parseFloat(r.deposit_cash) || 0) +
    (parseFloat(r.deposit_credit_card) || 0) +
    (parseFloat(r.deposit_checks) || 0) +
    (parseFloat(r.deposit_insurance) || 0) +
    (parseFloat(r.deposit_care_credit) || 0) +
    (parseFloat(r.deposit_vcc) || 0) +
    (parseFloat(r.deposit_efts) || 0);
}, 0);
        const pendingCount = filteredData.filter(r => r.status === 'Pending' || !r.status).length;
        const accountedCount = filteredData.filter(r => r.status === 'Accounted').length;
        const rejectedCount = filteredData.filter(r => r.status === 'Rejected').length;
        
        const cashTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.cash) || 0), 0);
        const creditTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.credit_card) || 0), 0);
        const checksTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.checks_otc) || 0), 0);
        const insuranceTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.insurance_checks) || 0), 0);
        const careCreditTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.care_credit) || 0), 0);
        const vccTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.vcc) || 0), 0);
        const eftsTotal = filteredData.reduce((sum, r) => sum + (parseFloat(r.efts) || 0), 0);
        
        // Group by location
        const byLocation = {};
        filteredData.forEach(r => {
          const loc = r.locations?.name || 'Unknown';
          if (!byLocation[loc]) byLocation[loc] = { collected: 0, deposited: 0, count: 0 };
          byLocation[loc].collected += parseFloat(r.total_collected) || 0;
          byLocation[loc].deposited += parseFloat(r.total_deposit) || 0;
          byLocation[loc].count += 1;
        });
        
        // Group by week
        const byWeek = {};
        filteredData.forEach(r => {
          const date = new Date(r.recon_date || r.created_at);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          if (!byWeek[weekKey]) byWeek[weekKey] = { collected: 0, deposited: 0 };
          byWeek[weekKey].collected += parseFloat(r.total_collected) || 0;
          byWeek[weekKey].deposited += parseFloat(r.total_deposit) || 0;
        });
        
        const variance = totalCollected - totalDeposited;
        
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-emerald-100 text-sm font-medium">Total Collected</p>
                <p className="text-2xl font-bold mt-1">${totalCollected.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">{filteredData.length} entries</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-blue-100 text-sm font-medium">Total Deposited</p>
                <p className="text-2xl font-bold mt-1">${totalDeposited.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-blue-200 text-xs mt-2">{accountedCount} accounted</p>
              </div>
              <div className={`bg-gradient-to-br ${variance > 0 ? 'from-amber-500 to-orange-600' : 'from-gray-500 to-gray-600'} rounded-2xl p-4 text-white shadow-lg`}>
                <p className="text-amber-100 text-sm font-medium">Variance</p>
                <p className="text-2xl font-bold mt-1 flex items-center gap-1">
                  {variance > 0 ? <TrendingUp className="w-5 h-5" /> : variance < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                  ${Math.abs(variance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
                <p className="text-amber-200 text-xs mt-2">{variance > 0 ? 'Pending deposit' : variance < 0 ? 'Over deposited' : 'Balanced'}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-purple-100 text-sm font-medium">Review Status</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-purple-200 text-sm">pending</p>
                </div>
                <p className="text-purple-200 text-xs mt-2">{rejectedCount} rejected</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-500" /> Payment Method Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cash', value: cashTotal, color: 'bg-emerald-500' },
                  { label: 'Credit Card', value: creditTotal, color: 'bg-blue-500' },
                  { label: 'Checks OTC', value: checksTotal, color: 'bg-violet-500' },
                  { label: 'Insurance', value: insuranceTotal, color: 'bg-amber-500' },
                  { label: 'Care Credit', value: careCreditTotal, color: 'bg-rose-500' },
                  { label: 'VCC', value: vccTotal, color: 'bg-cyan-500' },
                  { label: 'EFTs', value: eftsTotal, color: 'bg-indigo-500' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">${item.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{width: `${totalCollected > 0 ? (item.value / totalCollected * 100) : 0}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{totalCollected > 0 ? (item.value / totalCollected * 100).toFixed(1) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Performance */}
            {Object.keys(byLocation).length > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" /> Location Performance
                </h3>
                <div className="space-y-3">
                  {Object.entries(byLocation).sort((a, b) => b[1].collected - a[1].collected).map(([loc, stats]) => (
                    <div key={loc} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{loc}</span>
                        <span className="text-sm text-gray-500">{stats.count} entries</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Collected</p>
                          <p className="text-lg font-bold text-emerald-600">${stats.collected.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Deposited</p>
                          <p className="text-lg font-bold text-blue-600">${stats.deposited.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{width: `${totalCollected > 0 ? (stats.collected / totalCollected * 100) : 0}%`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Trend */}
            {Object.keys(byWeek).length > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Weekly Trend
                </h3>
                <div className="space-y-2">
                  {Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([week, stats]) => {
                    const maxVal = Math.max(...Object.values(byWeek).map(w => w.collected));
                    return (
                      <div key={week} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">Week of {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                          <div className="h-full bg-emerald-500 flex items-center justify-end pr-2" style={{width: `${maxVal > 0 ? (stats.collected / maxVal * 100) : 0}%`}}>
                            <span className="text-xs text-white font-medium">${(stats.collected / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Status Overview</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  {accountedCount > 0 && <div className="h-full bg-emerald-500" style={{width: `${accountedCount / filteredData.length * 100}%`}}></div>}
                  {pendingCount > 0 && <div className="h-full bg-amber-500" style={{width: `${pendingCount / filteredData.length * 100}%`}}></div>}
                  {rejectedCount > 0 && <div className="h-full bg-red-500" style={{width: `${rejectedCount / filteredData.length * 100}%`}}></div>}
                </div>
              </div>
              <div className="flex gap-6 mt-3">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-sm text-gray-600">Accounted ({accountedCount})</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-sm text-gray-600">Pending ({pendingCount})</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm text-gray-600">Rejected ({rejectedCount})</span></div>
              </div>
            </div>
          </>
        );
      }
      
      // Billing Inquiry Analytics
      if (analyticsModule === 'billing-inquiry') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount_in_question) || 0), 0);
        const avgAmount = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        const pendingCount = filteredData.filter(r => r.status === 'Pending' || !r.status).length;
        const resolvedCount = filteredData.filter(r => r.status === 'Resolved').length;
        const inProgressCount = filteredData.filter(r => r.status === 'In Progress').length;
        
        // By inquiry type
        const byType = {};
        INQUIRY_TYPES.forEach(t => byType[t] = { count: 0, amount: 0 });
        filteredData.forEach(r => {
          const type = r.inquiry_type || 'Other';
          if (!byType[type]) byType[type] = { count: 0, amount: 0 };
          byType[type].count += 1;
          byType[type].amount += parseFloat(r.amount_in_question) || 0;
        });
        
        // By location
        const byLocation = {};
        filteredData.forEach(r => {
          const loc = r.locations?.name || 'Unknown';
          if (!byLocation[loc]) byLocation[loc] = { count: 0, amount: 0 };
          byLocation[loc].count += 1;
          byLocation[loc].amount += parseFloat(r.amount_in_question) || 0;
        });
        
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-blue-100 text-sm font-medium">Total Inquiries</p>
                <p className="text-2xl font-bold mt-1">{filteredData.length}</p>
                <p className="text-blue-200 text-xs mt-2">{analyticsRange}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-emerald-100 text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold mt-1">${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">In question</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-violet-100 text-sm font-medium">Avg. Amount</p>
                <p className="text-2xl font-bold mt-1">${avgAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-violet-200 text-xs mt-2">Per inquiry</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-amber-100 text-sm font-medium">Resolution Rate</p>
                <p className="text-2xl font-bold mt-1">{filteredData.length > 0 ? ((resolvedCount / filteredData.length) * 100).toFixed(0) : 0}%</p>
                <p className="text-amber-200 text-xs mt-2">{resolvedCount} resolved</p>
              </div>
            </div>

            {/* Inquiry Type Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-500" /> Inquiry Types
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(byType).filter(([_, stats]) => stats.count > 0).map(([type, stats]) => (
                  <div key={type} className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="font-medium text-gray-800">{type}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.count}</p>
                    <p className="text-sm text-gray-500">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
                  <p className="text-sm text-gray-600 mt-1">In Progress</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{resolvedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Resolved</p>
                </div>
              </div>
            </div>

            {/* Location Breakdown */}
            {Object.keys(byLocation).length > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" /> By Location
                </h3>
                <div className="space-y-3">
                  {Object.entries(byLocation).sort((a, b) => b[1].count - a[1].count).map(([loc, stats]) => (
                    <div key={loc} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="font-medium text-gray-800">{loc}</span>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{stats.count} inquiries</p>
                        <p className="text-sm text-gray-500">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      
      // Bills Payment Analytics
      if (analyticsModule === 'bills-payment') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const paidTotal = filteredData.filter(r => r.paid === 'Yes').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const pendingTotal = filteredData.filter(r => r.paid !== 'Yes').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const paidCount = filteredData.filter(r => r.paid === 'Yes').length;
        
        // By vendor
        const byVendor = {};
        filteredData.forEach(r => {
          const vendor = r.vendor || 'Unknown';
          if (!byVendor[vendor]) byVendor[vendor] = { count: 0, amount: 0, paid: 0 };
          byVendor[vendor].count += 1;
          byVendor[vendor].amount += parseFloat(r.amount) || 0;
          if (r.paid === 'Yes') byVendor[vendor].paid += parseFloat(r.amount) || 0;
        });
        
        // Upcoming due
        const upcoming = filteredData.filter(r => {
          if (r.paid === 'Yes' || !r.due_date) return false;
          const due = new Date(r.due_date);
          const diff = (due - now) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 7;
        });
        
        const overdue = filteredData.filter(r => {
          if (r.paid === 'Yes' || !r.due_date) return false;
          const due = new Date(r.due_date);
          return due < now;
        });
        
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-violet-100 text-sm font-medium">Total Bills</p>
                <p className="text-2xl font-bold mt-1">${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-violet-200 text-xs mt-2">{filteredData.length} bills</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-emerald-100 text-sm font-medium">Paid</p>
                <p className="text-2xl font-bold mt-1">${paidTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">{paidCount} bills paid</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-amber-100 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">${pendingTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-amber-200 text-xs mt-2">{filteredData.length - paidCount} unpaid</p>
              </div>
              <div className={`bg-gradient-to-br ${overdue.length > 0 ? 'from-red-500 to-rose-600' : 'from-gray-500 to-gray-600'} rounded-2xl p-4 text-white shadow-lg`}>
                <p className="text-red-100 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{overdue.length}</p>
                <p className="text-red-200 text-xs mt-2">${overdue.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            </div>

            {/* Upcoming Bills */}
            {upcoming.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200 border-l-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Due This Week ({upcoming.length})
                </h3>
                <div className="space-y-2">
                  {upcoming.slice(0, 5).map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
                      <div>
                        <p className="font-medium text-gray-800">{bill.vendor}</p>
                        <p className="text-sm text-gray-500">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-bold text-amber-600">${parseFloat(bill.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Vendors */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" /> Top Vendors
              </h3>
              <div className="space-y-3">
                {Object.entries(byVendor).sort((a, b) => b[1].amount - a[1].amount).slice(0, 10).map(([vendor, stats]) => {
                  const maxAmount = Math.max(...Object.values(byVendor).map(v => v.amount));
                  return (
                    <div key={vendor}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800 truncate">{vendor}</span>
                        <span className="font-bold text-violet-600">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{width: `${(stats.amount / maxAmount) * 100}%`}}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{stats.count} bills • ${stats.paid.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} paid</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      }
      
      // Order Requests Analytics
      if (analyticsModule === 'order-requests') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const avgOrder = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        
        // By vendor
        const byVendor = {};
        filteredData.forEach(r => {
          const vendor = r.vendor || 'Unknown';
          if (!byVendor[vendor]) byVendor[vendor] = { count: 0, amount: 0 };
          byVendor[vendor].count += 1;
          byVendor[vendor].amount += parseFloat(r.amount) || 0;
        });
        
        // By month
        const byMonth = {};
        filteredData.forEach(r => {
          const date = new Date(r.date_entered || r.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!byMonth[monthKey]) byMonth[monthKey] = { count: 0, amount: 0 };
          byMonth[monthKey].count += 1;
          byMonth[monthKey].amount += parseFloat(r.amount) || 0;
        });
        
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-amber-100 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold mt-1">{filteredData.length}</p>
                <p className="text-amber-200 text-xs mt-2">{analyticsRange}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-emerald-100 text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold mt-1">${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">All orders</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-blue-100 text-sm font-medium">Avg. Order</p>
                <p className="text-2xl font-bold mt-1">${avgOrder.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-blue-200 text-xs mt-2">Per order</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-violet-100 text-sm font-medium">Vendors</p>
                <p className="text-2xl font-bold mt-1">{Object.keys(byVendor).length}</p>
                <p className="text-violet-200 text-xs mt-2">Unique vendors</p>
              </div>
            </div>

            {/* Vendor Spending */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" /> Vendor Spending
              </h3>
              <div className="space-y-3">
                {Object.entries(byVendor).sort((a, b) => b[1].amount - a[1].amount).slice(0, 10).map(([vendor, stats]) => {
                  const maxAmount = Math.max(...Object.values(byVendor).map(v => v.amount));
                  return (
                    <div key={vendor}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800 truncate">{vendor}</span>
                        <span className="font-bold text-amber-600">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{width: `${(stats.amount / maxAmount) * 100}%`}}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{stats.count} orders</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trend */}
            {Object.keys(byMonth).length > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" /> Monthly Trend
                </h3>
                <div className="space-y-2">
                  {Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, stats]) => {
                    const maxVal = Math.max(...Object.values(byMonth).map(m => m.amount));
                    const [year, m] = month.split('-');
                    const monthName = new Date(year, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">{monthName}</span>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                          <div className="h-full bg-amber-500 flex items-center justify-end pr-2" style={{width: `${maxVal > 0 ? (stats.amount / maxVal * 100) : 0}%`}}>
                            <span className="text-xs text-white font-medium">${(stats.amount / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{stats.count} orders</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      }
      
      // Refund Requests Analytics
      if (analyticsModule === 'refund-requests') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount_requested) || 0), 0);
        const avgRefund = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        const pendingCount = filteredData.filter(r => r.status === 'Pending' || !r.status).length;
        const approvedCount = filteredData.filter(r => r.status === 'Approved').length;
        const completedCount = filteredData.filter(r => r.status === 'Completed').length;
        const deniedCount = filteredData.filter(r => r.status === 'Denied').length;
        
        // By type
        const byType = {};
        filteredData.forEach(r => {
          const type = r.type || 'Other';
          if (!byType[type]) byType[type] = { count: 0, amount: 0 };
          byType[type].count += 1;
          byType[type].amount += parseFloat(r.amount_requested) || 0;
        });
        
        // By location
        const byLocation = {};
        filteredData.forEach(r => {
          const loc = r.locations?.name || 'Unknown';
          if (!byLocation[loc]) byLocation[loc] = { count: 0, amount: 0 };
          byLocation[loc].count += 1;
          byLocation[loc].amount += parseFloat(r.amount_requested) || 0;
        });
        
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-rose-100 text-sm font-medium">Total Requests</p>
                <p className="text-2xl font-bold mt-1">{filteredData.length}</p>
                <p className="text-rose-200 text-xs mt-2">{analyticsRange}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-emerald-100 text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold mt-1">${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">Requested</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-blue-100 text-sm font-medium">Avg. Refund</p>
                <p className="text-2xl font-bold mt-1">${avgRefund.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-blue-200 text-xs mt-2">Per request</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
                <p className="text-amber-100 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingCount}</p>
                <p className="text-amber-200 text-xs mt-2">Awaiting review</p>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-3xl font-bold text-blue-600">{approvedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Approved</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{completedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Completed</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                  <p className="text-3xl font-bold text-red-600">{deniedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Denied</p>
                </div>
              </div>
            </div>

            {/* By Type */}
            {Object.keys(byType).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-rose-500" /> By Type
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(byType).filter(([_, s]) => s.count > 0).map(([type, stats]) => (
                    <div key={type} className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="font-medium text-gray-800">{type}</p>
                      <p className="text-2xl font-bold text-rose-600 mt-1">{stats.count}</p>
                      <p className="text-sm text-gray-500">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Location */}
            {Object.keys(byLocation).length > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-500" /> By Location
                </h3>
                <div className="space-y-3">
                  {Object.entries(byLocation).sort((a, b) => b[1].amount - a[1].amount).map(([loc, stats]) => (
                    <div key={loc} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="font-medium text-gray-800">{loc}</span>
                      <div className="text-right">
                        <p className="font-bold text-rose-600">{stats.count} requests</p>
                        <p className="text-sm text-gray-500">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      
      return <p className="text-gray-500 text-center py-12">Select a module to view analytics.</p>;
    })()}
  </div>
)}

{/* ADMIN: Documents */}
{isAdmin && adminView === 'documents' && (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">All Uploaded Documents</h2>
            <p className="text-sm text-gray-500">{documents.filter(doc => {
              if (!docSearch) return true;
              const search = docSearch.toLowerCase();
              return doc.file_name?.toLowerCase().includes(search) || doc.record_type?.toLowerCase().includes(search) || doc.category?.toLowerCase().includes(search) || doc.uploader?.name?.toLowerCase().includes(search);
            }).length} files</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={docSearch}
            onChange={e => setDocSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 outline-none"
          />
        </div>
      </div>

      {/* Selection Controls */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const filteredDocs = documents.filter(doc => {
                  if (!docSearch) return true;
                  const search = docSearch.toLowerCase();
                  return doc.file_name?.toLowerCase().includes(search) || doc.record_type?.toLowerCase().includes(search) || doc.category?.toLowerCase().includes(search) || doc.uploader?.name?.toLowerCase().includes(search);
                });
                if (docSelectAll) {
                  setSelectedDocuments([]);
                  setDocSelectAll(false);
                } else {
                  setSelectedDocuments(filteredDocs);
                  setDocSelectAll(true);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${docSelectAll ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${docSelectAll ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                {docSelectAll && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              {docSelectAll ? 'Deselect All' : 'Select All'}
            </button>
            {selectedDocuments.length > 0 && (
              <span className="text-sm text-purple-600 font-medium">{selectedDocuments.length} selected</span>
            )}
          </div>
{selectedDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadSelectedDocuments(selectedDocuments)}
                disabled={downloadingZip}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {downloadingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing ZIP...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download as ZIP ({selectedDocuments.length})
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  deleteSelectedDocuments(selectedDocuments);
                  setSelectedDocuments([]);
                  setDocSelectAll(false);
                }}
                disabled={downloadingZip}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete Selected ({selectedDocuments.length})
              </button>
            </div>
          )}
        </div>
      )}

      {documents.filter(doc => {
        if (!docSearch) return true;
        const search = docSearch.toLowerCase();
        return doc.file_name?.toLowerCase().includes(search) || doc.record_type?.toLowerCase().includes(search) || doc.category?.toLowerCase().includes(search) || doc.uploader?.name?.toLowerCase().includes(search);
      }).length === 0 ? (
        <p className="text-gray-500 text-center py-8">{docSearch ? 'No documents match your search' : 'No documents uploaded yet'}</p>
      ) : (
        <div className="space-y-2">
          {documents.filter(doc => {
            if (!docSearch) return true;
            const search = docSearch.toLowerCase();
            return doc.file_name?.toLowerCase().includes(search) || doc.record_type?.toLowerCase().includes(search) || doc.category?.toLowerCase().includes(search) || doc.uploader?.name?.toLowerCase().includes(search);
          }).map(doc => {
            const isSelected = selectedDocuments.some(d => d.id === doc.id);
            return (
              <div key={doc.id} className={`p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDocuments(selectedDocuments.filter(d => d.id !== doc.id));
                          setDocSelectAll(false);
                        } else {
                          setSelectedDocuments([...selectedDocuments, doc]);
                        }
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}
                    >
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium">{getModuleName(doc.record_type)}</span>
                        <span>•</span>
                        <span>ID: {doc.record_id?.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                      {doc.uploader && <p className="text-xs text-gray-400 mt-1">Uploaded by: {doc.uploader.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-gray-500">{(doc.file_size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={() => viewDocument(doc)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}
          {/* ADMIN: Export */}
          {isAdmin && adminView === 'export' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Export Data</h2>
                  <p className="text-sm text-gray-500">Download records as CSV file</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Module</label>
                  <select value={exportModule} onChange={e => setExportModule(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none">
                    {ALL_MODULES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Location</label>
                  <select value={exportLocation} onChange={e => setExportLocation(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none">
                    <option value="all">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Date Range</label>
                  <select value={exportRange} onChange={e => setExportRange(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none">
                    {DATE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={exportToCSV} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all">
                <Download className="w-5 h-5" />Export to CSV
              </button>
            </div>
          )}

{/* Settings */}
{((isAdmin && adminView === 'settings') || (!isAdmin && view === 'settings')) && (
  <div className="space-y-6">
    {/* Last Login Info */}
    {lastLogin && (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Last Login</h3>
            <p className="text-sm text-gray-500">
              {new Date(lastLogin.login_at).toLocaleString()} • {lastLogin.location_info}
              {lastLogin.ip_address && <span className="text-gray-400"> • IP: {lastLogin.ip_address}</span>}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Name Change Section */}
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">Change Display Name</h2>
          <p className="text-sm text-gray-500">Update how your name appears in the system</p>
        </div>
      </div>
      <div className="space-y-4 max-w-sm">
        <InputField label="Display Name" value={nameForm} onChange={e => setNameForm(e.target.value)} placeholder="Enter your name" />
        <button onClick={changeName} className={`w-full py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          Update Name
        </button>
      </div>
    </div>
    
    {/* Password Change Section */}
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">Change Password</h2>
          <p className="text-sm text-gray-500">Update your account password</p>
        </div>
      </div>
      <div className="space-y-4 max-w-sm">
        <PasswordField label="Current Password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} placeholder="Enter current password" />
        <PasswordField label="New Password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} placeholder="Enter new password" />
        <PasswordField label="Confirm New Password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} placeholder="Confirm new password" />
        <button onClick={changePassword} className={`w-full py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          Update Password
        </button>
      </div>
    </div>

    {/* Login History (Admin Only) */}
    {isAdmin && loginHistory.length > 0 && (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Login History</h2>
            <p className="text-sm text-gray-500">Your recent login activity</p>
          </div>
        </div>
        <div className="space-y-2">
          {loginHistory.map((login, i) => (
            <div key={login.id} className={`p-3 rounded-xl ${i === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(login.login_at).toLocaleString()}
                    {i === 0 && <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Current</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{login.location_info}</p>
                </div>
                {login.ip_address && (
                  <span className="text-xs text-gray-400 font-mono">{login.ip_address}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Session Info */}
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Session Active</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 font-medium hover:text-red-700 hover:underline"
        >
          Sign out of all devices
        </button>
      </div>
    </div>
  </div>
)}

{/* Records View - Admin */}
{isAdmin && adminView === 'records' && (
  <div className="space-y-4">
    {/* Filters and Controls */}
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={recordSearch}
              onChange={e => { setRecordSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
            />
            {recordSearch && (
              <button onClick={() => setRecordSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Date Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Sort:</span>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        
        {/* Records Per Page */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Show:</span>
          <select
            value={recordsPerPage}
            onChange={e => { setRecordsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{getPaginatedEntries().length}</span> of <span className="font-semibold text-gray-700">{getModuleEntries().length}</span> records
          {recordSearch && <span className="text-blue-600"> (filtered)</span>}
        </p>
        <span className={`text-sm font-medium px-3 py-1 rounded-lg ${currentColors?.light} ${currentColors?.text}`}>
{currentModule?.name}
          </span>
        </div>

        {/* Mass Selection Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectAll ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectAll ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                {selectAll && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
            {selectedRecords.length > 0 && <span className="text-sm text-purple-600 font-medium">{selectedRecords.length} selected</span>}
          </div>
          {selectedRecords.length > 0 && (
            <button onClick={deleteSelectedRecords} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedRecords.length})
            </button>
          )}
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : getModuleEntries().length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{recordSearch ? 'No records match your search' : 'No entries yet'}</p>
          {recordSearch && (
            <button onClick={() => setRecordSearch('')} className="mt-2 text-blue-600 text-sm font-medium hover:underline">Clear search</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {getPaginatedEntries().map(e => {
            const docKey = `${activeModule}-${e.id}`;
            const docs = entryDocuments[docKey] || [];
            
            if (!entryDocuments[docKey]) {
              loadEntryDocuments(activeModule, e.id);
            }
            
            // Special handling for Daily Recon
            if (activeModule === 'daily-recon') {
              const isEditing = editingRecon === e.id;
              const form = reconForm[e.id] || {};
              
return (
                <div key={e.id} className={`p-4 rounded-xl border-2 ${e.status === 'Accounted' ? 'border-emerald-200 bg-emerald-50' : e.status === 'Rejected' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => toggleRecordSelection(e.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                        {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{e.recon_date}</p>
                        <StatusBadge status={e.status || 'Pending'} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {e.locations?.name} • {e.creator?.name || 'Unknown'} • {new Date(e.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => startEditingRecon(e)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" title="Review"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>

                  {/* Staff's Cash Can Data (Read Only) */}
                  <div className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Staff Daily Cash Can
                    </h4>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500">Cash:</span> <span className="font-medium">${Number(e.cash || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">Credit Card:</span> <span className="font-medium">${Number(e.credit_card || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">Checks OTC:</span> <span className="font-medium">${Number(e.checks_otc || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">Insurance:</span> <span className="font-medium">${Number(e.insurance_checks || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">Care Credit:</span> <span className="font-medium">${Number(e.care_credit || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">VCC:</span> <span className="font-medium">${Number(e.vcc || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">EFTs:</span> <span className="font-medium">${Number(e.efts || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500 font-semibold">Total:</span> <span className="font-bold text-emerald-600">${Number(e.total_collected || 0).toFixed(2)}</span></div>
                    </div>
                    {e.notes && <p className="mt-2 text-sm text-gray-600"><span className="text-gray-500">Notes:</span> {e.notes}</p>}
                  </div>

                  {/* Bank Deposit Section (Editable by Admin) */}
                  {isEditing ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Bank Deposit (Admin Entry)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Cash</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_cash || ''} onChange={ev => updateReconForm(e.id, 'deposit_cash', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Credit Card</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_credit_card || ''} onChange={ev => updateReconForm(e.id, 'deposit_credit_card', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Checks</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_checks || ''} onChange={ev => updateReconForm(e.id, 'deposit_checks', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Insurance</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_insurance || ''} onChange={ev => updateReconForm(e.id, 'deposit_insurance', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Care Credit</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_care_credit || ''} onChange={ev => updateReconForm(e.id, 'deposit_care_credit', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">VCC</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_vcc || ''} onChange={ev => updateReconForm(e.id, 'deposit_vcc', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">EFTs</label>
                          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                            <span className="pl-2 text-gray-400">$</span>
                            <input type="text" value={form.deposit_efts || ''} onChange={ev => updateReconForm(e.id, 'deposit_efts', ev.target.value)} className="w-full p-2 outline-none rounded-lg" inputMode="decimal" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Status</label>
                          <select value={form.status || 'Pending'} onChange={ev => updateReconForm(e.id, 'status', ev.target.value)} className="w-full p-2 border-2 border-gray-200 rounded-lg bg-white">
                            {RECON_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateDailyRecon(e.id)} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                          Submit Review
                        </button>
                        <button onClick={() => { setEditingRecon(null); }} className="px-4 py-2.5 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    (e.deposit_cash > 0 || e.deposit_credit_card > 0 || e.deposit_checks > 0 || e.status === 'Accounted') && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Bank Deposit (Reviewed)
                        </h4>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div><span className="text-gray-500">Cash:</span> <span className="font-medium">${Number(e.deposit_cash || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500">Credit Card:</span> <span className="font-medium">${Number(e.deposit_credit_card || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500">Checks:</span> <span className="font-medium">${Number(e.deposit_checks || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500">Insurance:</span> <span className="font-medium">${Number(e.deposit_insurance || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500">Care Credit:</span> <span className="font-medium">${Number(e.deposit_care_credit || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500">VCC:</span> <span className="font-medium">${Number(e.deposit_vcc || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500">EFTs:</span> <span className="font-medium">${Number(e.deposit_efts || 0).toFixed(2)}</span></div>
                          <div><span className="text-gray-500 font-semibold">Total:</span> <span className="font-bold text-blue-600">${Number(e.total_deposit || 0).toFixed(2)}</span></div>
                        </div>
                      </div>
                    )
                  )}

                  {/* Documents */}
                  {docs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs">
                          <File className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 max-w-24 truncate">{doc.file_name}</span>
                          <button onClick={() => viewDocument(doc)} className="p-0.5 text-blue-500 hover:bg-blue-100 rounded" title="Preview">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button onClick={() => downloadDocument(doc)} className="p-0.5 text-emerald-500 hover:bg-emerald-100 rounded" title="Download">
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

// IT Requests - clickable card
if (activeModule === 'it-requests') {
  return (
    <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button onClick={() => toggleRecordSelection(e.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
            {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </button>
          <div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-bold text-cyan-600">IT-{e.ticket_number}</span>
            <span className="text-xs text-gray-500">Status:</span>
            <StatusBadge status={e.status} />
            <span className="text-xs text-gray-500">Urgency:</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
              e.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 
              e.urgency === 'High' ? 'bg-orange-100 text-orange-700' : 
              e.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' : 
              'bg-gray-100 text-gray-600'
            }`}>{e.urgency || 'Low'}</span>
          </div>
          
          <p className="font-medium text-gray-800">{e.requester_name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {e.locations?.name} • {new Date(e.created_at).toLocaleDateString()}
          </p>
          
          {e.assigned_to && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
              <User className="w-3 h-3" /> Assigned: {e.assigned_to}
            </p>
          )}
          
          {docs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs" onClick={ev => ev.stopPropagation()}>
                  <File className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600 max-w-24 truncate">{doc.file_name}</span>
                  <button onClick={() => viewDocument(doc)} className="p-0.5 text-blue-500 hover:bg-blue-100 rounded" title="Preview">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button onClick={() => downloadDocument(doc)} className="p-0.5 text-emerald-500 hover:bg-emerald-100 rounded" title="Download">
                    <Download className="w-3 h-3" />
                  </button>
                </div>
))}
            </div>
          )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
          <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

// Default handling for other modules
            return (
              <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button onClick={() => toggleRecordSelection(e.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                      {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">
                        {e.patient_name || e.vendor || e.created_at?.split('T')[0]}
                      </p>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {e.locations?.name} • {e.creator?.name || 'Unknown'} • {new Date(e.created_at).toLocaleDateString()}
                    </p>
                    {e.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{e.description}</p>}
                    {(e.amount || e.amount_requested || e.amount_in_question) && (
                      <p className="text-lg font-bold text-emerald-600 mt-2">
                        ${Number(e.amount || e.amount_requested || e.amount_in_question || 0).toFixed(2)}
                      </p>
                    )}
                    
                    {docs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs">
                            <File className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 max-w-24 truncate">{doc.file_name}</span>
                            <button onClick={() => viewDocument(doc)} className="p-0.5 text-blue-500 hover:bg-blue-100 rounded" title="Preview">
                              <Eye className="w-3 h-3" />
                            </button>
                            <button onClick={() => downloadDocument(doc)} className="p-0.5 text-emerald-500 hover:bg-emerald-100 rounded" title="Download">
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
      
      {/* Pagination Controls */}
      {!loading && getModuleEntries().length > 0 && recordsPerPage !== 'all' && getTotalPages() > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {getTotalPages()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                let pageNum;
                if (getTotalPages() <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= getTotalPages() - 2) {
                  pageNum = getTotalPages() - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${currentPage === pageNum ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
              disabled={currentPage === getTotalPages()}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(getTotalPages())}
              disabled={currentPage === getTotalPages()}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}
          {/* Entry Form - Staff */}
          {!isAdmin && view === 'entry' && (
            <div className="space-y-4">
              {activeModule === 'daily-recon' && (
                <>
                  <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-500" />Daily Cash Can
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Date" type="date" value={forms['daily-recon'].recon_date} onChange={e => updateForm('daily-recon', 'recon_date', e.target.value)} />
                      <InputField label="Cash" prefix="$" value={forms['daily-recon'].cash} onChange={e => updateForm('daily-recon', 'cash', e.target.value)} />
                      <InputField label="Credit Card (OTC)" prefix="$" value={forms['daily-recon'].credit_card} onChange={e => updateForm('daily-recon', 'credit_card', e.target.value)} />
                      <InputField label="Checks (OTC)" prefix="$" value={forms['daily-recon'].checks_otc} onChange={e => updateForm('daily-recon', 'checks_otc', e.target.value)} />
                      <InputField label="Insurance Checks" prefix="$" value={forms['daily-recon'].insurance_checks} onChange={e => updateForm('daily-recon', 'insurance_checks', e.target.value)} />
                      <InputField label="Care Credit" prefix="$" value={forms['daily-recon'].care_credit} onChange={e => updateForm('daily-recon', 'care_credit', e.target.value)} />
                      <InputField label="VCC" prefix="$" value={forms['daily-recon'].vcc} onChange={e => updateForm('daily-recon', 'vcc', e.target.value)} />
                      <InputField label="EFTs" prefix="$" value={forms['daily-recon'].efts} onChange={e => updateForm('daily-recon', 'efts', e.target.value)} />
                    </div>
            <div className="mt-4">
  <InputField label="Notes" value={forms['daily-recon'].notes} onChange={e => updateForm('daily-recon', 'notes', e.target.value)} />
</div>
                  </div>

<div className="bg-white rounded-2xl shadow-lg p-6">
  <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
    <File className="w-5 h-5 text-amber-500" />Documents
  </h2>
  <FileUpload label="Upload Documents (EOD Sheets, Bank Receipts, etc.)" files={files['daily-recon'].documents} onFilesChange={f => updateFiles('daily-recon', 'documents', f)} onViewFile={setViewingFile} />
</div>
                </>
              )}

              {activeModule === 'it-requests' && (
                <>
                  <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                    <h2 className="font-semibold mb-2 text-gray-800">IT Request</h2>
                    <p className="text-sm text-gray-500 mb-4">Ticket # will be auto-generated</p>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Date Reported" type="date" value={forms['it-requests'].date_reported} onChange={e => updateForm('it-requests', 'date_reported', e.target.value)} />
                      <InputField label="Urgency Level" value={forms['it-requests'].urgency} onChange={e => updateForm('it-requests', 'urgency', e.target.value)} options={['Low', 'Medium', 'High', 'Critical']} />
                      <InputField label="Requester Name" value={forms['it-requests'].requester_name} onChange={e => updateForm('it-requests', 'requester_name', e.target.value)} />
                      <InputField label="Device / System" value={forms['it-requests'].device_system} onChange={e => updateForm('it-requests', 'device_system', e.target.value)} />
                      <InputField label="Contact Method" value={forms['it-requests'].best_contact_method} onChange={e => updateForm('it-requests', 'best_contact_method', e.target.value)} options={['Phone', 'Email', 'Text']} />
                      <InputField label="Contact Time" value={forms['it-requests'].best_contact_time} onChange={e => updateForm('it-requests', 'best_contact_time', e.target.value)} />
                    </div>
                    <div className="mt-4">
                      <InputField label="Description of Issue" large value={forms['it-requests'].description_of_issue} onChange={e => updateForm('it-requests', 'description_of_issue', e.target.value)} placeholder="Describe the issue in detail..." />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <FileUpload label="Screenshots / Documentation" files={files['it-requests'].documentation} onFilesChange={f => updateFiles('it-requests', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

{activeModule === 'billing-inquiry' && (
  <>
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
      <h2 className="font-semibold mb-4 text-gray-800">Patient Accounting Inquiry</h2>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Patient Name" value={forms['billing-inquiry'].patient_name} onChange={e => updateForm('billing-inquiry', 'patient_name', e.target.value)} />
        <InputField label="Chart Number" value={forms['billing-inquiry'].chart_number} onChange={e => updateForm('billing-inquiry', 'chart_number', e.target.value)} />
        <InputField label="Parent Name" value={forms['billing-inquiry'].parent_name} onChange={e => updateForm('billing-inquiry', 'parent_name', e.target.value)} />
        <InputField label="Date of Request" type="date" value={forms['billing-inquiry'].date_of_request} onChange={e => updateForm('billing-inquiry', 'date_of_request', e.target.value)} />
        <InputField label="Type of Inquiry" value={forms['billing-inquiry'].inquiry_type} onChange={e => updateForm('billing-inquiry', 'inquiry_type', e.target.value)} options={INQUIRY_TYPES} />
        <InputField label="Amount in Question" prefix="$" value={forms['billing-inquiry'].amount_in_question} onChange={e => updateForm('billing-inquiry', 'amount_in_question', e.target.value)} />
        <InputField label="Best Contact Method" value={forms['billing-inquiry'].best_contact_method} onChange={e => updateForm('billing-inquiry', 'best_contact_method', e.target.value)} options={CONTACT_METHODS} />
        <InputField label="Best Time to Contact" value={forms['billing-inquiry'].best_contact_time} onChange={e => updateForm('billing-inquiry', 'best_contact_time', e.target.value)} />
        <InputField label="Billing Team Reviewed" value={forms['billing-inquiry'].billing_team_reviewed} onChange={e => updateForm('billing-inquiry', 'billing_team_reviewed', e.target.value)} />
        <InputField label="Date Reviewed" type="date" value={forms['billing-inquiry'].date_reviewed} onChange={e => updateForm('billing-inquiry', 'date_reviewed', e.target.value)} />
        <InputField label="Status" value={forms['billing-inquiry'].status} onChange={e => updateForm('billing-inquiry', 'status', e.target.value)} options={['Pending', 'In Progress', 'Resolved']} />
        <InputField label="Result" value={forms['billing-inquiry'].result} onChange={e => updateForm('billing-inquiry', 'result', e.target.value)} />
      </div>
      <div className="mt-4">
        <InputField label="Description" large value={forms['billing-inquiry'].description} onChange={e => updateForm('billing-inquiry', 'description', e.target.value)} />
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <FileUpload label="Supporting Documentation" files={files['billing-inquiry'].documentation} onFilesChange={f => updateFiles('billing-inquiry', 'documentation', f)} onViewFile={setViewingFile} />
    </div>
  </>
)}

{activeModule === 'bills-payment' && (
  <>
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
      <h2 className="font-semibold mb-4 text-gray-800">Bills Payment Log</h2>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Bill Status" value={forms['bills-payment'].bill_status} onChange={e => updateForm('bills-payment', 'bill_status', e.target.value)} options={['Pending', 'Approved', 'Paid']} />
        <InputField label="Date" type="date" value={forms['bills-payment'].bill_date} onChange={e => updateForm('bills-payment', 'bill_date', e.target.value)} />
        <InputField label="Vendor" value={forms['bills-payment'].vendor} onChange={e => updateForm('bills-payment', 'vendor', e.target.value)} />
        <InputField label="Amount" prefix="$" value={forms['bills-payment'].amount} onChange={e => updateForm('bills-payment', 'amount', e.target.value)} />
        <InputField label="Due Date" type="date" value={forms['bills-payment'].due_date} onChange={e => updateForm('bills-payment', 'due_date', e.target.value)} />
        <InputField label="Manager Initials" value={forms['bills-payment'].manager_initials} onChange={e => updateForm('bills-payment', 'manager_initials', e.target.value)} />
        <InputField label="Accounts Payable Reviewed" value={forms['bills-payment'].ap_reviewed} onChange={e => updateForm('bills-payment', 'ap_reviewed', e.target.value)} options={['Yes', 'No']} />
        <InputField label="Date Reviewed" type="date" value={forms['bills-payment'].date_reviewed} onChange={e => updateForm('bills-payment', 'date_reviewed', e.target.value)} />
        <InputField label="Paid (Y/N)" value={forms['bills-payment'].paid} onChange={e => updateForm('bills-payment', 'paid', e.target.value)} options={['Yes', 'No']} />
      </div>
      <div className="mt-4">
        <InputField label="Description (Bill Details)" large value={forms['bills-payment'].description} onChange={e => updateForm('bills-payment', 'description', e.target.value)} />
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <FileUpload label="Bill / Invoice Documents" files={files['bills-payment'].documentation} onFilesChange={f => updateFiles('bills-payment', 'documentation', f)} onViewFile={setViewingFile} />
    </div>
  </>
)}

{activeModule === 'order-requests' && (
  <>
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
      <h2 className="font-semibold mb-4 text-gray-800">Order Invoice Log</h2>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Date Entered" type="date" value={forms['order-requests'].date_entered} onChange={e => updateForm('order-requests', 'date_entered', e.target.value)} />
        <InputField label="Vendor" value={forms['order-requests'].vendor} onChange={e => updateForm('order-requests', 'vendor', e.target.value)} />
        <InputField label="Invoice Number" value={forms['order-requests'].invoice_number} onChange={e => updateForm('order-requests', 'invoice_number', e.target.value)} />
        <InputField label="Invoice Date" type="date" value={forms['order-requests'].invoice_date} onChange={e => updateForm('order-requests', 'invoice_date', e.target.value)} />
        <InputField label="Due Date" type="date" value={forms['order-requests'].due_date} onChange={e => updateForm('order-requests', 'due_date', e.target.value)} />
        <InputField label="Amount" prefix="$" value={forms['order-requests'].amount} onChange={e => updateForm('order-requests', 'amount', e.target.value)} />
      </div>
      <div className="mt-4">
        <InputField label="Notes" large value={forms['order-requests'].notes} onChange={e => updateForm('order-requests', 'notes', e.target.value)} />
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <FileUpload label="Order Invoices / POs" files={files['order-requests'].orderInvoices} onFilesChange={f => updateFiles('order-requests', 'orderInvoices', f)} onViewFile={setViewingFile} />
    </div>
  </>
)}

 {activeModule === 'refund-requests' && (
  <>
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
      <h2 className="font-semibold mb-4 text-gray-800">Patient Refund Request Log</h2>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Patient Name" value={forms['refund-requests'].patient_name} onChange={e => updateForm('refund-requests', 'patient_name', e.target.value)} />
        <InputField label="Chart Number" value={forms['refund-requests'].chart_number} onChange={e => updateForm('refund-requests', 'chart_number', e.target.value)} />
        <InputField label="Parent Name" value={forms['refund-requests'].parent_name} onChange={e => updateForm('refund-requests', 'parent_name', e.target.value)} />
        <InputField label="RP Address" value={forms['refund-requests'].rp_address} onChange={e => updateForm('refund-requests', 'rp_address', e.target.value)} />
        <InputField label="Date of Request" type="date" value={forms['refund-requests'].date_of_request} onChange={e => updateForm('refund-requests', 'date_of_request', e.target.value)} />
        <InputField label="Type Transaction" value={forms['refund-requests'].type} onChange={e => updateForm('refund-requests', 'type', e.target.value)} options={REFUND_TYPES} />
        <InputField label="Amount Requested" prefix="$" value={forms['refund-requests'].amount_requested} onChange={e => updateForm('refund-requests', 'amount_requested', e.target.value)} />
        <InputField label="Best Contact Method" value={forms['refund-requests'].best_contact_method} onChange={e => updateForm('refund-requests', 'best_contact_method', e.target.value)} options={CONTACT_METHODS} />
        <InputField label="eAssist Audited" value={forms['refund-requests'].eassist_audited} onChange={e => updateForm('refund-requests', 'eassist_audited', e.target.value)} options={['Yes', 'No', 'N/A']} />
        <InputField label="Status" value={forms['refund-requests'].status} onChange={e => updateForm('refund-requests', 'status', e.target.value)} options={['Pending', 'Approved', 'Completed', 'Denied']} />
      </div>
      <div className="mt-4">
        <InputField label="Description" large value={forms['refund-requests'].description} onChange={e => updateForm('refund-requests', 'description', e.target.value)} />
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <FileUpload label="Supporting Documentation" files={files['refund-requests'].documentation} onFilesChange={f => updateFiles('refund-requests', 'documentation', f)} onViewFile={setViewingFile} />
    </div>
  </>
)}

              <button
                onClick={() => saveEntry(activeModule)}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Entry'}
              </button>
            </div>
          )}

{/* History View - Staff */}
{!isAdmin && view === 'history' && (
  <div className="space-y-4">
    {/* Sorting Controls */}
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={staffRecordSearch}
              onChange={e => { setStaffRecordSearch(e.target.value); setStaffCurrentPage(1); }}
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
            />
            {staffRecordSearch && (
              <button onClick={() => setStaffRecordSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Sort:</span>
          <select
            value={staffSortOrder}
            onChange={e => setStaffSortOrder(e.target.value)}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Show:</span>
          <select
            value={staffRecordsPerPage}
            onChange={e => { setStaffRecordsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setStaffCurrentPage(1); }}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{getStaffPaginatedEntries().length}</span> of <span className="font-semibold text-gray-700">{getStaffEntries().length}</span> records
          {staffRecordSearch && <span className="text-blue-600"> (filtered)</span>}
        </p>
        <span className={`text-sm font-medium px-3 py-1 rounded-lg ${currentColors?.light} ${currentColors?.text}`}>
          {currentModule?.name}
        </span>
      </div>
    </div>

    {/* Records List */}
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="font-semibold mb-4 text-gray-800">Your Entries</h2>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : getStaffEntries().length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{staffRecordSearch ? 'No records match your search' : 'No entries yet'}</p>
          {staffRecordSearch && (
            <button onClick={() => setStaffRecordSearch('')} className="mt-2 text-blue-600 text-sm font-medium hover:underline">Clear search</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {getStaffPaginatedEntries().map(e => {
            const canEdit = canEditRecord(e.created_at);
            const isEditing = editingStaffEntry === e.id;
            const docKey = `${activeModule}-${e.id}`;
            const docs = entryDocuments[docKey] || [];
            
            if (!entryDocuments[docKey]) {
              loadEntryDocuments(activeModule, e.id);
            }

            let bgClass = `${currentColors?.bg} border ${currentColors?.border}`;
            if (activeModule === 'daily-recon') {
              if (e.status === 'Accounted') bgClass = 'bg-emerald-50 border-2 border-emerald-300';
              else if (e.status === 'Rejected') bgClass = 'bg-red-50 border-2 border-red-300';
              else bgClass = 'bg-amber-50 border-2 border-amber-300';
            }
            
            return (
              <div key={e.id} className={`p-4 rounded-xl ${bgClass}`}>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Edit3 className="w-4 h-4" /> Edit Entry
                      </h4>
                      <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {activeModule === 'daily-recon' && (
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Date" type="date" value={staffEditForm.recon_date} onChange={ev => updateStaffEditForm('recon_date', ev.target.value)} />
                        <InputField label="Cash" prefix="$" value={staffEditForm.cash} onChange={ev => updateStaffEditForm('cash', ev.target.value)} />
                        <InputField label="Credit Card" prefix="$" value={staffEditForm.credit_card} onChange={ev => updateStaffEditForm('credit_card', ev.target.value)} />
                        <InputField label="Checks OTC" prefix="$" value={staffEditForm.checks_otc} onChange={ev => updateStaffEditForm('checks_otc', ev.target.value)} />
                        <InputField label="Insurance Checks" prefix="$" value={staffEditForm.insurance_checks} onChange={ev => updateStaffEditForm('insurance_checks', ev.target.value)} />
                        <InputField label="Care Credit" prefix="$" value={staffEditForm.care_credit} onChange={ev => updateStaffEditForm('care_credit', ev.target.value)} />
                        <InputField label="VCC" prefix="$" value={staffEditForm.vcc} onChange={ev => updateStaffEditForm('vcc', ev.target.value)} />
                        <InputField label="EFTs" prefix="$" value={staffEditForm.efts} onChange={ev => updateStaffEditForm('efts', ev.target.value)} />
                        <div className="col-span-2">
                          <InputField label="Notes" value={staffEditForm.notes} onChange={ev => updateStaffEditForm('notes', ev.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    {activeModule === 'billing-inquiry' && (
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Patient Name" value={staffEditForm.patient_name} onChange={ev => updateStaffEditForm('patient_name', ev.target.value)} />
                        <InputField label="Chart Number" value={staffEditForm.chart_number} onChange={ev => updateStaffEditForm('chart_number', ev.target.value)} />
                        <InputField label="Parent Name" value={staffEditForm.parent_name} onChange={ev => updateStaffEditForm('parent_name', ev.target.value)} />
                        <InputField label="Date of Request" type="date" value={staffEditForm.date_of_request} onChange={ev => updateStaffEditForm('date_of_request', ev.target.value)} />
                        <InputField label="Type of Inquiry" value={staffEditForm.inquiry_type} onChange={ev => updateStaffEditForm('inquiry_type', ev.target.value)} options={INQUIRY_TYPES} />
                        <InputField label="Amount in Question" prefix="$" value={staffEditForm.amount_in_question} onChange={ev => updateStaffEditForm('amount_in_question', ev.target.value)} />
                        <InputField label="Contact Method" value={staffEditForm.best_contact_method} onChange={ev => updateStaffEditForm('best_contact_method', ev.target.value)} options={CONTACT_METHODS} />
                        <InputField label="Best Time to Contact" value={staffEditForm.best_contact_time} onChange={ev => updateStaffEditForm('best_contact_time', ev.target.value)} />
                        <div className="col-span-2">
                          <InputField label="Description" large value={staffEditForm.description} onChange={ev => updateStaffEditForm('description', ev.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    {activeModule === 'bills-payment' && (
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Bill Status" value={staffEditForm.bill_status} onChange={ev => updateStaffEditForm('bill_status', ev.target.value)} options={['Pending', 'Approved', 'Paid']} />
                        <InputField label="Date" type="date" value={staffEditForm.bill_date} onChange={ev => updateStaffEditForm('bill_date', ev.target.value)} />
                        <InputField label="Vendor" value={staffEditForm.vendor} onChange={ev => updateStaffEditForm('vendor', ev.target.value)} />
                        <InputField label="Amount" prefix="$" value={staffEditForm.amount} onChange={ev => updateStaffEditForm('amount', ev.target.value)} />
                        <InputField label="Due Date" type="date" value={staffEditForm.due_date} onChange={ev => updateStaffEditForm('due_date', ev.target.value)} />
                        <InputField label="Manager Initials" value={staffEditForm.manager_initials} onChange={ev => updateStaffEditForm('manager_initials', ev.target.value)} />
                        <div className="col-span-2">
                          <InputField label="Description" large value={staffEditForm.description} onChange={ev => updateStaffEditForm('description', ev.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    {activeModule === 'order-requests' && (
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Date Entered" type="date" value={staffEditForm.date_entered} onChange={ev => updateStaffEditForm('date_entered', ev.target.value)} />
                        <InputField label="Vendor" value={staffEditForm.vendor} onChange={ev => updateStaffEditForm('vendor', ev.target.value)} />
                        <InputField label="Invoice Number" value={staffEditForm.invoice_number} onChange={ev => updateStaffEditForm('invoice_number', ev.target.value)} />
                        <InputField label="Invoice Date" type="date" value={staffEditForm.invoice_date} onChange={ev => updateStaffEditForm('invoice_date', ev.target.value)} />
                        <InputField label="Due Date" type="date" value={staffEditForm.due_date} onChange={ev => updateStaffEditForm('due_date', ev.target.value)} />
                        <InputField label="Amount" prefix="$" value={staffEditForm.amount} onChange={ev => updateStaffEditForm('amount', ev.target.value)} />
                        <div className="col-span-2">
                          <InputField label="Notes" large value={staffEditForm.notes} onChange={ev => updateStaffEditForm('notes', ev.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    {activeModule === 'refund-requests' && (
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Patient Name" value={staffEditForm.patient_name} onChange={ev => updateStaffEditForm('patient_name', ev.target.value)} />
                        <InputField label="Chart Number" value={staffEditForm.chart_number} onChange={ev => updateStaffEditForm('chart_number', ev.target.value)} />
                        <InputField label="Parent Name" value={staffEditForm.parent_name} onChange={ev => updateStaffEditForm('parent_name', ev.target.value)} />
                        <InputField label="RP Address" value={staffEditForm.rp_address} onChange={ev => updateStaffEditForm('rp_address', ev.target.value)} />
                        <InputField label="Date of Request" type="date" value={staffEditForm.date_of_request} onChange={ev => updateStaffEditForm('date_of_request', ev.target.value)} />
                        <InputField label="Type" value={staffEditForm.type} onChange={ev => updateStaffEditForm('type', ev.target.value)} options={REFUND_TYPES} />
                        <InputField label="Amount Requested" prefix="$" value={staffEditForm.amount_requested} onChange={ev => updateStaffEditForm('amount_requested', ev.target.value)} />
                        <InputField label="Contact Method" value={staffEditForm.best_contact_method} onChange={ev => updateStaffEditForm('best_contact_method', ev.target.value)} options={CONTACT_METHODS} />
                        <div className="col-span-2">
                          <InputField label="Description" large value={staffEditForm.description} onChange={ev => updateStaffEditForm('description', ev.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    {activeModule === 'it-requests' && (
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Date Reported" type="date" value={staffEditForm.date_reported} onChange={ev => updateStaffEditForm('date_reported', ev.target.value)} />
                        <InputField label="Urgency" value={staffEditForm.urgency} onChange={ev => updateStaffEditForm('urgency', ev.target.value)} options={['Low', 'Medium', 'High', 'Critical']} />
                        <InputField label="Requester Name" value={staffEditForm.requester_name} onChange={ev => updateStaffEditForm('requester_name', ev.target.value)} />
                        <InputField label="Device/System" value={staffEditForm.device_system} onChange={ev => updateStaffEditForm('device_system', ev.target.value)} />
                        <InputField label="Contact Method" value={staffEditForm.best_contact_method} onChange={ev => updateStaffEditForm('best_contact_method', ev.target.value)} options={['Phone', 'Email', 'Text']} />
                        <InputField label="Best Contact Time" value={staffEditForm.best_contact_time} onChange={ev => updateStaffEditForm('best_contact_time', ev.target.value)} />
                        <div className="col-span-2">
                          <InputField label="Description of Issue" large value={staffEditForm.description_of_issue} onChange={ev => updateStaffEditForm('description_of_issue', ev.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <button onClick={saveStaffEntryUpdate} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                      </button>
                      <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className="px-4 py-2.5 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">
                          {e.ticket_number ? `IT-${e.ticket_number}` : e.patient_name || e.vendor || e.recon_date || new Date(e.created_at).toLocaleDateString()}
                        </p>
                        <StatusBadge status={e.status || (activeModule === 'daily-recon' ? 'Pending' : e.status)} />
                        {!canEdit && <Lock className="w-4 h-4 text-gray-400" title="Locked (past Friday cutoff)" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{new Date(e.created_at).toLocaleDateString()}</p>
                      
                      {activeModule === 'daily-recon' && e.total_collected && (
                        <p className="text-lg font-bold text-emerald-600 mt-2">${Number(e.total_collected).toFixed(2)}</p>
                      )}
                      
                      {activeModule !== 'daily-recon' && (e.amount || e.amount_requested || e.amount_in_question) && (
                        <p className="text-lg font-bold text-emerald-600 mt-2">${Number(e.amount || e.amount_requested || e.amount_in_question).toFixed(2)}</p>
                      )}
                      
                      {docs.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-gray-500">Attached Files:</p>
                          {docs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-2 text-sm">
                              <File className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 truncate">{doc.file_name}</span>
                              <button onClick={() => viewDocument(doc)} className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors" title="Preview">
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
<div className="flex items-center gap-1">
                      <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                      {canEdit && (
                        <button onClick={() => startEditingStaffEntry(e)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && getStaffEntries().length > 0 && staffRecordsPerPage !== 'all' && getStaffTotalPages() > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Page {staffCurrentPage} of {getStaffTotalPages()}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setStaffCurrentPage(1)} disabled={staffCurrentPage === 1} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
            <button onClick={() => setStaffCurrentPage(p => Math.max(p - 1, 1))} disabled={staffCurrentPage === 1} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <span className="px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">{staffCurrentPage}</span>
            <button onClick={() => setStaffCurrentPage(p => Math.min(p + 1, getStaffTotalPages()))} disabled={staffCurrentPage === getStaffTotalPages()} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            <button onClick={() => setStaffCurrentPage(getStaffTotalPages())} disabled={staffCurrentPage === getStaffTotalPages()} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

</main>
      </div>

{sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
{/* Version Footer */}
      <div className="fixed bottom-6 left-4 lg:left-[310px] z-[25] pointer-events-none">
        <p className="text-xs text-gray-400 opacity-70">CMS v0.46</p>
      </div>
    </div>
  );
}
