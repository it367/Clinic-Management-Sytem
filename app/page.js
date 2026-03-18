//Clinic Management System v0.87
// Devoloper: Mark Murillo
// Company: Kidshine Hawaii

'use client';
import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { DollarSign, FileText, Building2, Bot, Send, Loader2, LogOut, User, Upload, X, File, Shield, Receipt, CreditCard, Package, RefreshCw, Monitor, Menu, Eye, EyeOff, FolderOpen, Edit3, Users, Plus, Trash2, Lock, Download, Settings, MessageCircle, Sparkles, AlertCircle, Maximize2, Minimize2, Headphones, Search, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, ClipboardList, Paperclip, CheckCircle, Circle, BookOpen } from 'lucide-react';
import { MODULE_COLORS, STATUS_COLORS, ROLE_STYLES, BTN, CARD, INPUT, LAYOUT, ANALYTICS_CARDS, ICON_BOX, URGENCY_COLORS, CONFIRM_COLORS, FILE_UPLOAD, CHECKBOX } from './styles';
const CHECKLIST_MODULES = [
  { id: 'daily-recon', name: 'Daily Reconciliation', icon: DollarSign, color: 'emerald', table: 'daily_recon' },
  { id: 'completed-procedure', name: 'Completed Procedure', icon: ClipboardList, color: 'teal', table: 'completed_procedures' },
  { id: 'claims-documents', name: 'Claims & Documents', icon: Paperclip, color: 'sky', table: 'claims_documents' },
];

const MODULES = [
  { id: 'billing-inquiry', name: 'Billing Inquiry', icon: Receipt, color: 'blue', table: 'billing_inquiries' },
  { id: 'bills-payment', name: 'Bills Payment', icon: CreditCard, color: 'violet', table: 'bills_payment' },
  { id: 'order-requests', name: 'Order Requests', icon: Package, color: 'amber', table: 'order_requests' },
  { id: 'refund-requests', name: 'Refund Requests', icon: RefreshCw, color: 'rose', table: 'refund_requests' },
];

const SUPPORT_MODULES = [
  { id: 'it-requests', name: 'IT Requests', icon: Monitor, color: 'cyan', table: 'it_requests' },
];

const ALL_MODULES = [...CHECKLIST_MODULES, ...MODULES, ...SUPPORT_MODULES];

// MODULE_COLORS imported from styles

const IT_STATUSES = ['For Review', 'In Progress', 'On-hold', 'Resolved'];
const INQUIRY_TYPES = ['Claim', 'Referral', 'Patient Balance'];
const REFUND_TYPES = ['Refund', 'Credit', 'Adjustment'];
const CONTACT_METHODS = ['Phone', 'Email', 'Text'];
const DATE_RANGES = ['This Week', 'Last 2 Weeks', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Custom'];
const RECON_STATUSES = ['Pending', 'Accounted', 'Rejected'];

// MODULE_FIELD_CONFIG: maps moduleId -> fields used in saveEntry / startEditingStaffEntry / saveStaffEntryUpdate
const MODULE_FIELD_CONFIG = {
  'billing-inquiry': {
    getEntryData: (form, user) => ({
      patient_name: form.patient_name, chart_number: form.chart_number, parent_name: form.parent_name,
      date_of_request: form.date_of_request || null, inquiry_type: form.inquiry_type,
      description: form.description,
      best_contact_method: form.best_contact_method || null, best_contact_time: form.best_contact_time,
      billing_team_reviewed: form.billing_team_reviewed, date_reviewed: form.date_reviewed || null,
      status: form.status || 'Pending', result: form.result
    }),
    getEditInitial: (entry) => ({
      patient_name: entry.patient_name || '', chart_number: entry.chart_number || '',
      parent_name: entry.parent_name || '', date_of_request: entry.date_of_request || '',
      inquiry_type: entry.inquiry_type || '', description: entry.description || '',
      best_contact_method: entry.best_contact_method || '',
      best_contact_time: entry.best_contact_time || ''
    }),
    getUpdateData: (f) => ({
      patient_name: f.patient_name, chart_number: f.chart_number, parent_name: f.parent_name,
      date_of_request: f.date_of_request || null, inquiry_type: f.inquiry_type, description: f.description,
      best_contact_method: f.best_contact_method || null, best_contact_time: f.best_contact_time
    })
  },
  'bills-payment': {
    getEntryData: (form) => ({
      transaction_id: form.transaction_id || null, bill_date: form.bill_date, vendor: form.vendor,
      description: form.description, amount: parseFloat(form.amount) || 0,
      due_date: form.due_date || null,
      paid: form.paid === 'Yes' ? true : form.paid === 'No' ? false : null, status: 'For Review'
    }),
    getEditInitial: (entry) => ({
      transaction_id: entry.transaction_id || '', bill_date: entry.bill_date || '',
      vendor: entry.vendor || '', description: entry.description || '',
      amount: entry.amount || '', due_date: entry.due_date || '',
      paid: entry.paid === true ? 'Yes' : entry.paid === false ? 'No' : ''
    }),
    getUpdateData: (f) => ({
      transaction_id: f.transaction_id || null, bill_date: f.bill_date, vendor: f.vendor,
      description: f.description, amount: parseFloat(f.amount) || 0,
      due_date: f.due_date || null,
      paid: f.paid === 'Yes' ? true : f.paid === 'No' ? false : null
    })
  },
  'order-requests': {
    getEntryData: (form, user) => ({
      date_entered: form.date_entered, vendor: form.vendor, invoice_number: form.invoice_number,
      invoice_date: form.invoice_date || null, due_date: form.due_date || null,
      amount: parseFloat(form.amount) || 0, entered_by: user.name, notes: form.notes
    }),
    getEditInitial: (entry) => ({
      date_entered: entry.date_entered || '', vendor: entry.vendor || '',
      invoice_number: entry.invoice_number || '', invoice_date: entry.invoice_date || '',
      due_date: entry.due_date || '', amount: entry.amount || '', notes: entry.notes || ''
    }),
    getUpdateData: (f) => ({
      date_entered: f.date_entered, vendor: f.vendor, invoice_number: f.invoice_number,
      invoice_date: f.invoice_date || null, due_date: f.due_date || null,
      amount: parseFloat(f.amount) || 0, notes: f.notes
    })
  },
  'refund-requests': {
    getEntryData: (form) => ({
      patient_name: form.patient_name, chart_number: form.chart_number, parent_name: form.parent_name,
      rp_address: form.rp_address, date_of_request: form.date_of_request,
      type: form.type || null, description: form.description,
      amount_requested: parseFloat(form.amount_requested) || 0,
      best_contact_method: form.best_contact_method || null, contact_info: form.contact_info || null,
      eassist_audited: form.eassist_audited === 'Yes' ? true : form.eassist_audited === 'No' ? false : null,
      status: 'Pending'
    }),
    getEditInitial: (entry) => ({
      patient_name: entry.patient_name || '', chart_number: entry.chart_number || '',
      parent_name: entry.parent_name || '', rp_address: entry.rp_address || '',
      date_of_request: entry.date_of_request || '', type: entry.type || '',
      description: entry.description || '', amount_requested: entry.amount_requested || '',
      best_contact_method: entry.best_contact_method || '', contact_info: entry.contact_info || ''
    }),
    getUpdateData: (f) => ({
      patient_name: f.patient_name, chart_number: f.chart_number, parent_name: f.parent_name,
      rp_address: f.rp_address, date_of_request: f.date_of_request,
      type: f.type || null, description: f.description,
      amount_requested: parseFloat(f.amount_requested) || 0,
      best_contact_method: f.best_contact_method || null, contact_info: f.contact_info || null
    })
  },
  'completed-procedure': {
    getEntryData: (form, user) => ({ checked_by: form.checked_by || user.name, notes: form.notes, status: 'Pending' }),
    getEditInitial: (entry) => ({ checked_by: entry.checked_by || '', notes: entry.notes || '' }),
    getUpdateData: (f) => ({ checked_by: f.checked_by, notes: f.notes })
  },
  'claims-documents': {
    getEntryData: (form, user) => ({ checked_by: form.checked_by || user.name, notes: form.notes, status: 'Pending' }),
    getEditInitial: (entry) => ({ checked_by: entry.checked_by || '', notes: entry.notes || '' }),
    getUpdateData: (f) => ({ checked_by: f.checked_by, notes: f.notes })
  },
  'it-requests': {
    getEntryData: (form) => ({
      date_reported: form.date_reported, urgency: form.urgency || null,
      requester_name: form.requester_name, device_system: form.device_system,
      description_of_issue: form.description_of_issue,
      best_contact_method: form.best_contact_method || null,
      best_contact_time: form.best_contact_time, status: 'For Review'
    }),
    getEditInitial: (entry) => ({
      date_reported: entry.date_reported || '', urgency: entry.urgency || '',
      requester_name: entry.requester_name || '', device_system: entry.device_system || '',
      description_of_issue: entry.description_of_issue || '',
      best_contact_method: entry.best_contact_method || '', best_contact_time: entry.best_contact_time || ''
    }),
    getUpdateData: (f) => ({
      date_reported: f.date_reported, urgency: f.urgency || null,
      requester_name: f.requester_name, device_system: f.device_system,
      description_of_issue: f.description_of_issue,
      best_contact_method: f.best_contact_method || null, best_contact_time: f.best_contact_time
    })
  }
};

// Config for EntryPreview: module-specific preview fields, edit forms, and admin edit sections
const ENTRY_PREVIEW_CONFIG = {
  'billing-inquiry': {
    previewFields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'Date of Request', key: 'date_of_request', format: 'date' },
      { label: 'Inquiry Type', key: 'inquiry_type' },
      { label: 'Contact Method', key: 'best_contact_method' }, { label: 'Best Time to Contact', key: 'best_contact_time' },
      { label: 'Description', key: 'description', colSpan: 2, isBlock: true }
    ],
    reviewReadOnly: { show: (e) => e.billing_team_reviewed || e.date_reviewed || e.result, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800', title: 'Review Details',
      fields: [{ label: 'Reviewed By', key: 'billing_team_reviewed' }, { label: 'Date Reviewed', key: 'date_reviewed', format: 'date' }, { label: 'Result', key: 'result', colSpan: 2 }] },
    adminEdit: { btnGradient: 'from-blue-500 to-indigo-500', btnLabel: 'Review & Update Status', editBg: 'bg-blue-50', editBorder: 'border-blue-200', editTextColor: 'text-blue-800', editTitle: 'Review Billing Inquiry', focusColor: 'focus:border-blue-400',
      statuses: ['Pending', 'In Progress', 'Resolved'], formKey: 'billing', saveHandler: 'handleBillingSave',
      fields: [
        { type: 'select', label: 'Status', key: 'status' },
        { type: 'reviewerSelect', label: 'Reviewed By', key: 'billing_team_reviewed' },
        { type: 'date', label: 'Date Reviewed', key: 'date_reviewed' }
      ],
      extraFields: [{ type: 'textarea', label: 'Result', key: 'result', placeholder: 'Enter review result or notes...' }]
    }
  },
  'bills-payment': {
    header: (e) => e.transaction_id ? { icon: CreditCard, iconColor: 'text-violet-600', bgColor: 'bg-violet-100', borderColor: 'border-violet-200', labelColor: 'text-violet-600', valueColor: 'text-violet-700', label: 'Transaction ID:', value: e.transaction_id } : null,
    previewFields: [
      { label: 'Bill Date', key: 'bill_date', format: 'date' }, { label: 'Vendor', key: 'vendor' },
      { label: 'Amount', key: 'amount', format: 'currency', colorClass: 'text-emerald-600' }, { label: 'Due Date', key: 'due_date', format: 'date' },
      { label: 'Description', key: 'description', colSpan: 2, isBlock: true }
    ],
    reviewReadOnly: { show: (e) => e.ap_reviewed || e.date_reviewed || e.paid !== null, bgColor: 'bg-violet-50', borderColor: 'border-violet-200', textColor: 'text-violet-800', title: 'AP Review Details',
      fields: [{ label: 'Reviewed By', key: 'ap_reviewed' }, { label: 'Date Reviewed', key: 'date_reviewed', format: 'date' },
        { label: 'Paid', key: 'paid', customRender: (e) => <span className={`font-medium ${e.paid === true ? 'text-emerald-600' : e.paid === false ? 'text-red-600' : ''}`}>{e.paid === true ? 'Yes' : e.paid === false ? 'No' : '-'}</span> },
        { label: 'Status', key: 'status', customRender: (e) => <StatusBadge status={e.status} /> }] },
    adminEdit: { btnGradient: 'from-violet-500 to-purple-500', btnLabel: 'Review & Update Payment', editBg: 'bg-violet-50', editBorder: 'border-violet-200', editTextColor: 'text-violet-800', editTitle: 'Review Bills Payment', focusColor: 'focus:border-violet-400',
      statuses: ['For Review', 'Pending', 'Reviewed'], formKey: 'billing', saveHandler: 'handleBillsPaymentSave',
      fields: [
        { type: 'select', label: 'Status', key: 'status' },
        { type: 'reviewerSelect', label: 'Reviewed By', key: 'billing_team_reviewed' },
        { type: 'date', label: 'Date Reviewed', key: 'date_reviewed' },
        { type: 'paidSelect', label: 'Paid', key: 'paid' }
      ]
    }
  },
  'order-requests': {
    previewFields: [
      { label: 'Date Entered', key: 'date_entered', format: 'date' }, { label: 'Vendor', key: 'vendor' },
      { label: 'Invoice Number', key: 'invoice_number' }, { label: 'Invoice Date', key: 'invoice_date', format: 'date' },
      { label: 'Due Date', key: 'due_date', format: 'date' }, { label: 'Amount', key: 'amount', format: 'currency', colorClass: 'text-emerald-600' },
      { label: 'Entered By', key: 'entered_by' },
      { label: 'Notes', key: 'notes', colSpan: 2, isBlock: true }
    ],
    reviewReadOnly: { show: (e) => e.status === 'Reviewed', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-800', title: 'Review Details',
      fields: [{ label: 'Reviewed By', key: 'reviewed_by' }, { label: 'Reviewed At', key: 'reviewed_at', format: 'datetime' }] },
    adminEdit: { btnGradient: 'from-amber-500 to-orange-500', btnLabel: 'Update Status', editBg: 'bg-amber-50', editBorder: 'border-amber-200', editTextColor: 'text-amber-800', editTitle: 'Review Order Request', focusColor: 'focus:border-amber-400',
      statuses: ['Pending', 'Reviewed'], formKey: 'order', saveHandler: 'handleOrderSave',
      fields: [
        { type: 'select', label: 'Status', key: 'status' },
        { type: 'reviewerSelect', label: 'Reviewed By', key: 'reviewed_by' }
      ]
    }
  },
  'refund-requests': {
    header: (e) => e.chart_number ? { icon: FileText, iconColor: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-rose-200', labelColor: 'text-rose-600', valueColor: 'text-rose-700', label: 'Chart Number:', value: e.chart_number } : null,
    previewFields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Parent Name', key: 'parent_name' },
      { label: 'RP Address', key: 'rp_address' }, { label: 'Date of Request', key: 'date_of_request', format: 'date' },
      { label: 'Type', key: 'type' }, { label: 'Amount Requested', key: 'amount_requested', format: 'currency', colorClass: 'text-emerald-600' },
      { label: 'Contact Method', key: 'best_contact_method' }, { label: 'Contact Info', key: 'contact_info' },
      { label: 'eAssist Audited', key: 'eassist_audited', customRender: (e) => <span className="font-medium">{e.eassist_audited === true ? 'Yes' : e.eassist_audited === false ? 'No' : '-'}</span> },
      { label: 'Description', key: 'description', colSpan: 2, isBlock: true }
    ],
    reviewReadOnly: { show: (e) => e.status === 'Reviewed' || e.result, bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-800', title: 'Review Details',
      fields: [{ label: 'Reviewed By', key: 'reviewed_by' }, { label: 'Reviewed At', key: 'reviewed_at', format: 'datetime' }, { label: 'Comment / Result', key: 'result', colSpan: 2 }] },
    adminEdit: { btnGradient: 'from-rose-500 to-pink-500', btnLabel: 'Update Status', editBg: 'bg-rose-50', editBorder: 'border-rose-200', editTextColor: 'text-rose-800', editTitle: 'Review Refund Request', focusColor: 'focus:border-rose-400',
      statuses: ['Pending', 'Reviewed'], formKey: 'refund', saveHandler: 'handleRefundSave',
      fields: [
        { type: 'select', label: 'Status', key: 'status' },
        { type: 'reviewerSelect', label: 'Reviewed By', key: 'reviewed_by' }
      ],
      extraFields: [{ type: 'textarea', label: 'Comment / Result', key: 'result', placeholder: 'Enter review comments or result...' }]
    }
  }
};

// Config for admin record cards
const ADMIN_CARD_CONFIG = {
  'it-requests': {
    getTitle: (e) => <span className="font-bold text-cyan-600">IT-{e.ticket_number}</span>,
    getSubtitle: (e) => e.requester_name,
    getExtraInfo: (e) => (
      <>
        <span className="text-xs text-gray-500">Urgency:</span>
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${URGENCY_COLORS[e.urgency] || URGENCY_COLORS.Low}`}>{e.urgency || 'Low'}</span>
      </>
    ),
    getDetail: (e) => `${e.locations?.name} • ${new Date(e.created_at).toLocaleDateString()}`,
    getAssigned: (e) => e.assigned_to ? <p className="text-sm text-blue-600 mt-2 flex items-center gap-1"><User className="w-3 h-3" /> Assigned: {e.assigned_to}</p> : null,
  },
  'billing-inquiry': {
    getTitle: (e) => e.chart_number ? <span className="font-bold text-blue-600">Chart# {e.chart_number}</span> : null,
    getSubtitle: (e) => e.patient_name || 'No Patient Name',
    getDetail: (e) => `${e.locations?.name} • ${e.inquiry_type || 'No Type'} • ${e.date_of_request ? new Date(e.date_of_request).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}`,
  },
  'refund-requests': {
    getTitle: (e) => e.chart_number ? <span className="font-bold text-rose-600">Chart# {e.chart_number}</span> : null,
    getSubtitle: (e) => e.patient_name || 'No Patient Name',
    getDetail: (e) => `${e.locations?.name} • ${e.type || 'No Type'} • ${e.date_of_request ? new Date(e.date_of_request).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}`,
    getAmount: (e) => `$${Number(e.amount_requested || 0).toFixed(2)}`,
  },
  'order-requests': {
    getTitle: (e) => e.invoice_number ? <span className="font-bold text-amber-600">Invoice: {e.invoice_number}</span> : null,
    getSubtitle: (e) => e.vendor || 'No Vendor',
    getDetail: (e) => `${e.locations?.name} • ${e.entered_by || e.creator?.name} • ${e.date_entered ? new Date(e.date_entered).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}${e.due_date ? ` • Due: ${new Date(e.due_date).toLocaleDateString()}` : ''}`,
    getAmount: (e) => `$${Number(e.amount || 0).toFixed(2)}`,
  },
  'bills-payment': {
    getTitle: (e) => e.transaction_id ? <span className="font-bold text-violet-600">Invoice: {e.transaction_id}</span> : null,
    getSubtitle: (e) => e.vendor || 'No Vendor',
    getExtra: (e) => e.paid === true ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">Paid</span> : null,
    getDetail: (e) => `${e.locations?.name} • ${e.bill_date ? new Date(e.bill_date).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}${e.due_date ? ` • Due: ${new Date(e.due_date).toLocaleDateString()}` : ''}`,
    getAmount: (e) => `$${Number(e.amount || 0).toFixed(2)}`,
  }
};

// Config for staff entry form fields
const STAFF_FORM_CONFIG = {
  'it-requests': {
    title: 'IT Request', subtitle: 'Ticket # will be auto-generated',
    fields: [
      { label: 'Date Reported', key: 'date_reported', type: 'date' },
      { label: 'Urgency Level', key: 'urgency', options: ['Low', 'Medium', 'High', 'Critical'] },
      { label: 'Requester Name', key: 'requester_name' },
      { label: 'Device / System', key: 'device_system' },
      { label: 'Contact Method', key: 'best_contact_method', options: ['Phone', 'Email', 'Text'] },
      { label: 'Contact Time', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description of Issue', key: 'description_of_issue', placeholder: 'Describe the issue in detail...' },
    fileLabel: 'Screenshots / Documentation', fileKey: 'documentation'
  },
  'billing-inquiry': {
    title: 'Patient Accounting Inquiry',
    fields: [
      { label: 'Patient Name', key: 'patient_name' },
      { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' },
      { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type of Inquiry', key: 'inquiry_type', options: INQUIRY_TYPES },
      { label: 'Best Contact Method', key: 'best_contact_method', options: CONTACT_METHODS },
      { label: 'Best Time to Contact', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description', key: 'description' },
    fileLabel: 'Supporting Documentation', fileKey: 'documentation'
  },
  'bills-payment': {
    title: 'Bills Payment Log',
    fields: [
      { label: 'Transaction / Invoice ID', key: 'transaction_id', placeholder: 'e.g., INV-12345, Bill #567' },
      { label: 'Vendor', key: 'vendor' },
      { label: 'Bill Date', key: 'bill_date', type: 'date' },
      { label: 'Amount', key: 'amount', prefix: '$' },
      { label: 'Due Date', key: 'due_date', type: 'date' },
      { label: 'Paid?', key: 'paid', options: ['Yes', 'No'] },
    ],
    largeField: { label: 'Description (Bill Details)', key: 'description' },
    fileLabel: 'Bill / Invoice Documents', fileKey: 'documentation'
  },
  'order-requests': {
    title: 'Order Invoice Log',
    fields: [
      { label: 'Date Entered', key: 'date_entered', type: 'date' },
      { label: 'Vendor', key: 'vendor' },
      { label: 'Invoice Number', key: 'invoice_number' },
      { label: 'Invoice Date', key: 'invoice_date', type: 'date' },
      { label: 'Due Date', key: 'due_date', type: 'date' },
      { label: 'Amount', key: 'amount', prefix: '$' },
    ],
    largeField: { label: 'Notes', key: 'notes' },
    fileLabel: 'Order Invoices / POs', fileKey: 'orderInvoices'
  },
  'refund-requests': {
    title: 'Patient Refund Request Log',
    fields: [
      { label: 'Patient Name', key: 'patient_name' },
      { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' },
      { label: 'RP Address', key: 'rp_address' },
      { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type Transaction', key: 'type', options: REFUND_TYPES },
      { label: 'Amount Requested', key: 'amount_requested', prefix: '$' },
      { label: 'Best Contact Method', key: 'best_contact_method', options: CONTACT_METHODS },
      { label: 'Contact Info', key: 'contact_info', placeholder: 'Phone number or email' },
      { label: 'eAssist Audited', key: 'eassist_audited', options: ['Yes', 'No', 'N/A'] },
      { label: 'Status', key: 'status', options: ['Pending', 'Approved', 'Completed', 'Denied'] },
    ],
    largeField: { label: 'Description', key: 'description' },
    fileLabel: 'Supporting Documentation', fileKey: 'documentation'
  }
};

// Config for staff history edit form fields
const STAFF_EDIT_FIELDS_CONFIG = {
  'daily-recon': {
    staff: [
      { label: 'Date', key: 'recon_date', type: 'date' },
      { label: 'Cash', key: 'cash', prefix: '$' },
      { label: 'Credit Card', key: 'credit_card', prefix: '$' },
      { label: 'Checks OTC', key: 'checks_otc', prefix: '$' },
      { label: 'Care Credit', key: 'care_credit', prefix: '$' },
    ],
    rev_rangers: [
      { label: 'Date', key: 'recon_date', type: 'date' },
      { label: 'Insurance Check', key: 'insurance_checks', prefix: '$' },
      { label: 'VCC', key: 'vcc', prefix: '$' },
      { label: 'EFTs', key: 'efts', prefix: '$' },
    ],
    notesField: { label: 'Notes', key: 'notes' }
  },
  'billing-inquiry': {
    fields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type of Inquiry', key: 'inquiry_type', options: INQUIRY_TYPES },
      { label: 'Contact Method', key: 'best_contact_method', options: CONTACT_METHODS },
      { label: 'Best Time to Contact', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description', key: 'description' }
  },
  'bills-payment': {
    fields: [
      { label: 'Transaction / Invoice ID', key: 'transaction_id', placeholder: 'e.g., INV-12345' },
      { label: 'Vendor', key: 'vendor' },
      { label: 'Bill Date', key: 'bill_date', type: 'date' },
      { label: 'Amount', key: 'amount', prefix: '$' },
      { label: 'Due Date', key: 'due_date', type: 'date' },
      { label: 'Paid?', key: 'paid', options: ['Yes', 'No'] },
    ],
    largeField: { label: 'Description', key: 'description' }
  },
  'order-requests': {
    fields: [
      { label: 'Date Entered', key: 'date_entered', type: 'date' }, { label: 'Vendor', key: 'vendor' },
      { label: 'Invoice Number', key: 'invoice_number' }, { label: 'Invoice Date', key: 'invoice_date', type: 'date' },
      { label: 'Due Date', key: 'due_date', type: 'date' }, { label: 'Amount', key: 'amount', prefix: '$' },
    ],
    largeField: { label: 'Notes', key: 'notes' }
  },
  'refund-requests': {
    fields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'RP Address', key: 'rp_address' },
      { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type', key: 'type', options: REFUND_TYPES },
      { label: 'Amount Requested', key: 'amount_requested', prefix: '$' },
      { label: 'Contact Method', key: 'best_contact_method', options: CONTACT_METHODS },
      { label: 'Contact Info', key: 'contact_info', placeholder: 'Phone or email' },
    ],
    largeField: { label: 'Description', key: 'description' }
  },
  'completed-procedure': { fields: [{ label: 'Checked By', key: 'checked_by' }], largeField: { label: 'Notes', key: 'notes', placeholder: 'Enter notes...' } },
  'claims-documents': { fields: [{ label: 'Checked By', key: 'checked_by' }], largeField: { label: 'Notes', key: 'notes', placeholder: 'Enter notes...' } },
  'it-requests': {
    fields: [
      { label: 'Date Reported', key: 'date_reported', type: 'date' },
      { label: 'Urgency', key: 'urgency', options: ['Low', 'Medium', 'High', 'Critical'] },
      { label: 'Requester Name', key: 'requester_name' }, { label: 'Device/System', key: 'device_system' },
      { label: 'Contact Method', key: 'best_contact_method', options: ['Phone', 'Email', 'Text'] },
      { label: 'Best Contact Time', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description of Issue', key: 'description_of_issue' }
  }
};

// Helper: render InputField grid from config
const renderFormFields = (fields, formState, updateFn, moduleId) => (
  <div className="grid grid-cols-2 gap-4">
    {fields.map(f => (
      <InputField key={f.key} label={f.label} type={f.type || 'text'} value={formState[f.key]} onChange={e => updateFn(moduleId, f.key, e.target.value)} prefix={f.prefix} options={f.options} placeholder={f.placeholder} />
    ))}
  </div>
);

// Helper: render staff edit fields from config
const renderStaffEditFields = (fields, staffEditForm, updateStaffEditForm) => (
  <div className="grid grid-cols-2 gap-3">
    {fields.map(f => (
      <InputField key={f.key} label={f.label} type={f.type || 'text'} value={staffEditForm[f.key]} onChange={ev => updateStaffEditForm(f.key, ev.target.value)} prefix={f.prefix} options={f.options} placeholder={f.placeholder} />
    ))}
  </div>
);

// Helper: render doc list inline
const renderDocList = (docs, viewDocument, downloadDocument) => docs.length > 0 ? (
  <div className="mt-3 flex flex-wrap gap-2" onClick={ev => ev.stopPropagation()}>
    {docs.map(doc => (
      <div key={doc.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs">
        <File className="w-3 h-3 text-gray-400" />
        <span className="text-gray-600 max-w-24 truncate">{doc.file_name}</span>
        <button onClick={() => viewDocument(doc)} className="p-0.5 text-blue-500 hover:bg-blue-100 rounded" title="Preview"><Eye className="w-3 h-3" /></button>
        <button onClick={() => downloadDocument(doc)} className="p-0.5 text-emerald-500 hover:bg-emerald-100 rounded" title="Download"><Download className="w-3 h-3" /></button>
      </div>
    ))}
  </div>
) : null;

// Helper: checkbox for record selection
const renderCheckbox = (isSelected, onToggle, isITViewOnly) => !isITViewOnly ? (
  <button onClick={(ev) => { ev.stopPropagation(); onToggle(); }} className={`${CHECKBOX.base} mt-1 ${isSelected ? CHECKBOX.selected : CHECKBOX.unselected}`}>
    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
  </button>
) : null;

// Helper: render KPI analytics cards in a grid
const renderKPICards = (cards) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {cards.map((c, i) => (
      <div key={i} className={ANALYTICS_CARDS[c.color]}>
        <p className={`text-sm font-medium ${ANALYTICS_CARDS.subtitleColors[c.color]}`}>{c.label}</p>
        <p className="text-3xl font-bold mt-1">{c.value}</p>
        {c.detail && <p className={`text-xs mt-2 ${ANALYTICS_CARDS.detailColors[c.color]}`}>{c.detail}</p>}
      </div>
    ))}
  </div>
);

// Helper: group records by location with optional value aggregation
const groupByLocation = (data, valueKey) => {
  const byLoc = {};
  data.forEach(r => {
    const loc = r.locations?.name || 'Unknown';
    if (!byLoc[loc]) byLoc[loc] = { count: 0, total: 0 };
    byLoc[loc].count++;
    if (valueKey) byLoc[loc].total += parseFloat(r[valueKey]) || 0;
  });
  return byLoc;
};

// Helper: empty state placeholder
const EmptyState = ({ icon: Icon, message }) => (
  <div className={`${CARD.base} text-center py-12`}>
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <p className="text-gray-500">{message}</p>
  </div>
);

const formatRole = (role) => {
  const roleMap = { 'it': 'IT', 'staff': 'Staff', 'super_admin': 'Super Admin', 'finance_admin': 'Finance Admin', 'office_manager': 'Office Manager', 'rev_rangers': 'Rev Rangers' };
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
      <label className={INPUT.label}>{label}</label>
      <div className={`${INPUT.wrapper} ${disabled ? 'bg-gray-100' : ''}`}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} disabled={disabled} className="w-full p-2.5 rounded-xl outline-none bg-transparent disabled:cursor-not-allowed" placeholder={placeholder} />
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
        <label className={INPUT.label}>{label}</label>
        <select value={value} onChange={onChange} disabled={disabled} className={INPUT.select}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (large) {
    return (
      <div className="flex flex-col">
        <label className={INPUT.label}>{label}</label>
        <textarea value={value} onChange={onChange} disabled={disabled} rows={4} className={INPUT.textarea} placeholder={placeholder} />
      </div>
    );
  }
  const handleNumberInput = (e) => {
    const val = e.target.value;
    if (isNumber || prefix === '$') { if (val === '' || /^\d*\.?\d*$/.test(val)) onChange(e); } else onChange(e);
  };
  return (
    <div className="flex flex-col">
      <label className={INPUT.label}>{label}</label>
      <div className={`${INPUT.wrapper} ${disabled ? 'bg-gray-100' : ''}`}>
        {prefix && <span className="pl-3 text-gray-400 font-medium">{prefix}</span>}
        <input type={type} value={value} onChange={handleNumberInput} disabled={disabled} className="w-full p-2.5 rounded-xl outline-none bg-transparent disabled:cursor-not-allowed" placeholder={placeholder} inputMode={(isNumber || prefix === '$') ? 'decimal' : undefined} />
      </div>
    </div>
  );
}

function FileUpload({ label, files, onFilesChange, onViewFile, disabled }) {
  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({ file: f, name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f), isNew: true }));
    onFilesChange([...files, ...newFiles]);
  };
  return (
    <div className="flex flex-col">
      <label className={INPUT.label}>{label}</label>
      <div className={`${FILE_UPLOAD.dropzone} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <label className={`flex flex-col items-center justify-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} text-gray-500 hover:text-blue-600`}>
          <div className={FILE_UPLOAD.uploadIcon}><Upload className="w-5 h-5 text-blue-600" /></div>
          <span className="text-sm font-medium">Click to upload files</span>
          <input type="file" multiple onChange={handleFileChange} disabled={disabled} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
        </label>
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, i) => (
              <div key={i} className={FILE_UPLOAD.fileItem}>
                <div className="flex items-center gap-2 truncate flex-1">
                  <div className={`${FILE_UPLOAD.fileIcon} flex-shrink-0`}><File className="w-4 h-4 text-blue-600" /></div>
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
  const isPDF = file.type === 'application/pdf' || file.name?.match(/\.pdf$/i);
  const isOfficeDoc = file.name?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
  return (
    <div className={LAYOUT.modalOverlay} onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl max-h-[90vh] w-full overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white/90 backdrop-blur-sm z-10">
          <h3 className="font-semibold truncate text-gray-800">{file.name}</h3>
          <div className="flex items-center gap-2">
            <a href={file.url} download={file.name} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Download"><Download className="w-5 h-5" /></a>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className={isImage ? 'p-6' : ''}>
          {isImage ? <img src={file.url} alt={file.name} className="max-w-full rounded-xl mx-auto shadow-lg" /> : isPDF ? (
            <iframe src={file.url} className="w-full" style={{ height: '80vh' }} title={file.name} />
          ) : isOfficeDoc ? (
            <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`} className="w-full" style={{ height: '80vh' }} title={file.name} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><File className="w-10 h-10 text-gray-400" /></div>
              <p className="mb-4">Preview not available for this file type</p>
              <a href={file.url} download={file.name} className={`inline-block px-6 py-3 ${BTN.primary}`}>Download File</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryPreview({ entry, module, onClose, colors, onViewDocument, currentUser, itUsers, financeAdminUsers, onUpdateStatus, onDelete, onUpdateBillingInquiry, onUpdateBillsPayment, onUpdateOrderRequest, onUpdateRefundRequest, onUpdateChecklist }) {
  const [editForm, setEditForm] = useState({
    status: entry?.status || 'For Review',
    assigned_to: entry?.assigned_to || '',
    resolution_notes: entry?.resolution_notes || ''
  });
const [billingEditForm, setBillingEditForm] = useState({
    status: entry?.status || 'Pending',
    billing_team_reviewed: entry?.billing_team_reviewed || '',
    date_reviewed: entry?.date_reviewed || '',
    result: entry?.result || '',
    paid: entry?.paid ?? null
  });
const [orderEditForm, setOrderEditForm] = useState({
    status: entry?.status || 'Pending',
    reviewed_by: entry?.reviewed_by || '',
    reviewed_at: entry?.reviewed_at || ''
  });
  const [refundEditForm, setRefundEditForm] = useState({
    status: entry?.status || 'Pending',
    reviewed_by: entry?.reviewed_by || '',
    reviewed_at: entry?.reviewed_at || '',
    result: entry?.result || ''
  });
const [checklistEditForm, setChecklistEditForm] = useState({
    status: entry?.status || 'Pending',
    admin_notes: entry?.admin_notes || ''
  });
const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    if (entry) {
      setEditForm({
        status: entry.status || 'For Review',
        assigned_to: entry.assigned_to || '',
        resolution_notes: entry.resolution_notes || ''
      });
setBillingEditForm({
        status: entry.status || 'Pending',
        billing_team_reviewed: entry.billing_team_reviewed || entry.ap_reviewed || '',
        date_reviewed: entry.date_reviewed || '',
        result: entry.result || '',
        paid: entry.paid ?? null
      });
setOrderEditForm({
        status: entry.status || 'Pending',
        reviewed_by: entry.reviewed_by || '',
        reviewed_at: entry.reviewed_at || ''
      });
setRefundEditForm({
        status: entry.status || 'Pending',
        reviewed_by: entry.reviewed_by || '',
        reviewed_at: entry.reviewed_at || '',
        result: entry.result || ''
      });
      setChecklistEditForm({
        status: entry.status || 'Pending',
        admin_notes: entry.admin_notes || ''
      });
      setIsEditing(false);
    }
  }, [entry]);
  if (!entry) return null;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-';
  const formatCurrency = (val) => val ? `$${Number(val).toFixed(2)}` : '$0.00';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString() : '-';
const isITRequest = module?.id === 'it-requests';
const isBillingInquiry = module?.id === 'billing-inquiry';
  const isBillsPayment = module?.id === 'bills-payment';
  const isOrderRequest = module?.id === 'order-requests';
  const canEditIT = isITRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'it');
const canEditBilling = (isBillingInquiry || isBillsPayment) && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin' || (currentUser.role === 'rev_rangers' && isBillingInquiry));
const canEditOrders = isOrderRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin');
  const isRefundRequest = module?.id === 'refund-requests';
  const canEditRefunds = isRefundRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin');
const isChecklistModule = module?.id === 'completed-procedure' || module?.id === 'claims-documents';
  const canReviewChecklist = isChecklistModule && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'rev_rangers');
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
const handleBillingSave = () => {
    if (onUpdateBillingInquiry) {
      onUpdateBillingInquiry(entry.id, billingEditForm);
    }
    setIsEditing(false);
    onClose();
  };
const handleBillsPaymentSave = () => {
    if (onUpdateBillsPayment) {
      onUpdateBillsPayment(entry.id, billingEditForm);
    }
    setIsEditing(false);
    onClose();
  };
const handleOrderSave = () => {
    if (onUpdateOrderRequest) {
      onUpdateOrderRequest(entry.id, orderEditForm);
    }
    setIsEditing(false);
    onClose();
  };
const handleChecklistSave = () => {
    if (onUpdateChecklist) {
      onUpdateChecklist(entry.id, module?.id, checklistEditForm);
    }
    setIsEditing(false);
    onClose();
  };
    const handleRefundSave = () => {
    if (onUpdateRefundRequest) {
      onUpdateRefundRequest(entry.id, refundEditForm);
    }
    setIsEditing(false);
    onClose();
  };
  return (
    <div className={LAYOUT.modalOverlay} onClick={onClose}>
      <div className={LAYOUT.modalCard} onClick={e => e.stopPropagation()}>
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
                <h4 className="col-span-2 font-semibold text-emerald-800 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Daily Reconciliation Entry</h4>
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

          {ENTRY_PREVIEW_CONFIG[module?.id] && (() => {
            const config = ENTRY_PREVIEW_CONFIG[module?.id];
            const canEdit = module?.id === 'billing-inquiry' || module?.id === 'bills-payment' ? canEditBilling
              : module?.id === 'order-requests' ? canEditOrders
              : module?.id === 'refund-requests' ? canEditRefunds : false;
            const formKey = config.adminEdit?.formKey;
            const form = formKey === 'billing' ? billingEditForm : formKey === 'order' ? orderEditForm : formKey === 'refund' ? refundEditForm : billingEditForm;
            const setForm = formKey === 'billing' ? setBillingEditForm : formKey === 'order' ? setOrderEditForm : formKey === 'refund' ? setRefundEditForm : setBillingEditForm;
            const saveFn = config.adminEdit?.saveHandler === 'handleBillingSave' ? handleBillingSave
              : config.adminEdit?.saveHandler === 'handleBillsPaymentSave' ? handleBillsPaymentSave
              : config.adminEdit?.saveHandler === 'handleOrderSave' ? handleOrderSave
              : config.adminEdit?.saveHandler === 'handleRefundSave' ? handleRefundSave : null;
            return (
              <div className="space-y-4">
                {config.header && config.header(entry) && (() => {
                  const h = config.header(entry);
                  return (
                    <div className={`flex items-center gap-3 p-3 ${h.bgColor} rounded-xl border ${h.borderColor}`}>
                      <h.icon className={`w-5 h-5 ${h.iconColor}`} />
                      <span className={`text-sm font-medium ${h.labelColor}`}>{h.label}</span>
                      <span className={`font-bold ${h.valueColor}`}>{h.value}</span>
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-4">
                  {config.previewFields.map(f => {
                    const val = entry[f.key];
                    let display = val || '-';
                    if (f.format === 'date') display = formatDate(val);
                    else if (f.format === 'currency') display = formatCurrency(val);
                    else if (f.format === 'datetime') display = formatDateTime(val);
                    if (f.customRender) display = f.customRender(entry);
                    if (f.isBlock) return (<div key={f.key} className={f.colSpan === 2 ? 'col-span-2' : ''}><span className="text-gray-600 text-sm block">{f.label}</span><p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{display}</p></div>);
                    return (<div key={f.key} className={f.colSpan === 2 ? 'col-span-2' : ''}><span className="text-gray-600 text-sm block">{f.label}</span><span className={`font-medium ${f.colorClass || ''}`}>{display}</span></div>);
                  })}
                </div>
                {config.reviewReadOnly && !isEditing && config.reviewReadOnly.show(entry) && (
                  <div className={`p-4 ${config.reviewReadOnly.bgColor} rounded-xl border ${config.reviewReadOnly.borderColor}`}>
                    <h4 className={`font-semibold ${config.reviewReadOnly.textColor} mb-3 flex items-center gap-2`}><FileText className="w-4 h-4" /> {config.reviewReadOnly.title}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {config.reviewReadOnly.fields.map(rf => (
                        <div key={rf.key} className={rf.colSpan === 2 ? 'col-span-2' : ''}><span className="text-gray-600 text-sm block">{rf.label}</span><span className="font-medium">{rf.format === 'date' ? formatDate(entry[rf.key]) : rf.format === 'datetime' ? formatDateTime(entry[rf.key]) : (entry[rf.key] || '-')}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {canEdit && config.adminEdit && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className={`w-full py-3 bg-gradient-to-r ${config.adminEdit.btnGradient} text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2`}><Edit3 className="w-4 h-4" /> {config.adminEdit.btnLabel}</button>
                    ) : (
                      <div className={`space-y-4 ${config.adminEdit.editBg} p-4 rounded-xl border ${config.adminEdit.editBorder}`}>
                        <h4 className={`font-semibold ${config.adminEdit.editTextColor} flex items-center gap-2`}><Edit3 className="w-4 h-4" /> {config.adminEdit.editTitle}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {config.adminEdit.fields.map(f => {
                            if (f.type === 'select') return (<div key={f.key}><label className="text-xs font-medium text-gray-600 mb-1.5 block">{f.label}</label><select value={form[f.key]} onChange={ev => setForm({ ...form, [f.key]: ev.target.value })} className={`w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none ${config.adminEdit.focusColor} bg-white`}>{config.adminEdit.statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>);
                            if (f.type === 'reviewerSelect') return (<div key={f.key}><label className="text-xs font-medium text-gray-600 mb-1.5 block">{f.label}</label><select value={form[f.key]} onChange={ev => setForm({ ...form, [f.key]: ev.target.value })} className={`w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none ${config.adminEdit.focusColor} bg-white`}><option value="">Select Reviewer...</option>{financeAdminUsers?.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>);
                            if (f.type === 'date') return (<div key={f.key}><label className="text-xs font-medium text-gray-600 mb-1.5 block">{f.label}</label><input type="date" value={form[f.key]} onChange={ev => setForm({ ...form, [f.key]: ev.target.value })} className={`w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none ${config.adminEdit.focusColor} bg-white`} /></div>);
                            if (f.type === 'paidSelect') return (<div key={f.key}><label className="text-xs font-medium text-gray-600 mb-1.5 block">{f.label}</label><select value={form[f.key] === true ? 'Yes' : form[f.key] === false ? 'No' : ''} onChange={ev => setForm({ ...form, [f.key]: ev.target.value === 'Yes' ? true : ev.target.value === 'No' ? false : null })} className={`w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none ${config.adminEdit.focusColor} bg-white`}><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></select></div>);
                            return null;
                          })}
                        </div>
                        {config.adminEdit.extraFields?.map(f => (<div key={f.key}><label className="text-xs font-medium text-gray-600 mb-1.5 block">{f.label}</label><textarea value={form[f.key]} onChange={ev => setForm({ ...form, [f.key]: ev.target.value })} placeholder={f.placeholder} rows={3} className={`w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none ${config.adminEdit.focusColor} bg-white resize-none`} /></div>))}
                        <div className="flex gap-2">
                          <button onClick={saveFn} className={`flex-1 py-2.5 ${BTN.save}`}>Save Review</button>
                          <button onClick={() => setIsEditing(false)} className={`px-4 py-2.5 ${BTN.cancel}`}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {(module?.id === 'completed-procedure' || module?.id === 'claims-documents') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
  <div><span className="text-gray-600 text-sm block">Submitted By</span><span className="font-medium">{entry.checked_by || '-'}</span></div>
                <div><span className="text-gray-600 text-sm block">Date Submitted</span><span className="font-medium">{new Date(entry.created_at).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' })}</span></div>
                <div><span className="text-gray-600 text-sm block">Location</span><span className="font-medium">{entry.locations?.name || '-'}</span></div>
              </div>
              {entry.notes && (
                <div className="col-span-2">
                  <span className="text-gray-600 text-sm block">Notes</span>
                  <p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">{entry.notes}</p>
                </div>
              )}
{/* Admin Notes - Read Only */}
              {!isEditing && entry.admin_notes && (
                <div className={`p-4 rounded-xl border ${entry.status === 'Needs Revisions' ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <h4 className={`font-semibold mb-2 flex items-center gap-2 ${entry.status === 'Needs Revisions' ? 'text-orange-800' : 'text-emerald-800'}`}>
                    <FileText className="w-4 h-4" /> Admin Notes
                  </h4>
                  <p className="text-gray-700">{entry.admin_notes}</p>
                </div>
              )}
              {/* Review Section for Checklist - Rev Rangers / Super Admin */}
              {canReviewChecklist && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" /> Review & Update Status
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 rounded-xl border bg-teal-50 border-teal-200">
                      <h4 className="font-semibold flex items-center gap-2 text-teal-800">
                        <Edit3 className="w-4 h-4" /> Review Checklist Entry
                      </h4>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Status</label>
                        <select
                          value={checklistEditForm.status}
                          onChange={ev => setChecklistEditForm({ ...checklistEditForm, status: ev.target.value })}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Needs Revisions">Needs Revisions</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Admin Notes</label>
                        <textarea
                          value={checklistEditForm.admin_notes}
                          onChange={ev => setChecklistEditForm({ ...checklistEditForm, admin_notes: ev.target.value })}
                          placeholder="Enter review notes or feedback..."
                          rows={3}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-white resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleChecklistSave}
                          className={`flex-1 py-2.5 ${BTN.save}`}
                        >
                          Save Review
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className={`px-4 py-2.5 ${BTN.cancel}`}
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
              {canEditIT && (
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
                          className={`flex-1 py-2.5 ${BTN.save}`}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className={`px-4 py-2.5 ${BTN.cancel}`}
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
            <button onClick={() => onDelete(entry.id)} className={`px-6 py-3 ${BTN.danger} flex items-center gap-2`}>
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }) {
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[status] || STATUS_COLORS._default}`}>{status || 'Pending'}</span>;
}
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let key = 0;
  lines.forEach((line) => {
    let processedLine = line;
    processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
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
        className={`fixed bottom-6 right-6 z-50 ${ICON_BOX.chatBtn} ${isOpen ? 'bg-gray-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
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
                <div className={ICON_BOX.chatAvatar}>
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
                className={`flex-1 ${INPUT.base}`}
              />
              <button
                onClick={onSend}
                disabled={loading}
                className={`px-4 ${BTN.primary} rounded-xl disabled:opacity-50`}
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
  const [financeAdminUsers, setFinanceAdminUsers] = useState([]);
const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, onCancel: null, confirmText: 'Confirm', confirmColor: 'blue' });
const [passwordDialog, setPasswordDialog] = useState({ open: false, title: '', message: '', onConfirm: null, onCancel: null, password: '', error: '' });
const [selectedRecords, setSelectedRecords] = useState([]);
const [selectAll, setSelectAll] = useState(false);
const [selectedDocuments, setSelectedDocuments] = useState([]);
const [docSelectAll, setDocSelectAll] = useState(false);
const [downloadingZip, setDownloadingZip] = useState(false);
const [sops, setSOPs] = useState([]);
const [sopSearch, setSOPSearch] = useState('');
const [sopFiles, setSOPFiles] = useState([]);
const [sopTitle, setSOPTitle] = useState('');
const [sopDescription, setSOPDescription] = useState('');
const [sopSortOrder, setSOPSortOrder] = useState('desc');
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
const [checklistStatus, setChecklistStatus] = useState({});
 const [checklistLoading, setChecklistLoading] = useState(false);
  const [entryDocuments, setEntryDocuments] = useState({});
  const [checklistAnalyticsTab, setChecklistAnalyticsTab] = useState('overview');
  const [checklistCalendarDate, setChecklistCalendarDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const getHawaiiToday = () => {
    const now = new Date();
    const hawaiiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
    const year = hawaiiTime.getFullYear();
    const month = String(hawaiiTime.getMonth() + 1).padStart(2, '0');
    const day = String(hawaiiTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const isChecklistPastDeadline = () => {
    const now = new Date();
    const hawaiiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
    return hawaiiTime.getHours() === 23 && hawaiiTime.getMinutes() >= 59;
  };
    const canEditChecklistEntry = (createdAt) => {
    const now = new Date();
    const hawaiiNow = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
    const recordDate = new Date(createdAt);
    const recordHawaii = new Date(recordDate.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
    return hawaiiNow.getFullYear() === recordHawaii.getFullYear() &&
           hawaiiNow.getMonth() === recordHawaii.getMonth() &&
           hawaiiNow.getDate() === recordHawaii.getDate() &&
           !isChecklistPastDeadline();
  };
  const loadChecklistStatus = async (locationId) => {
    if (!locationId) return;
    setChecklistLoading(true);
    const hawaiiToday = getHawaiiToday();
    const dayStart = `${hawaiiToday}T00:00:00-10:00`;
    const dayEnd = `${hawaiiToday}T23:59:59-10:00`;
    const status = {};
    for (const mod of CHECKLIST_MODULES) {
      const { data, error } = await supabase
        .from(mod.table)
        .select('*')
        .eq('location_id', locationId)
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', data[0].created_by)
          .maybeSingle();
        status[mod.id] = {
          submitted: true,
          entry: { ...data[0], creator: userData || null },
          status: data[0].status || 'Pending'
        };
      } else {
        status[mod.id] = { submitted: false, entry: null, status: null };
      }
    }
    setChecklistStatus(status);
    setChecklistLoading(false);
  };
  const enrichWithLocationsAndUsers = async (data, includeUpdater = false) => {
    const locIds = [...new Set(data.map(d => d.location_id).filter(Boolean))];
    const { data: locsData } = await supabase.from('locations').select('id, name').in('id', locIds).eq('is_active', true);
    const locMap = {}; locsData?.forEach(l => { locMap[l.id] = l; });
    const userIds = [...new Set([...data.map(d => d.created_by), ...(includeUpdater ? data.map(d => d.updated_by) : [])].filter(Boolean))];
    const { data: usersData } = await supabase.from('users').select('id, name').in('id', userIds);
    const userMap = {}; usersData?.forEach(u => { userMap[u.id] = u; });
    return data.map(d => ({ ...d, locations: locMap[d.location_id] || null, creator: userMap[d.created_by] || null, ...(includeUpdater ? { updater: userMap[d.updated_by] || null } : {}) }));
  };
const loadChecklistAnalyticsData = async () => {
    for (const mod of CHECKLIST_MODULES) {
      if (moduleData[mod.id]?.length > 0 && moduleData[mod.id]?._allLocations) continue;
      const { data } = await supabase.from(mod.table).select('*').order('created_at', { ascending: false }).limit(1500);
      if (data && data.length > 0) {
        const enriched = await enrichWithLocationsAndUsers(data);
        enriched._allLocations = true;
        setModuleData(prev => ({ ...prev, [mod.id]: enriched }));
      } else {
        const empty = []; empty._allLocations = true;
        setModuleData(prev => ({ ...prev, [mod.id]: empty }));
      }
    }
  };
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
    'billing-inquiry': { patient_name: '', chart_number: '', parent_name: '', date_of_request: today, inquiry_type: '', description: '', best_contact_method: '', best_contact_time: '', billing_team_reviewed: '', date_reviewed: '', status: 'Pending', result: '' },
'bills-payment': { bill_date: today, vendor: '', transaction_id: '', description: '', amount: '', due_date: '', paid: '' },
    'order-requests': { date_entered: today, vendor: '', invoice_number: '', invoice_date: '', due_date: '', amount: '', entered_by: '', notes: '' },
  'refund-requests': { patient_name: '', chart_number: '', parent_name: '', rp_address: '', date_of_request: today, type: '', description: '', amount_requested: '', best_contact_method: '', contact_info: '', eassist_audited: '', status: 'Pending' },
'it-requests': { date_reported: today, urgency: '', requester_name: '', device_system: '', description_of_issue: '', best_contact_method: '', best_contact_time: '', assigned_to: '', status: 'Open', resolution_notes: '', completed_by: '' },
    'completed-procedure': { checked_by: '', notes: '' },
    'claims-documents': { checked_by: '', notes: '' }
  });
  const [files, setFiles] = useState({
  'daily-recon': { documents: [] },
    'billing-inquiry': { documentation: [] },
    'bills-payment': { documentation: [] },
    'order-requests': { orderInvoices: [] },
    'refund-requests': { documentation: [] },
'it-requests': { documentation: [] },
    'completed-procedure': { documentation: [] },
    'claims-documents': { documentation: [] }
  });
useEffect(() => {
  loadLocations();
  const savedSession = localStorage.getItem('cms_session') || sessionStorage.getItem('cms_session');
  if (savedSession) {
    try {
      const sessionData = JSON.parse(savedSession);
      if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
        localStorage.removeItem('cms_session');
        sessionStorage.removeItem('cms_session');
        return;
      }
      if (sessionData.user && sessionData.user.id) {
        setCurrentUser(sessionData.user);
        setUserLocations(sessionData.userLocations || []);
        if (sessionData.selectedLocation) {
          setSelectedLocation(sessionData.selectedLocation);
        }
        setLastLogin(sessionData.lastLogin);
if (sessionData.user.role === 'super_admin' || sessionData.user.role === 'finance_admin' || sessionData.user.role === 'it' || sessionData.user.role === 'rev_rangers') {
  loadUsers();
  loadItUsers();
  loadFinanceAdminUsers();
if (sessionData.user.role === 'rev_rangers') {
    setAdminView('analytics');
    setAnalyticsModule('daily-recon');
  } else {
    setAdminView('analytics');
  }
}
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem('cms_session');
      sessionStorage.removeItem('cms_session');
    }
  }
  const handleStorageChange = (e) => {
    if (e.key === 'cms_session') {
      if (e.newValue === null) {
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
  useEffect(() => {
    if (currentUser && selectedLocation && (isOfficeManager || currentUser?.role === 'staff')) {
      const loc = locations.find(l => l.name === selectedLocation);
      if (loc) loadChecklistStatus(loc.id);
    }
  }, [currentUser, selectedLocation, locations]);
useEffect(() => { setCurrentPage(1); setRecordSearch(''); }, [activeModule, adminLocation]);
  useEffect(() => {
  if (adminView === 'rev-entry' && activeModule !== 'daily-recon') {
    setAdminView('records');
  }
}, [activeModule]);
  useEffect(() => { setStaffCurrentPage(1); setStaffRecordSearch(''); setEditingStaffEntry(null); }, [activeModule, selectedLocation]);
  useEffect(() => {
  if (currentUser && (activeModule === 'completed-procedure' || activeModule === 'claims-documents')) {
    if (!forms[activeModule].checked_by) {
      setForms(prev => ({ ...prev, [activeModule]: { ...prev[activeModule], checked_by: currentUser.name } }));
    }
  }
}, [activeModule, currentUser]);
useEffect(() => { setSelectedRecords([]); setSelectAll(false); }, [activeModule, adminLocation, currentPage, recordSearch]);
  useEffect(() => { setSelectedDocuments([]); setDocSelectAll(false); }, [adminView, docSearch]);
useEffect(() => {
  if (viewingEntry && activeModule === 'it-requests') {
    loadItUsers();
  }
  if (viewingEntry && activeModule === 'billing-inquiry') {
    loadFinanceAdminUsers();
  }
}, [viewingEntry, activeModule]);
useEffect(() => {
  const userIsAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'rev_rangers' || currentUser?.role === 'it';
  if (userIsAdmin && adminView === 'analytics' && analyticsModule === 'checklist-overview') {
    loadChecklistAnalyticsData();
  }
}, [analyticsModule, adminView]);
useEffect(() => {
  const userIsAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'rev_rangers';
if (userIsAdmin && adminView === 'analytics' && analyticsModule && analyticsModule !== 'checklist-overview') {
    if (!moduleData[analyticsModule]) {
      loadModuleData(analyticsModule);
    }
  }
}, [analyticsModule, adminView]);
const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'it' || currentUser?.role === 'rev_rangers';
const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'it';
const isChecklistReviewer = currentUser?.role === 'super_admin' || currentUser?.role === 'rev_rangers';
const isOfficeManager = currentUser?.role === 'office_manager';
const isITViewOnly = currentUser?.role === 'it' && activeModule !== 'it-requests';
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
    if (!module) { setLoading(false); return; }
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
const loadUsersByRole = async (role, setter) => {
  const { data, error } = await supabase.from('users').select('id, name').eq('role', role).eq('is_active', true).order('name');
  if (error) console.error(`Error loading ${role} users:`, error);
  if (data) setter(data);
};
const loadItUsers = () => loadUsersByRole('it', setItUsers);
const loadFinanceAdminUsers = () => loadUsersByRole('finance_admin', setFinanceAdminUsers);
  const loadUsers = async () => {
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
    const { data: userLocsData } = await supabase
      .from('user_locations')
      .select('user_id, location_id');
    const { data: locsData } = await supabase
      .from('locations')
      .select('id, name')
      .eq('is_active', true);
    const locationMap = {};
    locsData?.forEach(loc => { locationMap[loc.id] = loc; });
    const usersWithLocations = usersData.map(user => ({
      ...user,
      locations: userLocsData
        ?.filter(ul => ul.user_id === user.id)
        ?.map(ul => locationMap[ul.location_id])
        ?.filter(Boolean) || []
    }));
    setUsers(usersWithLocations);
  };
  const loadDocuments = async () => {
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
    setDocuments(docsWithUploaders);
  };
  // === SOP Functions ===
  const loadSOPs = async () => {
    const { data, error } = await supabase.from('sops').select('*').order('created_at', { ascending: false });
    if (!data || error) { setSOPs([]); return; }
    const uploaderIds = [...new Set(data.map(d => d.uploaded_by).filter(Boolean))];
    let uploaderMap = {};
    if (uploaderIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('id, name').in('id', uploaderIds);
      usersData?.forEach(u => { uploaderMap[u.id] = u; });
    }
    setSOPs(data.map(s => ({ ...s, uploader: uploaderMap[s.uploaded_by] || null })));
  };
  const uploadSOP = async () => {
    if (!sopTitle.trim()) { showMessage('error', 'Please enter a title'); return; }
    if (sopFiles.length === 0) { showMessage('error', 'Please select a file'); return; }
    setSaving(true);
    try {
      for (const file of sopFiles) {
        const filePath = `sops/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('clinic-documents').upload(filePath, file.file || file);
        if (uploadError) { showMessage('error', 'Upload failed: ' + uploadError.message); setSaving(false); return; }
        await supabase.from('sops').insert({ title: sopTitle.trim(), description: sopDescription.trim() || null, file_name: file.name, file_type: file.type, file_size: file.size, storage_path: filePath, uploaded_by: currentUser.id });
      }
      setSOPTitle(''); setSOPDescription(''); setSOPFiles([]);
      showMessage('success', '✓ SOP uploaded successfully');
      loadSOPs();
    } catch (err) { showMessage('error', 'Failed to upload SOP'); }
    setSaving(false);
  };
  const deleteSOP = async (sop) => {
    const confirmed = await showConfirm('Delete SOP', `Are you sure you want to delete "${sop.title}"? This cannot be undone.`, 'Delete', 'red');
    if (!confirmed) return;
    await supabase.storage.from('clinic-documents').remove([sop.storage_path]);
    await supabase.from('sops').delete().eq('id', sop.id);
    showMessage('success', '✓ SOP deleted');
    loadSOPs();
  };
  const viewSOP = async (sop) => {
    const { data } = await supabase.storage.from('clinic-documents').createSignedUrl(sop.storage_path, 3600);
    if (data?.signedUrl) { setViewingFile({ ...sop, url: data.signedUrl, name: sop.file_name, type: sop.file_type }); }
    else { showMessage('error', 'Could not load document'); }
  };
  const downloadSOP = async (sop) => {
    const { data } = await supabase.storage.from('clinic-documents').createSignedUrl(sop.storage_path, 3600);
    if (data?.signedUrl) { const a = document.createElement('a'); a.href = data.signedUrl; a.download = sop.file_name; a.click(); }
    else { showMessage('error', 'Could not download document'); }
  };
  const loadModuleData = async (moduleId) => {
    setLoading(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    if (!module) return;
    let query = supabase.from(module.table).select('*').order('created_at', { ascending: false });
if ((!isAdmin || isOfficeManager) && selectedLocation) {
      const loc = locations.find(l => l.name === selectedLocation);
      if (loc) query = query.eq('location_id', loc.id);
    } else if (isAdmin && !isOfficeManager && adminLocation !== 'all') {
      const loc = locations.find(l => l.name === adminLocation);
      if (loc) query = query.eq('location_id', loc.id);
    }
    const { data, error } = await query.limit(500);
    if (error) {
      console.error('Module data load error:', moduleId, error);
    }
    if (data && data.length > 0) {
      const enrichedData = await enrichWithLocationsAndUsers(data, true);
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
  localStorage.setItem('cms_logout', Date.now().toString());
  localStorage.removeItem('cms_logout');
};
const logLoginActivity = async (userId) => {
  try {
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
    let browser = 'Unknown Browser';
    if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
    else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Edg/i.test(userAgent)) browser = 'Edge';
    const locationInfo = `${deviceInfo} - ${browser}`;
    let ipAddress = null;
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (e) {
    }
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
    const previousLogin = await getLastLoginForUser(user.id);
    setLastLogin(previousLogin);
    await logLoginActivity(user.id);
    const { data: userLocsData } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('user_id', user.id);
    const locIds = userLocsData?.map(ul => ul.location_id) || [];
    let locationsList = [];
    if (locIds.length > 0) {
const { data: locsData } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', locIds)
        .eq('is_active', true);
      locationsList = locsData || [];
    }
    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
    const selectedLoc = locationsList.length === 1 ? locationsList[0].name : null;
    saveSession(user, locationsList, selectedLoc, previousLogin, rememberMe);
setCurrentUser(user);
    setUserLocations(locationsList);
    if (selectedLoc) {
      setSelectedLocation(selectedLoc);
    }
if (user.role === 'super_admin' || user.role === 'finance_admin' || user.role === 'it' || user.role === 'rev_rangers') {
      loadUsers();
      loadItUsers();
      loadFinanceAdminUsers();
      loadLoginHistory(user.id);
if (user.role === 'rev_rangers') {
        setAdminView('analytics');
        setAnalyticsModule('daily-recon');
      } else {
        setAdminView('analytics');
      }
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
  if ((currentUser.role === 'it' || currentUser.role === 'rev_rangers') && newUser.role === 'super_admin') {
    showMessage('error', 'You do not have permission to create Super Admin users');
    return;
  }
 const confirmed = await showConfirm('Create User', `Are you sure you want to create user "${newUser.name}"?`, 'Create', 'green');
if (!confirmed) return;
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
if ((newUser.role === 'staff' || newUser.role === 'office_manager') && newUser.locations.length > 0) {
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
  if ((currentUser.role === 'it' || currentUser.role === 'rev_rangers') && editingUser.role === 'super_admin') {
    showMessage('error', 'You do not have permission to assign Super Admin role');
    return;
  }
const confirmed = await showConfirm('Update User', `Are you sure you want to update user "${editingUser.name}"?`, 'Update', 'blue');
if (!confirmed) return;
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
  if ((editingUser.role === 'staff' || editingUser.role === 'office_manager') && editingUser.locationIds?.length > 0) {
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
    for (const [category, fileList] of Object.entries(filesByCategory)) {
      for (const file of fileList) {
        if (!file.isNew || !file.file) {
          continue;
        }
        const filePath = `${recordType}/${recordId}/${category}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('clinic-documents')
          .upload(filePath, file.file);
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          showMessage('error', `Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }
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
          uploadedFiles.push({ ...file, storage_path: filePath, id: docData.id });
        }
      }
    }
    return uploadedFiles;
  };
const saveEntry = async (moduleId) => {
    const confirmed = await showConfirm('Submit Entry', 'Are you sure you want to submit this entry?', 'Submit', 'green');
    if (!confirmed) return;;
    setSaving(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    const form = forms[moduleId];
const locationName = currentUser.role === 'rev_rangers' ? adminLocation : selectedLocation;
    const loc = locations.find(l => l.name === locationName);
    if (!loc) {
      showMessage('error', currentUser.role === 'rev_rangers' ? 'Please select a specific location from the sidebar filter' : 'Please select a location');
      setSaving(false);
      return;
    }
    let entryData = { location_id: loc.id, created_by: currentUser.id, updated_by: currentUser.id };
if (moduleId === 'daily-recon') {
  const isRevRangers = currentUser.role === 'rev_rangers';
  entryData = { ...entryData, recon_date: form.recon_date,
    cash: isRevRangers ? 0 : (parseFloat(form.cash) || 0), credit_card: isRevRangers ? 0 : (parseFloat(form.credit_card) || 0),
    checks_otc: isRevRangers ? 0 : (parseFloat(form.checks_otc) || 0), insurance_checks: isRevRangers ? (parseFloat(form.insurance_checks) || 0) : 0,
    care_credit: isRevRangers ? 0 : (parseFloat(form.care_credit) || 0), vcc: isRevRangers ? (parseFloat(form.vcc) || 0) : 0,
    efts: isRevRangers ? (parseFloat(form.efts) || 0) : 0,
    deposit_cash: parseFloat(form.deposit_cash) || 0, deposit_credit_card: parseFloat(form.deposit_credit_card) || 0,
    deposit_checks: parseFloat(form.deposit_checks) || 0, deposit_insurance: parseFloat(form.deposit_insurance) || 0,
    deposit_care_credit: parseFloat(form.deposit_care_credit) || 0, deposit_vcc: parseFloat(form.deposit_vcc) || 0,
    deposit_efts: parseFloat(form.deposit_efts) || 0, notes: form.notes, entered_by: currentUser.name };
} else if (MODULE_FIELD_CONFIG[moduleId]) {
  entryData = { ...entryData, ...MODULE_FIELD_CONFIG[moduleId].getEntryData(form, currentUser) };
}
    const { data: newEntry, error } = await supabase.from(module.table).insert(entryData).select().single();
    if (error) { showMessage('error', 'Failed to save entry: ' + error.message); setSaving(false); return; }
    await uploadFiles(moduleId, newEntry.id, files[moduleId]);
    showMessage('success', '\u2713 Entry saved successfully!');
    const resetForm = { ...forms[moduleId] };
    Object.keys(resetForm).forEach(k => { if (!k.includes('date')) resetForm[k] = ''; });
    setForms(prev => ({ ...prev, [moduleId]: { ...resetForm, [Object.keys(resetForm).find(k => k.includes('date'))]: today } }));
    setFiles(prev => ({ ...prev, [moduleId]: Object.fromEntries(Object.entries(files[moduleId]).map(([k]) => [k, []])) }));
    loadModuleData(moduleId);
    if (CHECKLIST_MODULES.some(m => m.id === moduleId) && selectedLocation) {
      const loc2 = locations.find(l => l.name === selectedLocation);
      if (loc2) loadChecklistStatus(loc2.id);
    }
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
// Generic module update: maps moduleId -> { table, title, color, getUpdateData }
const MODULE_UPDATE_MAP = {
  'billing-inquiry': { table: 'billing_inquiries', title: 'Billing Inquiry', color: 'blue', getData: (f, uid) => ({ status: f.status, billing_team_reviewed: f.billing_team_reviewed || null, date_reviewed: f.date_reviewed || null, result: f.result || null, updated_by: uid }) },
  'bills-payment': { table: 'bills_payment', title: 'Bills Payment', color: 'violet', getData: (f, uid) => ({ status: f.status, ap_reviewed: f.billing_team_reviewed || null, date_reviewed: f.date_reviewed || null, paid: f.paid, updated_by: uid }) },
  'order-requests': { table: 'order_requests', title: 'Order Request', color: 'amber', getData: (f, uid) => ({ status: f.status, reviewed_by: f.reviewed_by || null, reviewed_at: f.status === 'Reviewed' ? new Date().toISOString() : null, updated_by: uid }) },
  'refund-requests': { table: 'refund_requests', title: 'Refund Request', color: 'rose', getData: (f, uid) => ({ status: f.status, reviewed_by: f.reviewed_by || null, reviewed_at: f.status === 'Reviewed' ? new Date().toISOString() : null, result: f.result || null, updated_by: uid }) },
};
const updateModuleRecord = async (moduleId, entryId, formData) => {
  const cfg = MODULE_UPDATE_MAP[moduleId];
  if (!cfg) return;
  const confirmed = await showConfirm(`Update ${cfg.title}`, `Are you sure you want to update this ${cfg.title.toLowerCase()}?`, 'Update', cfg.color);
  if (!confirmed) return;
  const { error } = await supabase.from(cfg.table).update(cfg.getData(formData, currentUser.id)).eq('id', entryId);
  if (error) { showMessage('error', `Failed to update ${cfg.title.toLowerCase()}`); return; }
  showMessage('success', `✓ ${cfg.title} updated!`);
  loadModuleData(moduleId);
};
const updateBillingInquiry = (id, form) => updateModuleRecord('billing-inquiry', id, form);
const updateBillsPayment = (id, form) => updateModuleRecord('bills-payment', id, form);
const updateOrderRequest = (id, form) => updateModuleRecord('order-requests', id, form);
const updateRefundRequest = (id, form) => updateModuleRecord('refund-requests', id, form);
const updateChecklistEntry = async (entryId, moduleId, formData) => {
  const confirmed = await showConfirm('Update Checklist Entry', `Are you sure you want to update the status to "${formData.status}"?`, 'Update', 'blue');
  if (!confirmed) return;
  const module = ALL_MODULES.find(m => m.id === moduleId);
  if (!module) return;
  const { error } = await supabase.from(module.table).update({ status: formData.status, admin_notes: formData.admin_notes || null, updated_by: currentUser.id }).eq('id', entryId);
  if (error) { showMessage('error', 'Failed to update: ' + error.message); return; }
  showMessage('success', '✓ Checklist entry updated!');
  loadModuleData(moduleId);
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
  const { error: storageError } = await supabase.storage
    .from('clinic-documents')
    .remove([doc.storage_path]);
  if (storageError) {
    console.error('Storage delete error:', storageError);
  }
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
    await supabase.storage.from('clinic-documents').remove([doc.storage_path]);
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
    await downloadDocument(selectedDocs[0]);
    return;
  }
  setDownloadingZip(true);
  showMessage('success', `Preparing ${selectedDocs.length} files for download...`);
  try {
    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;
    const fileNameCounts = {};
    for (const doc of selectedDocs) {
      try {
        const url = await getDocumentUrl(doc.storage_path);
        if (url) {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
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
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
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
  if (recordSearch.trim()) {
    const search = recordSearch.toLowerCase();
    data = data.filter(e => {
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
    if (currentUser.role === 'rev_rangers') {
      setStaffEditForm({ recon_date: entry.recon_date || '', insurance_checks: entry.insurance_checks || '', vcc: entry.vcc || '', efts: entry.efts || '', notes: entry.notes || '' });
    } else {
      setStaffEditForm({ recon_date: entry.recon_date || '', cash: entry.cash || '', credit_card: entry.credit_card || '', checks_otc: entry.checks_otc || '', care_credit: entry.care_credit || '', notes: entry.notes || '' });
    }
  } else if (MODULE_FIELD_CONFIG[activeModule]) {
    setStaffEditForm(MODULE_FIELD_CONFIG[activeModule].getEditInitial(entry));
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
    if (currentUser.role === 'rev_rangers') {
      updateData = { ...updateData, recon_date: staffEditForm.recon_date,
        insurance_checks: parseFloat(staffEditForm.insurance_checks) || 0, vcc: parseFloat(staffEditForm.vcc) || 0,
        efts: parseFloat(staffEditForm.efts) || 0, notes: staffEditForm.notes };
    } else {
      updateData = { ...updateData, recon_date: staffEditForm.recon_date,
        cash: parseFloat(staffEditForm.cash) || 0, credit_card: parseFloat(staffEditForm.credit_card) || 0,
        checks_otc: parseFloat(staffEditForm.checks_otc) || 0, care_credit: parseFloat(staffEditForm.care_credit) || 0,
        notes: staffEditForm.notes };
    }
  } else if (MODULE_FIELD_CONFIG[activeModule]) {
    updateData = { ...updateData, ...MODULE_FIELD_CONFIG[activeModule].getUpdateData(staffEditForm) };
  }
  const { error } = await supabase.from(module.table).update(updateData).eq('id', editingStaffEntry);
  if (error) { showMessage('error', 'Failed to update: ' + error.message); setSaving(false); return; }
  showMessage('success', '\u2713 Entry updated!');
  setEditingStaffEntry(null);
  setStaffEditForm({});
  loadModuleData(activeModule);
  if (CHECKLIST_MODULES.some(m => m.id === activeModule) && selectedLocation) {
    const loc = locations.find(l => l.name === selectedLocation);
    if (loc) loadChecklistStatus(loc.id);
  }
  setSaving(false);
};
const getStaffEntries = () => {
  if (currentUser?.role === 'staff' && CHECKLIST_MODULES.some(m => m.id === activeModule)) {
    return [];
  }
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
  const visibleModules = currentUser?.role === 'rev_rangers'
    ? MODULES.filter(m => m.id === 'billing-inquiry')
    : currentUser?.role === 'finance_admin'
    ? MODULES.filter(m => m.id !== 'billing-inquiry')
    : MODULES;
  const getModuleName = (moduleId) => {
    const mod = ALL_MODULES.find(m => m.id === moduleId);
    return mod?.name || moduleId;
  };
if (!currentUser) {
  return (
    <div className={LAYOUT.loginBg}>
      <div className={LAYOUT.loginCard}>
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
            className={`w-full py-4 ${BTN.primary} rounded-xl text-lg font-semibold hover:shadow-blue-500/30 disabled:opacity-50`}
          >
            {loginLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Login →'}
          </button>
<p className="text-xs text-center text-gray-400">BETA Version 0.87</p>
        </div>
      </div>
    </div>
  );
}
if ((!isAdmin || isOfficeManager) && !selectedLocation && userLocations.length > 1) {
    return (
      <div className={LAYOUT.loginBg}>
        <div className={LAYOUT.loginCard}>
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
  const entries = getModuleEntries();
return (
    <div className={LAYOUT.pageBg}>
      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div className={LAYOUT.confirmOverlay} onClick={confirmDialog.onCancel}>
          <div className={`${LAYOUT.confirmCard} animate-in fade-in zoom-in duration-200`} onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className={`${ICON_BOX.xlRound} mx-auto mb-4 ${CONFIRM_COLORS[confirmDialog.confirmColor]?.bg || 'bg-amber-100'}`}>
                <AlertCircle className={`w-7 h-7 ${CONFIRM_COLORS[confirmDialog.confirmColor]?.icon || 'text-amber-600'}`} />
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
                className={`flex-1 py-4 text-white font-semibold transition-all ${CONFIRM_COLORS[confirmDialog.confirmColor]?.btn || CONFIRM_COLORS.blue.btn}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
        {passwordDialog.open && (
  <div className={LAYOUT.passwordOverlay} onClick={passwordDialog.onCancel}>
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
        <button onClick={() => passwordDialog.onConfirm(passwordDialog.password)} className={`flex-1 py-4 font-semibold ${BTN.danger}`}>Confirm Delete</button>
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
  financeAdminUsers={financeAdminUsers}
  onUpdateStatus={(entryId, newStatus, additionalFields) => {
    updateEntryStatus('it-requests', entryId, newStatus, additionalFields);
    setViewingEntry(null);
  }}
  onUpdateBillingInquiry={async (entryId, formData) => {
    await updateBillingInquiry(entryId, formData);
    setViewingEntry(null);
  }}
onUpdateBillsPayment={async (entryId, formData) => {
    await updateBillsPayment(entryId, formData);
    setViewingEntry(null);
  }}
onUpdateOrderRequest={async (entryId, formData) => {
    await updateOrderRequest(entryId, formData);
    setViewingEntry(null);
  }}
onUpdateRefundRequest={async (entryId, formData) => {
    await updateRefundRequest(entryId, formData);
    setViewingEntry(null);
  }}
  onUpdateChecklist={async (entryId, moduleId, formData) => {
    await updateChecklistEntry(entryId, moduleId, formData);
    setViewingEntry(null);
  }}
onDelete={isITViewOnly ? null : async (recordId) => {
    const deleted = await deleteRecord(activeModule, recordId);
    if (deleted) setViewingEntry(null);
  }}
/>
      <FloatingChat messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={askAI} loading={aiLoading} userRole={currentUser?.role} />
      {/* Sidebar */}
<div className={`${LAYOUT.sidebar} ${sidebarOpen ? LAYOUT.sidebarOpen : LAYOUT.sidebarClosed}`}>
<div className={`p-5 flex-shrink-0 ${ROLE_STYLES[currentUser?.role]?.gradient || ROLE_STYLES.staff.gradient}`}>     
          <div className="flex items-center gap-3">
            <div className={ICON_BOX.sidebarAvatar}>
              {currentUser?.role === 'it' ? <Monitor className="w-6 h-6 text-white" /> : currentUser?.role === 'rev_rangers' ? <Shield className="w-6 h-6 text-white" /> : currentUser?.role === 'office_manager' ? <Users className="w-6 h-6 text-white" /> : isSuperAdmin ? <Shield className="w-6 h-6 text-white" /> : isAdmin ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
            </div>
            <div className="text-white">
              <p className="font-semibold">{currentUser.name}</p>
<p className="text-sm text-white/80">
  {isAdmin || currentUser?.role === 'it' || currentUser?.role === 'office_manager' ? formatRole(currentUser?.role) : selectedLocation}
</p>
            </div>
          </div>
        </div>
        {isAdmin && (
            <div className="p-4 border-b bg-purple-50 flex-shrink-0">
            <label className="text-xs font-medium text-purple-700 mb-1.5 block">Filter by Location</label>
            <select value={adminLocation} onChange={e => setAdminLocation(e.target.value)} className={`w-full ${INPUT.filterPurple}`}>
              <option value="all">📍 All Locations</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        )}
        {!isAdmin && userLocations.length > 1 && (
  <div className="p-4 border-b bg-blue-50 flex-shrink-0">
            <label className="text-xs font-medium text-blue-700 mb-1.5 block">Switch Location</label>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className={`w-full ${INPUT.filter}`}>
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
{(isOfficeManager || currentUser?.role === 'super_admin' || currentUser?.role === 'rev_rangers' || currentUser?.role === 'it' || currentUser?.role === 'finance_admin') && currentUser?.role !== 'staff' && (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-3 flex items-center gap-2 ${
                isOfficeManager && CHECKLIST_MODULES.every(m => checklistStatus[m.id]?.submitted)
                  ? 'text-emerald-600'
                  : 'text-gray-400'
              }`}>
                {isOfficeManager && CHECKLIST_MODULES.every(m => checklistStatus[m.id]?.submitted) && (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Office Task Checklist
              </p>
              {CHECKLIST_MODULES.map(m => {
                const colors = MODULE_COLORS[m.id];
                const isActive = activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'settings';
                const submitted = isOfficeManager && checklistStatus[m.id]?.submitted;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      submitted
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                        : isActive
                          ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                          : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {isOfficeManager && (
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {submitted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      submitted ? 'bg-emerald-100' : isActive ? colors.light : 'bg-gray-100'
                    }`}>
                      <m.icon className={`w-4 h-4 ${
                        submitted ? 'text-emerald-600' : isActive ? colors.text : 'text-gray-500'
                      }`} />
                    </div>
                    <span className="text-sm font-medium">{m.name}</span>
                  </button>
                );
              })}
              <div className="border-t my-3"></div>
            </>
          )}
{visibleModules.length > 0 && (
          <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Modules</p>
          {visibleModules.map(m => {
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
          </>
          )}
{(currentUser?.role === 'super_admin' || currentUser?.role === 'it' || !isAdmin || isOfficeManager) && (
            <>
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
            </>
          )}
{!isAdmin && (
  <>
    <div className="border-t my-4"></div>
    <button onClick={() => { setView('sop'); loadSOPs(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${view === 'sop' ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${view === 'sop' ? 'bg-blue-100' : 'bg-gray-100'}`}><BookOpen className="w-4 h-4" /></div>
      <span className="text-sm font-medium">SOPs</span>
    </button>
  </>
)}
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
              <button onClick={() => { setAdminView('sop'); loadSOPs(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'sop' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'sop' ? 'bg-purple-100' : 'bg-gray-100'}`}><BookOpen className="w-4 h-4" /></div>
                <span className="text-sm font-medium">SOPs</span>
              </button>
{(currentUser?.role === 'super_admin' || currentUser?.role === 'it' || currentUser?.role === 'rev_rangers') && (
                <button onClick={() => { setAdminView('users'); loadUsers(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'users' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'users' ? 'bg-purple-100' : 'bg-gray-100'}`}><Users className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">Users</span>
                </button>
              )}
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
<header className={LAYOUT.header}>
        <div className="flex items-center justify-between px-4 py-2 min-h-[70px]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-5 h-5" /></button>
              <div>
<h1 className="font-bold text-gray-800 text-lg">
                  {isAdmin ? (adminView === 'users' ? 'User Management' : adminView === 'export' ? 'Export Data' : adminView === 'documents' ? 'All Documents' : adminView === 'sop' ? 'Standard Operating Procedures' : adminView === 'settings' ? 'Settings' : adminView === 'analytics' ? 'Analytics' : adminView === 'rev-entry' ? `New Entry: ${currentModule?.name}` : currentUser?.role === 'rev_rangers' ? `Review: ${currentModule?.name}` : currentModule?.name) : (view === 'settings' ? 'Settings' : view === 'sop' ? 'Standard Operating Procedures' : currentModule?.name)}
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
{isAdmin && currentUser?.role === 'rev_rangers' && activeModule === 'daily-recon' ? (
              [{ id: 'rev-entry', label: '+ New Entry' }, { id: 'records', label: 'Records' }].map(tab => (
                <button key={tab.id} onClick={() => setAdminView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${adminView === tab.id ? BTN.amber : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
              ))
            ) : isAdmin && adminView === 'records' ? (
              <button className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${currentColors?.accent} text-white shadow-lg`}>
                <FileText className="w-4 h-4" />Records
              </button>
            ) : !isAdmin && view !== 'settings' ? (
              [{ id: 'entry', label: '+ New Entry' }, { id: 'history', label: 'History' }].map(tab => (
<button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === tab.id ? BTN.tabActive : BTN.tabInactive}`}>{tab.label}</button>
              ))
            ) : isAdmin && adminView === 'records' && currentUser?.role === 'rev_rangers' ? (
              <button className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                <FileText className="w-4 h-4" />Review Submissions
              </button>
            ) : null}
          </div>
        </header>
{/* Floating Toast Notification */}
      {message.text && (
        <div className={`fixed bottom-24 right-6 z-50 max-w-sm animate-in slide-in-from-right-5 fade-in duration-300`}>
          <div className={`p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3 ${
            message.type === 'error'
              ? LAYOUT.toastError
              : LAYOUT.toastSuccess
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
                  <button onClick={() => setShowAddUser(true)} className={`flex items-center gap-2 px-4 py-2.5 ${BTN.admin}`}>
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
                    className={INPUT.search}
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {(showAddUser || editingUser) && (
                <div className={CARD.base}>
                  <h3 className="font-semibold mb-4 text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h3>
<div className="grid grid-cols-2 gap-4">
                    <InputField label="Name *" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                    <InputField label="Username *" value={editingUser ? (editingUser.username || '') : newUser.username} onChange={e => editingUser ? setEditingUser({...editingUser, username: e.target.value}) : setNewUser({...newUser, username: e.target.value})} placeholder="Login username" />
                    <InputField label="Email *" value={editingUser ? editingUser.email : newUser.email} onChange={e => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} />
                    <PasswordField label={editingUser ? "New Password" : "Password *"} value={editingUser ? (editingUser.newPassword || '') : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, newPassword: e.target.value}) : setNewUser({...newUser, password: e.target.value})} placeholder={editingUser ? "Leave blank to keep current" : ""} />
<InputField label="Role" value={editingUser ? editingUser.role : newUser.role} onChange={e => editingUser ? setEditingUser({...editingUser, role: e.target.value}) : setNewUser({...newUser, role: e.target.value})}options={currentUser?.role === 'super_admin' ? ['staff', 'office_manager', 'rev_rangers', 'finance_admin', 'it', 'super_admin'] : (currentUser?.role === 'it' || currentUser?.role === 'rev_rangers') ? ['staff', 'office_manager', 'rev_rangers', 'finance_admin', 'it'] : ['staff', 'office_manager', 'rev_rangers', 'finance_admin']} />
                  </div>
{((editingUser ? editingUser.role : newUser.role) === 'staff' || (editingUser ? editingUser.role : newUser.role) === 'office_manager') && (
                    <div className="mt-4">
                      <label className="text-xs font-medium text-gray-600 mb-2 block">Assigned Locations</label>
                      <div className="flex flex-wrap gap-2">
                        {locations.map(loc => (
                          <button
                            key={loc.id}
                            onClick={() => toggleUserLocation(loc.id, !!editingUser)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${(editingUser ? editingUser.locationIds : newUser.locations)?.includes(loc.id) ? BTN.admin : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-5">
                    <button onClick={editingUser ? updateUser : addUser} className={`flex-1 py-3 ${BTN.admin}`}>
                      {editingUser ? 'Update' : 'Add'} User
                    </button>
                    <button onClick={() => { setShowAddUser(false); setEditingUser(null); }} className={`px-6 py-3 ${BTN.cancel}`}>Cancel</button>
                  </div>
                </div>
              )}
<div className={CARD.section}>
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
           <div className={`${ICON_BOX.avatar} ${ROLE_STYLES[u.role]?.avatar || ROLE_STYLES.staff.avatar}`}>
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
{(u.role === 'finance_admin' || u.role === 'super_admin' || u.role === 'it' || u.role === 'rev_rangers') && (
  <span className={`text-xs font-medium ${ROLE_STYLES[u.role]?.textAccent || 'text-purple-600'}`}>All locations access</span>
)}
{u.role === 'office_manager' && u.locations?.length === 0 && (
  <span className="text-xs font-medium text-orange-600">No locations assigned</span>
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
{u.id !== currentUser.id && !(currentUser.role === 'it' && u.role === 'super_admin') && (
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
    <div className={CARD.analytics}>
<div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setAnalyticsModule('checklist-overview')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${analyticsModule === 'checklist-overview' ? BTN.save : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <ClipboardList className="w-4 h-4" />
          Daily Checklist
        </button>
        <div className="w-px h-8 bg-gray-300 mx-1"></div>
 {[
          CHECKLIST_MODULES.find(m => m.id === 'daily-recon'),
          ...(currentUser?.role === 'rev_rangers' ? MODULES.filter(m => m.id === 'billing-inquiry') : MODULES)
        ].map(m => {
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
    <div className={CARD.analytics}>
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
              className={`${INPUT.filter}`}
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
              className={`${INPUT.filter}`}
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
      if (!moduleData[analyticsModule] && analyticsModule !== 'checklist-overview') {
        return (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading data...</p>
          </div>
        );
      }
      if (adminLocation !== 'all') {
        data = data.filter(r => r.locations?.name === adminLocation);
      }
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
if (filteredData.length === 0 && analyticsModule !== 'checklist-overview') {
        return <EmptyState icon={BarChart3} message="No data available for this period" />;
      }
      if (analyticsModule === 'checklist-overview') {
        const allLoaded = CHECKLIST_MODULES.every(m => moduleData[m.id] !== undefined);
        if (!allLoaded) {
          return (
            <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading checklist data...</p>
            </div>
          );
        }
        const [cYear, cMonth] = checklistCalendarDate.split('-').map(Number);
        const daysInMonth = new Date(cYear, cMonth, 0).getDate();
        const hawaiiToday = getHawaiiToday();
        const activeLocs = locations;
        const subMap = {};
        CHECKLIST_MODULES.forEach(mod => {
          subMap[mod.id] = {};
          (moduleData[mod.id] || []).forEach(entry => {
            const d = new Date(entry.created_at);
            const hDate = `${d.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', year: 'numeric' })}-${String(d.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', month: '2-digit' })).padStart(2,'0')}-${String(d.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', day: '2-digit' })).padStart(2,'0')}`;
            const dateKey = new Date(entry.created_at).toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
            if (!subMap[mod.id][dateKey]) subMap[mod.id][dateKey] = {};
            const existing = subMap[mod.id][dateKey][entry.location_id];
            if (!existing || new Date(entry.created_at) > new Date(existing.created_at)) {
              subMap[mod.id][dateKey][entry.location_id] = entry;
            }
          });
        });
        const getStat = (modId, dateStr, locId) => {
          const e = subMap[modId]?.[dateStr]?.[locId];
          if (!e) return 'missing';
          return e.status || 'Pending';
        };
        const statDot = (s) => {
          if (s === 'Approved' || s === 'Accounted') return 'bg-emerald-500';
          if (s === 'Needs Revisions' || s === 'Rejected') return 'bg-red-500';
          if (s === 'Pending') return 'bg-amber-400';
          return 'bg-gray-300';
        };
        const statBg = (s) => {
          if (s === 'Approved' || s === 'Accounted') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          if (s === 'Needs Revisions' || s === 'Rejected') return 'bg-red-100 text-red-700 border-red-200';
          if (s === 'Pending') return 'bg-amber-100 text-amber-700 border-amber-200';
          return 'bg-gray-100 text-gray-400 border-gray-200';
        };
        const statLabel = (s) => {
          if (s === 'Approved' || s === 'Accounted') return 'Approved';
          if (s === 'Needs Revisions' || s === 'Rejected') return 'Revision';
          if (s === 'Pending') return 'Pending';
          return 'Missing';
        };
        const modAbbrev = { 'daily-recon': 'DR', 'completed-procedure': 'CP', 'claims-documents': 'CD' };
        const filteredMods = checklistAnalyticsTab === 'overview' ? CHECKLIST_MODULES : CHECKLIST_MODULES.filter(m => m.id === checklistAnalyticsTab);
        const allDates = [];
        for (let d = 1; d <= daysInMonth; d++) {
          allDates.push(`${cYear}-${String(cMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
        const pastDates = allDates.filter(d => {
          if (d > hawaiiToday) return false;
          const dayOfWeek = new Date(d + 'T12:00:00').getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sun & Sat
        });
        let todaySubmitted = 0, todayApproved = 0, todayRevisions = 0;
        const todayTotal = activeLocs.length * CHECKLIST_MODULES.length;
        activeLocs.forEach(loc => {
          CHECKLIST_MODULES.forEach(mod => {
            const s = getStat(mod.id, hawaiiToday, loc.id);
            if (s !== 'missing') todaySubmitted++;
            if (s === 'Approved' || s === 'Accounted') todayApproved++;
            if (s === 'Needs Revisions' || s === 'Rejected') todayRevisions++;
          });
        });
        const weekDates = pastDates.slice(-5);
        let weekTotal = 0, weekSubmitted = 0;
        weekDates.forEach(date => {
          activeLocs.forEach(loc => {
            CHECKLIST_MODULES.forEach(mod => {
              weekTotal++;
              if (getStat(mod.id, date, loc.id) !== 'missing') weekSubmitted++;
            });
          });
        });
        let pendingReviews = 0;
        CHECKLIST_MODULES.forEach(mod => {
          (moduleData[mod.id] || []).forEach(e => {
            if (e.status === 'Pending' || !e.status) pendingReviews++;
          });
        });
        const locCompliance = activeLocs.map(loc => {
          let total = 0, submitted = 0, approved = 0, revisions = 0;
          pastDates.forEach(date => {
            CHECKLIST_MODULES.forEach(mod => {
              total++;
              const s = getStat(mod.id, date, loc.id);
              if (s !== 'missing') submitted++;
              if (s === 'Approved' || s === 'Accounted') approved++;
              if (s === 'Needs Revisions' || s === 'Rejected') revisions++;
            });
          });
          return { loc, total, submitted, approved, revisions, rate: total > 0 ? (submitted / total * 100) : 0 };
        }).sort((a, b) => b.rate - a.rate);
        const perfectToday = activeLocs.filter(loc => {
          return CHECKLIST_MODULES.every(mod => getStat(mod.id, hawaiiToday, loc.id) !== 'missing');
        }).length;
        const prevMonth = () => {
          const d = new Date(cYear, cMonth - 2, 1);
          setChecklistCalendarDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        };
        const nextMonth = () => {
          const d = new Date(cYear, cMonth, 1);
          const now = new Date();
          if (d <= now) setChecklistCalendarDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        };
        const monthName = new Date(cYear, cMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return (
          <>
            {/* Sub-module Tabs */}
            <div className={CARD.analytics}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'overview', label: 'All Modules', icon: ClipboardList },
                    ...CHECKLIST_MODULES.map(m => ({ id: m.id, label: m.name, icon: m.icon }))
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setChecklistAnalyticsTab(tab.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${checklistAnalyticsTab === tab.id ? BTN.save : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">{monthName}</span>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Today's Status Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Checklist Status
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{new Date(hawaiiToday + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${todaySubmitted === todayTotal ? 'bg-emerald-100 text-emerald-700' : todaySubmitted > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {todayTotal > 0 ? Math.round(todaySubmitted / todayTotal * 100) : 0}%
                  </span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-gray-600">Approved</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="text-gray-600">Pending Review</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-gray-600">Needs Revision</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-300"></div><span className="text-gray-600">Not Submitted</span></div>
              </div>
              <div className="space-y-2">
                {activeLocs.map(loc => {
                  const statuses = filteredMods.map(mod => ({
                    mod,
                    status: getStat(mod.id, hawaiiToday, loc.id)
                  }));
                  const completed = statuses.filter(s => s.status !== 'missing').length;
                  const total = statuses.length;
                  const allDone = completed === total;
                  return (
                    <div key={loc.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${allDone ? 'bg-emerald-50 border-emerald-200' : completed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        {allDone ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                        <span className="font-medium text-sm text-gray-800 truncate">{loc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {statuses.map(({ mod, status }) => (
                          <div key={mod.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${statBg(status)}`}>
                            {status !== 'missing' ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            <span>{modAbbrev[mod.id]}</span>
                            <span className="hidden sm:inline">· {statLabel(status)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-bold ${allDone ? 'text-emerald-600' : completed > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {completed}/{total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* KPI Cards */}
            {renderKPICards([
              { color: 'emerald', label: "Today's Completion", value: `${todayTotal > 0 ? Math.round(todaySubmitted / todayTotal * 100) : 0}%`, detail: `${todaySubmitted}/${todayTotal} submitted` },
              { color: 'blue', label: 'Weekly Average', value: `${weekTotal > 0 ? Math.round(weekSubmitted / weekTotal * 100) : 0}%`, detail: `Last ${weekDates.length} days` },
              { color: 'amber', label: 'Pending Reviews', value: pendingReviews, detail: 'Across all modules' },
              { color: 'purple', label: '100% Today', value: `${perfectToday}/${activeLocs.length}`, detail: 'Locations complete' },
            ])}
            {/* Calendar Grid */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" /> {monthName} — Submission Calendar
              </h3>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200 min-w-[120px]">Date</th>
                      {activeLocs.map(loc => (
                        <th key={loc.id} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200 min-w-[80px]">
                          {loc.name.length > 10 ? loc.name.slice(0, 10) + '…' : loc.name}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200 min-w-[60px]">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...pastDates].reverse().map(dateStr => {
                      const dayDate = new Date(dateStr + 'T12:00:00');
                      const isToday = dateStr === hawaiiToday;
                      let daySubmitted = 0, dayTotal = 0;
                      return (
                      <tr key={dateStr} className={`${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className={`sticky left-0 z-10 px-3 py-2 whitespace-nowrap border-b border-gray-100 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                                {dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              {isToday && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">TODAY</span>}
                            </div>
                          </td>
                          {activeLocs.map(loc => {
                            const cellStatuses = filteredMods.map(mod => getStat(mod.id, dateStr, loc.id));
                            const cellSubmitted = cellStatuses.filter(s => s !== 'missing').length;
                            dayTotal += filteredMods.length;
                            daySubmitted += cellSubmitted;
                            const cellComplete = cellSubmitted === filteredMods.length;
                            return (
                              <td key={loc.id} className={`px-2 py-2 text-center border-b border-gray-100 ${cellComplete && cellSubmitted > 0 ? '' : ''}`}>
                                <div className="flex items-center justify-center gap-1">
                                  {filteredMods.map((mod, i) => {
                                    const s = getStat(mod.id, dateStr, loc.id);
                                    return (
                                      <div
                                        key={mod.id}
                                        className={`${filteredMods.length === 1 ? 'w-5 h-5' : 'w-3.5 h-3.5'} rounded-full ${statDot(s)} transition-all`}
                                        title={`${mod.name}: ${statLabel(s)}`}
                                      />
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center border-b border-gray-100">
                            {(() => {
                              let dSub = 0, dTot = 0;
                              activeLocs.forEach(loc => {
                                filteredMods.forEach(mod => {
                                  dTot++;
                                  if (getStat(mod.id, dateStr, loc.id) !== 'missing') dSub++;
                                });
                              });
                              const pct = dTot > 0 ? Math.round(dSub / dTot * 100) : 0;
                              return (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${pct === 100 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : pct > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {pct}%
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Location Compliance Rankings */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Location Compliance — {monthName}
              </h3>
              <div className="space-y-3">
                {locCompliance.map((item, idx) => {
                  const maxRate = locCompliance[0]?.rate || 100;
                  return (
                    <div key={item.loc.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-emerald-500 text-white' : idx === 1 ? 'bg-blue-500 text-white' : idx === 2 ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{item.loc.name}</span>
                        </div>
                        <span className={`text-lg font-bold ${item.rate >= 90 ? 'text-emerald-600' : item.rate >= 70 ? 'text-amber-600' : item.rate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                          {item.rate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full transition-all ${item.rate >= 90 ? 'bg-emerald-500' : item.rate >= 70 ? 'bg-amber-500' : item.rate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${item.rate}%` }}></div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{item.submitted}/{item.total} submitted</span>
                        <span className="text-emerald-600">{item.approved} approved</span>
                        {item.revisions > 0 && <span className="text-red-600">{item.revisions} revisions</span>}
                        <span className="text-gray-400">{item.total - item.submitted} missing</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Per-Module Breakdown */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-teal-500" /> Module Breakdown — {monthName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CHECKLIST_MODULES.map(mod => {
                  let modSubmitted = 0, modApproved = 0, modRevisions = 0, modTotal = 0;
                  pastDates.forEach(date => {
                    activeLocs.forEach(loc => {
                      modTotal++;
                      const s = getStat(mod.id, date, loc.id);
                      if (s !== 'missing') modSubmitted++;
                      if (s === 'Approved' || s === 'Accounted') modApproved++;
                      if (s === 'Needs Revisions' || s === 'Rejected') modRevisions++;
                    });
                  });
                  const modRate = modTotal > 0 ? Math.round(modSubmitted / modTotal * 100) : 0;
                  const colors = MODULE_COLORS[mod.id];
                  return (
                    <div key={mod.id} className={`p-4 rounded-xl border-2 ${colors?.border} ${colors?.bg}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <mod.icon className={`w-5 h-5 ${colors?.text}`} />
                        <span className={`font-semibold ${colors?.text}`}>{mod.name}</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800 mb-2">{modRate}%</p>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full ${colors?.accent}`} style={{ width: `${modRate}%` }}></div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span className="font-medium">{modSubmitted}/{modTotal}</span></div>
                        <div className="flex justify-between"><span className="text-emerald-600">Approved</span><span className="font-medium">{modApproved}</span></div>
                        {modRevisions > 0 && <div className="flex justify-between"><span className="text-red-600">Needs Revision</span><span className="font-medium">{modRevisions}</span></div>}
                        <div className="flex justify-between"><span className="text-gray-400">Missing</span><span className="font-medium">{modTotal - modSubmitted}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      }
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
        const byLocation = {};
        filteredData.forEach(r => {
          const loc = r.locations?.name || 'Unknown';
          if (!byLocation[loc]) byLocation[loc] = { collected: 0, deposited: 0, count: 0 };
          byLocation[loc].collected += parseFloat(r.total_collected) || 0;
          byLocation[loc].deposited += parseFloat(r.total_deposit) || 0;
          byLocation[loc].count += 1;
        });
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
              <div className={ANALYTICS_CARDS.emerald}>
                <p className="text-emerald-100 text-sm font-medium">Total Collected</p>
                <p className="text-2xl font-bold mt-1">${totalCollected.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">{filteredData.length} entries</p>
              </div>
              <div className={ANALYTICS_CARDS.blue}>
                <p className="text-blue-100 text-sm font-medium">Total Deposited</p>
                <p className="text-2xl font-bold mt-1">${totalDeposited.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-blue-200 text-xs mt-2">{accountedCount} accounted</p>
              </div>
              <div className={`${variance > 0 ? ANALYTICS_CARDS.amber : ANALYTICS_CARDS.gray}`}>
                <p className="text-amber-100 text-sm font-medium">Variance</p>
                <p className="text-2xl font-bold mt-1 flex items-center gap-1">
                  {variance > 0 ? <TrendingUp className="w-5 h-5" /> : variance < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                  ${Math.abs(variance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
                <p className="text-amber-200 text-xs mt-2">{variance > 0 ? 'Pending deposit' : variance < 0 ? 'Over deposited' : 'Balanced'}</p>
              </div>
              <div className={ANALYTICS_CARDS.purple}>
                <p className="text-purple-100 text-sm font-medium">Review Status</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-purple-200 text-sm">pending</p>
                </div>
                <p className="text-purple-200 text-xs mt-2">{rejectedCount} rejected</p>
              </div>
            </div>
            {/* Payment Method Breakdown */}
            <div className={CARD.base}>
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
              <div className={CARD.base}>
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
{/* Weekly Trend - Last 4 Weeks */}
            {Object.keys(byWeek).length > 0 && (
              <div className={CARD.base}>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Weekly Summary
                </h3>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-gray-600">Collected</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-gray-600">Deposited</span></div>
                </div>
                <div className="space-y-4">
                  {Object.entries(byWeek)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 4)
                    .map(([weekStart, stats]) => {
                      const startDate = new Date(weekStart);
                      const endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + 6);
                      const maxVal = Math.max(...Object.values(byWeek).map(w => Math.max(w.collected, w.deposited)));
                      const collectedPct = maxVal > 0 ? (stats.collected / maxVal * 100) : 0;
                      const depositedPct = maxVal > 0 ? (stats.deposited / maxVal * 100) : 0;
                      return (
                        <div key={weekStart} className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-400">
                              {startDate.getFullYear()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-16">Collected</span>
                              <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width: `${collectedPct}%`}}></div>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600 w-20 text-right">${stats.collected.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-16">Deposited</span>
                              <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{width: `${depositedPct}%`}}></div>
                              </div>
                              <span className="text-xs font-semibold text-blue-600 w-20 text-right">${stats.deposited.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </div>
                          {stats.collected !== stats.deposited && (
                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end">
                              <span className={`text-xs font-medium ${stats.collected > stats.deposited ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {stats.collected > stats.deposited ? `$${(stats.collected - stats.deposited).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} pending` : 'Balanced ✓'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {/* Status Breakdown */}
            <div className={CARD.base}>
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
      if (analyticsModule === 'billing-inquiry') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount_in_question) || 0), 0);
        const avgAmount = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        const pendingCount = filteredData.filter(r => r.status === 'Pending' || !r.status).length;
        const resolvedCount = filteredData.filter(r => r.status === 'Resolved').length;
        const inProgressCount = filteredData.filter(r => r.status === 'In Progress').length;
        const byType = {};
        INQUIRY_TYPES.forEach(t => byType[t] = { count: 0, amount: 0 });
        filteredData.forEach(r => {
          const type = r.inquiry_type || 'Other';
          if (!byType[type]) byType[type] = { count: 0, amount: 0 };
          byType[type].count += 1;
          byType[type].amount += parseFloat(r.amount_in_question) || 0;
        });
        const byLocation = groupByLocation(filteredData, 'amount_in_question');
        return (
          <>
            {/* KPI Cards */}
            {renderKPICards([
              { color: 'blue', label: 'Total Inquiries', value: filteredData.length, detail: analyticsRange },
              { color: 'emerald', label: 'Total Amount', value: `$${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, detail: 'In question' },
              { color: 'violet', label: 'Avg. Amount', value: `$${avgAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, detail: 'Per inquiry' },
              { color: 'amber', label: 'Resolution Rate', value: `${filteredData.length > 0 ? ((resolvedCount / filteredData.length) * 100).toFixed(0) : 0}%`, detail: `${resolvedCount} resolved` },
            ])}
            {/* Inquiry Type Breakdown */}
            <div className={CARD.base}>
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
            <div className={CARD.base}>
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
              <div className={CARD.base}>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" /> By Location
                </h3>
                <div className="space-y-3">
                  {Object.entries(byLocation).sort((a, b) => b[1].count - a[1].count).map(([loc, stats]) => (
                    <div key={loc} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="font-medium text-gray-800">{loc}</span>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{stats.count} inquiries</p>
                        <p className="text-sm text-gray-500">${stats.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      if (analyticsModule === 'bills-payment') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const paidTotal = filteredData.filter(r => r.paid === 'Yes').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const pendingTotal = filteredData.filter(r => r.paid !== 'Yes').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const paidCount = filteredData.filter(r => r.paid === 'Yes').length;
        const byVendor = {};
        filteredData.forEach(r => {
          const vendor = r.vendor || 'Unknown';
          if (!byVendor[vendor]) byVendor[vendor] = { count: 0, amount: 0, paid: 0 };
          byVendor[vendor].count += 1;
          byVendor[vendor].amount += parseFloat(r.amount) || 0;
          if (r.paid === 'Yes') byVendor[vendor].paid += parseFloat(r.amount) || 0;
        });
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
              <div className={ANALYTICS_CARDS.violet}>
                <p className="text-violet-100 text-sm font-medium">Total Bills</p>
                <p className="text-2xl font-bold mt-1">${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-violet-200 text-xs mt-2">{filteredData.length} bills</p>
              </div>
              <div className={ANALYTICS_CARDS.emerald}>
                <p className="text-emerald-100 text-sm font-medium">Paid</p>
                <p className="text-2xl font-bold mt-1">${paidTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-emerald-200 text-xs mt-2">{paidCount} bills paid</p>
              </div>
              <div className={ANALYTICS_CARDS.amber}>
                <p className="text-amber-100 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">${pendingTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-amber-200 text-xs mt-2">{filteredData.length - paidCount} unpaid</p>
              </div>
              <div className={`${overdue.length > 0 ? ANALYTICS_CARDS.red : ANALYTICS_CARDS.gray}`}>
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
            <div className={CARD.base}>
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
      if (analyticsModule === 'order-requests') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const avgOrder = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        const byVendor = {};
        filteredData.forEach(r => {
          const vendor = r.vendor || 'Unknown';
          if (!byVendor[vendor]) byVendor[vendor] = { count: 0, amount: 0 };
          byVendor[vendor].count += 1;
          byVendor[vendor].amount += parseFloat(r.amount) || 0;
        });
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
            {renderKPICards([
              { color: 'amber', label: 'Total Orders', value: filteredData.length, detail: analyticsRange },
              { color: 'emerald', label: 'Total Value', value: `$${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, detail: 'All orders' },
              { color: 'blue', label: 'Avg. Order', value: `$${avgOrder.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, detail: 'Per order' },
              { color: 'violet', label: 'Vendors', value: Object.keys(byVendor).length, detail: 'Unique vendors' },
            ])}
            {/* Vendor Spending */}
            <div className={CARD.base}>
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
              <div className={CARD.base}>
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
      if (analyticsModule === 'refund-requests') {
        const totalAmount = filteredData.reduce((sum, r) => sum + (parseFloat(r.amount_requested) || 0), 0);
        const avgRefund = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        const pendingCount = filteredData.filter(r => r.status === 'Pending' || !r.status).length;
        const approvedCount = filteredData.filter(r => r.status === 'Approved').length;
        const completedCount = filteredData.filter(r => r.status === 'Completed').length;
        const deniedCount = filteredData.filter(r => r.status === 'Denied').length;
        const byType = {};
        filteredData.forEach(r => {
          const type = r.type || 'Other';
          if (!byType[type]) byType[type] = { count: 0, amount: 0 };
          byType[type].count += 1;
          byType[type].amount += parseFloat(r.amount_requested) || 0;
        });
        const byLocation = groupByLocation(filteredData, 'amount_requested');
        return (
          <>
            {/* KPI Cards */}
            {renderKPICards([
              { color: 'rose', label: 'Total Requests', value: filteredData.length, detail: analyticsRange },
              { color: 'emerald', label: 'Total Amount', value: `$${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, detail: 'Requested' },
              { color: 'blue', label: 'Avg. Refund', value: `$${avgRefund.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, detail: 'Per request' },
              { color: 'amber', label: 'Pending', value: pendingCount, detail: 'Awaiting review' },
            ])}
            {/* Status Distribution */}
            <div className={CARD.base}>
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
              <div className={CARD.base}>
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
              <div className={CARD.base}>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-500" /> By Location
                </h3>
                <div className="space-y-3">
                  {Object.entries(byLocation).sort((a, b) => b[1].total - a[1].total).map(([loc, stats]) => (
                    <div key={loc} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="font-medium text-gray-800">{loc}</span>
                      <div className="text-right">
                        <p className="font-bold text-rose-600">{stats.count} requests</p>
                        <p className="text-sm text-gray-500">${stats.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
    <div className={CARD.base}>
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
                className={`flex items-center gap-2 px-4 py-2 ${BTN.danger} text-sm disabled:opacity-50`}
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
            <div className={CARD.base}>
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
              <button onClick={exportToCSV} className={`w-full py-4 ${BTN.admin} rounded-xl font-semibold flex items-center justify-center gap-2`}>
                <Download className="w-5 h-5" />Export to CSV
              </button>
            </div>
          )}
{/* SOP View - Admin */}
{isAdmin && adminView === 'sop' && (
  <div className="space-y-4">
    <div className={CARD.base}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
        <div><h2 className="font-semibold text-gray-800">Upload SOP</h2><p className="text-sm text-gray-500">Add standard operating procedure documents</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col"><label className={INPUT.label}>Title *</label><input type="text" value={sopTitle} onChange={e => setSOPTitle(e.target.value)} placeholder="e.g., Front Desk Opening Procedure" className={`${INPUT.wrapper} p-2.5`} /></div>
        <div className="flex flex-col"><label className={INPUT.label}>Description (optional)</label><input type="text" value={sopDescription} onChange={e => setSOPDescription(e.target.value)} placeholder="Brief description..." className={`${INPUT.wrapper} p-2.5`} /></div>
      </div>
      <div className="mb-4">
        <label className={INPUT.label}>Document File *</label>
        <div className={`${FILE_UPLOAD.dropzone} ${sopFiles.length > 0 ? '' : ''}`}>
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-500 hover:text-blue-600">
            <div className={FILE_UPLOAD.uploadIcon}><Upload className="w-5 h-5 text-blue-600" /></div>
            <span className="text-sm font-medium">{sopFiles.length > 0 ? sopFiles[0].name : 'Click to select file'}</span>
            <input type="file" onChange={e => { if (e.target.files[0]) setSOPFiles([{ file: e.target.files[0], name: e.target.files[0].name, type: e.target.files[0].type, size: e.target.files[0].size }]); }} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*" />
          </label>
        </div>
      </div>
      <button onClick={uploadSOP} disabled={saving} className={`w-full py-3 ${BTN.admin} flex items-center justify-center gap-2`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{saving ? 'Uploading...' : 'Upload SOP'}
      </button>
    </div>
    <div className={CARD.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{sops.filter(s => !sopSearch.trim() || s.title.toLowerCase().includes(sopSearch.toLowerCase()) || s.file_name.toLowerCase().includes(sopSearch.toLowerCase()) || s.description?.toLowerCase().includes(sopSearch.toLowerCase())).length} SOPs</h3>
        <button onClick={() => setSOPSortOrder(sopSortOrder === 'desc' ? 'asc' : 'desc')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">{sopSortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={sopSearch} onChange={e => setSOPSearch(e.target.value)} placeholder="Search SOPs by title, description, or filename..." className={INPUT.search} />
        {sopSearch && <button onClick={() => setSOPSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>
      <div className="space-y-3">
        {sops.filter(s => { if (!sopSearch.trim()) return true; const q = sopSearch.toLowerCase(); return s.title.toLowerCase().includes(q) || s.file_name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q); }).sort((a, b) => sopSortOrder === 'desc' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at)).map(sop => (
          <div key={sop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{sop.title}</p>
                {sop.description && <p className="text-sm text-gray-500 truncate">{sop.description}</p>}
                <p className="text-xs text-gray-400">{sop.file_name} • {sop.uploader?.name || 'Unknown'} • {new Date(sop.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              <button onClick={() => viewSOP(sop)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
              <button onClick={() => downloadSOP(sop)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
              <button onClick={() => deleteSOP(sop)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {sops.filter(s => { if (!sopSearch.trim()) return true; const q = sopSearch.toLowerCase(); return s.title.toLowerCase().includes(q) || s.file_name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q); }).length === 0 && (
          <div className="text-center py-12 text-gray-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No SOPs found</p><p className="text-sm">{sopSearch ? 'Try a different search term' : 'Upload your first SOP above'}</p></div>
        )}
      </div>
    </div>
  </div>
)}
{/* SOP View - Staff / Office Manager */}
{!isAdmin && view === 'sop' && (
  <div className="space-y-4">
    <div className={CARD.base}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
          <h3 className="font-semibold text-gray-800">{sops.filter(s => !sopSearch.trim() || s.title.toLowerCase().includes(sopSearch.toLowerCase()) || s.file_name.toLowerCase().includes(sopSearch.toLowerCase())).length} SOPs</h3>
        </div>
        <button onClick={() => setSOPSortOrder(sopSortOrder === 'desc' ? 'asc' : 'desc')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">{sopSortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={sopSearch} onChange={e => setSOPSearch(e.target.value)} placeholder="Search SOPs..." className={INPUT.search} />
        {sopSearch && <button onClick={() => setSOPSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>
      <div className="space-y-3">
        {sops.filter(s => { if (!sopSearch.trim()) return true; const q = sopSearch.toLowerCase(); return s.title.toLowerCase().includes(q) || s.file_name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q); }).sort((a, b) => sopSortOrder === 'desc' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at)).map(sop => (
          <div key={sop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{sop.title}</p>
                {sop.description && <p className="text-sm text-gray-500 truncate">{sop.description}</p>}
                <p className="text-xs text-gray-400">{sop.file_name} • {new Date(sop.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              <button onClick={() => viewSOP(sop)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
              <button onClick={() => downloadSOP(sop)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {sops.filter(s => { if (!sopSearch.trim()) return true; const q = sopSearch.toLowerCase(); return s.title.toLowerCase().includes(q) || s.file_name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q); }).length === 0 && (
          <div className="text-center py-12 text-gray-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No SOPs available</p><p className="text-sm">{sopSearch ? 'Try a different search term' : 'No documents have been uploaded yet'}</p></div>
        )}
      </div>
    </div>
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
    <div className={CARD.base}>
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
        <button onClick={changeName} className={`w-full py-4 rounded-xl font-semibold ${isAdmin ? BTN.admin : BTN.primary}`}>
          Update Name
        </button>
      </div>
    </div>
    {/* Password Change Section */}
    <div className={CARD.base}>
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
        <button onClick={changePassword} className={`w-full py-4 rounded-xl font-semibold ${isAdmin ? BTN.admin : BTN.primary}`}>
          Update Password
        </button>
      </div>
    </div>
    {/* Login History (Admin Only) */}
    {isAdmin && loginHistory.length > 0 && (
      <div className={CARD.base}>
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
{/* Rev Rangers Daily Recon Entry */}
{isAdmin && adminView === 'rev-entry' && currentUser?.role === 'rev_rangers' && activeModule === 'daily-recon' && (
  <div className="space-y-4">
    {adminLocation === 'all' ? (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Select a Location</h2>
            <p className="text-sm text-amber-600">Please select a specific location from the sidebar filter before entering data.</p>
          </div>
        </div>
      </div>
    ) : (
      <>
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-amber-500">
          <h2 className="font-semibold mb-2 text-gray-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" /> Daily Recon — {adminLocation}
          </h2>
          <p className="text-sm text-gray-500 mb-4">EFT, Insurance Check & VCC Entry</p>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Recon Date" type="date" value={forms['daily-recon'].recon_date} onChange={e => updateForm('daily-recon', 'recon_date', e.target.value)} />
            <InputField label="Insurance Check" prefix="$" value={forms['daily-recon'].insurance_checks} onChange={e => updateForm('daily-recon', 'insurance_checks', e.target.value)} />
            <InputField label="VCC" prefix="$" value={forms['daily-recon'].vcc} onChange={e => updateForm('daily-recon', 'vcc', e.target.value)} />
            <InputField label="EFTs" prefix="$" value={forms['daily-recon'].efts} onChange={e => updateForm('daily-recon', 'efts', e.target.value)} />
          </div>
          <div className="mt-4">
            <InputField label="Notes" value={forms['daily-recon'].notes} onChange={e => updateForm('daily-recon', 'notes', e.target.value)} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <FileUpload label="Upload Documents" files={files['daily-recon'].documents} onFilesChange={f => updateFiles('daily-recon', 'documents', f)} onViewFile={setViewingFile} />
        </div>
        <button
          onClick={() => saveEntry('daily-recon')}
          disabled={saving}
          className={`w-full py-4 ${BTN.amber} rounded-xl text-lg font-semibold disabled:opacity-50`}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Entry'}
        </button>
      </>
    )}
  </div>
)}
{/* Records View - Admin */}
{isAdmin && adminView === 'records' && (
  <div className="space-y-4">
    {/* Filters and Controls */}
    <div className={CARD.analytics}>
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
        {!isITViewOnly && (<div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
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
<button onClick={deleteSelectedRecords} className={`flex items-center gap-2 px-4 py-2 ${BTN.danger} text-sm`}>
<Trash2 className="w-4 h-4" /> Delete Selected ({selectedRecords.length})
            </button>
          )}
        </div>)}
      </div>
      {/* Records List */}
      <div className={CARD.base}>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : getModuleEntries().length === 0 ? (
        <div className="text-center py-12">
          <EmptyState icon={FileText} message={recordSearch ? 'No records match your search' : 'No entries yet'} />
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
            if (activeModule === 'daily-recon') {
              const isEditing = editingRecon === e.id;
              const form = reconForm[e.id] || {};
return (
                <div key={e.id} className={`p-4 rounded-xl border-2 ${e.status === 'Accounted' ? 'border-emerald-200 bg-emerald-50' : e.status === 'Rejected' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
{!isITViewOnly && <button onClick={(ev) => { ev.stopPropagation(); toggleRecordSelection(e.id); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                        {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>}
                      <div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-blue-700">{e.locations?.name || 'Unknown Location'}</p>
                          <span className="text-gray-400">•</span>
                          <p className="font-semibold text-gray-800">{e.creator?.name || 'Unknown'}</p>
                          <StatusBadge status={e.status || 'Pending'} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Recon Date: {e.recon_date} • Submitted: {new Date(e.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
{!isEditing && (
                      <div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
<button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
{currentUser?.role !== 'finance_admin' && currentUser?.role !== 'it' && (
                          <button onClick={() => startEditingRecon(e)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" title="Review"><Edit3 className="w-4 h-4" /></button>
                        )}
                        {!isITViewOnly && <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    )}
                  </div>
{/* Staff's Cash Can Data */}
                  <div className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Staff Daily Reconciliation Entry
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
                        <button onClick={() => updateDailyRecon(e.id)} className={`flex-1 py-2.5 ${BTN.save}`}>
                          Submit Review
                        </button>
                        <button onClick={() => { setEditingRecon(null); }} className="px-4 py-2.5 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
(e.status === 'Accounted' || e.status === 'Rejected') && (
                      <div className={`rounded-xl p-4 border ${e.status === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                        <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${e.status === 'Rejected' ? 'text-red-700' : 'text-blue-700'}`}>
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
                    <div className="mt-3 flex flex-wrap gap-2" onClick={ev => ev.stopPropagation()}>
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

{ADMIN_CARD_CONFIG[activeModule] && (() => {
  const cfg = ADMIN_CARD_CONFIG[activeModule];
  return (
    <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
          {!isITViewOnly && <button onClick={(ev) => { ev.stopPropagation(); toggleRecordSelection(e.id); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
            {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </button>}
          <div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {cfg.getTitle(e)}
              <StatusBadge status={e.status} />
              {cfg.getExtraInfo && cfg.getExtraInfo(e)}
              {cfg.getExtra && cfg.getExtra(e)}
            </div>
            <p className="font-medium text-gray-800">{cfg.getSubtitle(e)}</p>
            <p className="text-sm text-gray-500 mt-1">{cfg.getDetail(e)}</p>
            {cfg.getAssigned && cfg.getAssigned(e)}
            {cfg.getAmount && cfg.getAmount(e) && (
              <p className="text-lg font-bold text-emerald-600 mt-2">{cfg.getAmount(e)}</p>
            )}
            {docs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2" onClick={ev => ev.stopPropagation()}>
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs">
                    <File className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600 max-w-24 truncate">{doc.file_name}</span>
                    <button onClick={() => viewDocument(doc)} className="p-0.5 text-blue-500 hover:bg-blue-100 rounded" title="Preview"><Eye className="w-3 h-3" /></button>
                    <button onClick={() => downloadDocument(doc)} className="p-0.5 text-emerald-500 hover:bg-emerald-100 rounded" title="Download"><Download className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
          <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
          {!isITViewOnly && <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>
    </div>
  );
})()}
            if (activeModule === 'completed-procedure' || activeModule === 'claims-documents') {
              return (
                <div key={e.id} className={`p-4 rounded-xl border-2 ${e.status === 'Approved' ? 'border-emerald-300 bg-emerald-50' : e.status === 'Needs Revisions' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => toggleRecordSelection(e.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                        {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-800">{e.locations?.name || 'Unknown Location'}</span>
                          <StatusBadge status={e.status || 'Pending'} />
                        </div>
                        <p className="text-sm text-gray-600">
                          Submitted by: <span className="font-medium">{e.checked_by || '-'}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted: {new Date(e.created_at).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          {e.creator?.name && <span> • By: {e.creator.name}</span>}
                        </p>
                        {e.notes && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{e.notes}</p>}
                        {e.admin_notes && (
                          <div className={`mt-2 p-2 rounded-lg text-sm ${e.status === 'Needs Revisions' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            <span className="font-medium">Admin: </span>{e.admin_notes}
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2" onClick={ev => ev.stopPropagation()}>
                            {docs.map(doc => (
                              <div key={doc.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs">
                                <File className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-600 max-w-24 truncate">{doc.file_name}</span>
                                <button onClick={() => viewDocument(doc)} className="p-0.5 text-blue-500 hover:bg-blue-100 rounded" title="Preview"><Eye className="w-3 h-3" /></button>
                                <button onClick={() => downloadDocument(doc)} className="p-0.5 text-emerald-500 hover:bg-emerald-100 rounded" title="Download"><Download className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
                      <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button onClick={() => toggleRecordSelection(e.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                      {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
<div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">
                        {activeModule === 'billing-inquiry' 
                          ? (e.chart_number ? `Chart #${e.chart_number}` : e.patient_name || 'No Chart #')
                          : (e.patient_name || e.vendor || e.created_at?.split('T')[0])}
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
                      <div className="mt-3 flex flex-wrap gap-2" onClick={ev => ev.stopPropagation()}>
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
<div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
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
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${currentPage === pageNum ? BTN.pageActive : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
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
                  {checklistStatus['daily-recon']?.submitted ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-emerald-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Daily Reconciliation — Submitted</h2>
                          <p className="text-sm text-emerald-600 font-medium">Submitted today at {new Date(checklistStatus['daily-recon']?.entry?.created_at).toLocaleTimeString('en-US', { timeZone: 'Pacific/Honolulu', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      </div>
 {editingStaffEntry === checklistStatus['daily-recon']?.entry?.id ? (
                        <div className="space-y-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                              <Edit3 className="w-4 h-4" /> Edit Today's Entry
                            </h4>
                            <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className="text-gray-400 hover:text-gray-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="Date" type="date" value={staffEditForm.recon_date} onChange={ev => updateStaffEditForm('recon_date', ev.target.value)} />
                            <InputField label="Cash" prefix="$" value={staffEditForm.cash} onChange={ev => updateStaffEditForm('cash', ev.target.value)} />
                            <InputField label="Credit Card" prefix="$" value={staffEditForm.credit_card} onChange={ev => updateStaffEditForm('credit_card', ev.target.value)} />
                            <InputField label="Checks OTC" prefix="$" value={staffEditForm.checks_otc} onChange={ev => updateStaffEditForm('checks_otc', ev.target.value)} />
<InputField label="Care Credit" prefix="$" value={staffEditForm.care_credit} onChange={ev => updateStaffEditForm('care_credit', ev.target.value)} />
                            <div className="col-span-2">
                              <InputField label="Notes" value={staffEditForm.notes} onChange={ev => updateStaffEditForm('notes', ev.target.value)} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveStaffEntryUpdate} disabled={saving} className={`flex-1 py-2.5 ${BTN.save} disabled:opacity-50`}>
                              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                            </button>
                            <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className={`px-4 py-2.5 ${BTN.cancel}`}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <StatusBadge status={checklistStatus['daily-recon']?.entry?.status || 'Pending'} />
                              {checklistStatus['daily-recon']?.entry?.creator?.name && (
                                <span className="text-sm text-gray-500">By: {checklistStatus['daily-recon']?.entry?.creator?.name}</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{checklistStatus['daily-recon']?.entry?.recon_date}</span></div>
                              <div><span className="text-gray-500">Cash:</span> <span className="font-medium">${Number(checklistStatus['daily-recon']?.entry?.cash || 0).toFixed(2)}</span></div>
                              <div><span className="text-gray-500">Credit Card:</span> <span className="font-medium">${Number(checklistStatus['daily-recon']?.entry?.credit_card || 0).toFixed(2)}</span></div>
                              <div><span className="text-gray-500">Checks OTC:</span> <span className="font-medium">${Number(checklistStatus['daily-recon']?.entry?.checks_otc || 0).toFixed(2)}</span></div>
<div><span className="text-gray-500">Care Credit:</span> <span className="font-medium">${Number(checklistStatus['daily-recon']?.entry?.care_credit || 0).toFixed(2)}</span></div>
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                              <span className="text-gray-500 text-sm">Total Collected:</span>
                              <span className="font-bold text-emerald-700 text-lg ml-2">${Number(checklistStatus['daily-recon']?.entry?.total_collected || 0).toFixed(2)}</span>
                            </div>
                            {checklistStatus['daily-recon']?.entry?.notes && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Notes</span>
                                <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-100 mt-1">{checklistStatus['daily-recon']?.entry?.notes}</p>
                              </div>
                            )}
                          </div>
                          {!isChecklistPastDeadline() && (
                            <button
                              onClick={() => startEditingStaffEntry(checklistStatus['daily-recon']?.entry)}
                              className={`w-full mt-4 py-3 ${BTN.save} flex items-center justify-center gap-2`}
                            >
                              <Edit3 className="w-4 h-4" /> Edit Today's Entry
                            </button>
                          )}
                          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                            <p className="text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                              <Lock className="w-4 h-4" /> One entry per day. Resets at midnight.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : isChecklistPastDeadline() ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-gray-400">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Daily Reconciliation</h2>
                          <p className="text-sm text-red-600 font-medium">Submissions closed for today</p>
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                        <p className="text-sm text-red-700">The deadline has passed. A new form will be available tomorrow.</p>
                      </div>
                    </div>
                  ) : (
                  <>
                  <div className={CARD.colored(currentColors)}>
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-500" />Daily Reconciliation
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Date" type="date" value={forms['daily-recon'].recon_date} onChange={e => updateForm('daily-recon', 'recon_date', e.target.value)} />
                      <InputField label="Cash" prefix="$" value={forms['daily-recon'].cash} onChange={e => updateForm('daily-recon', 'cash', e.target.value)} />
                      <InputField label="Credit Card (OTC)" prefix="$" value={forms['daily-recon'].credit_card} onChange={e => updateForm('daily-recon', 'credit_card', e.target.value)} />
                      <InputField label="Checks (OTC)" prefix="$" value={forms['daily-recon'].checks_otc} onChange={e => updateForm('daily-recon', 'checks_otc', e.target.value)} />
  <InputField label="Care Credit" prefix="$" value={forms['daily-recon'].care_credit} onChange={e => updateForm('daily-recon', 'care_credit', e.target.value)} />
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
                </>
              )}
{activeModule === 'completed-procedure' && (
                <>
{checklistStatus['completed-procedure']?.submitted ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-emerald-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Completed Procedure — Submitted</h2>
                          <p className="text-sm text-emerald-600 font-medium">Submitted today at {new Date(checklistStatus['completed-procedure']?.entry?.created_at).toLocaleTimeString('en-US', { timeZone: 'Pacific/Honolulu', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      {editingStaffEntry === checklistStatus['completed-procedure']?.entry?.id ? (
                        <div className="space-y-4 bg-teal-50 rounded-xl p-4 border border-teal-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-teal-800 flex items-center gap-2">
                              <Edit3 className="w-4 h-4" /> Edit Today's Entry
                            </h4>
                            <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className="text-gray-400 hover:text-gray-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="Checked By" value={staffEditForm.checked_by} onChange={ev => updateStaffEditForm('checked_by', ev.target.value)} />
                            <div className="flex items-end">
                              <div className="p-3 bg-teal-100 rounded-xl border border-teal-200 text-sm text-teal-700 w-full">
                                <span className="font-medium">Date:</span> {new Date().toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <InputField label="Notes" large value={staffEditForm.notes} onChange={ev => updateStaffEditForm('notes', ev.target.value)} placeholder="Update notes..." />
                          <div className="flex gap-2">
                            <button onClick={saveStaffEntryUpdate} disabled={saving} className={`flex-1 py-2.5 ${BTN.save} disabled:opacity-50`}>
                              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                            </button>
                            <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className={`px-4 py-2.5 ${BTN.cancel}`}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <StatusBadge status={checklistStatus['completed-procedure']?.entry?.status || 'Pending'} />
                              {checklistStatus['completed-procedure']?.entry?.creator?.name && (
                                <span className="text-sm text-gray-500">By: {checklistStatus['completed-procedure']?.entry?.creator?.name}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Checked By</span>
                              <p className="font-medium text-gray-800">{checklistStatus['completed-procedure']?.entry?.checked_by || '-'}</p>
                            </div>
                            {checklistStatus['completed-procedure']?.entry?.notes && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Notes</span>
                                <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-100 mt-1">{checklistStatus['completed-procedure']?.entry?.notes}</p>
                              </div>
                            )}
                            {checklistStatus['completed-procedure']?.entry?.admin_notes && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Admin Notes</span>
                                <p className={`p-3 rounded-lg border mt-1 ${checklistStatus['completed-procedure']?.entry?.status === 'Needs Revisions' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                  {checklistStatus['completed-procedure']?.entry?.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>
                          {!isChecklistPastDeadline() && (
                            <button
                              onClick={() => startEditingStaffEntry(checklistStatus['completed-procedure']?.entry)}
                              className="w-full mt-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" /> Edit Today's Entry
                            </button>
                          )}
                          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                            <p className="text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                              <Lock className="w-4 h-4" /> One entry per day. Resets at midnight.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : isChecklistPastDeadline() ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-gray-400">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Completed Procedure</h2>
                          <p className="text-sm text-red-600 font-medium">Submissions closed for today</p>
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                        <p className="text-sm text-red-700">The deadline has passed. A new form will be available tomorrow.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={CARD.colored(currentColors)}>
                        <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-teal-500" /> Completed Procedure
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="Checked By" value={forms['completed-procedure'].checked_by} onChange={e => updateForm('completed-procedure', 'checked_by', e.target.value)} />
                          <div className="flex items-end">
                            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-sm text-teal-700 w-full">
                              <span className="font-medium">Date:</span> {new Date().toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <InputField label="Notes" large value={forms['completed-procedure'].notes} onChange={e => updateForm('completed-procedure', 'notes', e.target.value)} placeholder="Enter procedure notes..." />
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-6">
                        <FileUpload label="Attachments" files={files['completed-procedure'].documentation} onFilesChange={f => updateFiles('completed-procedure', 'documentation', f)} onViewFile={setViewingFile} />
                      </div>
                    </>
                  )}
                </>
              )}
              {activeModule === 'claims-documents' && (
                <>
{checklistStatus['claims-documents']?.submitted ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-emerald-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Claims & Documents — Submitted</h2>
                          <p className="text-sm text-emerald-600 font-medium">Submitted today at {new Date(checklistStatus['claims-documents']?.entry?.created_at).toLocaleTimeString('en-US', { timeZone: 'Pacific/Honolulu', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      {editingStaffEntry === checklistStatus['claims-documents']?.entry?.id ? (
                        <div className="space-y-4 bg-sky-50 rounded-xl p-4 border border-sky-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sky-800 flex items-center gap-2">
                              <Edit3 className="w-4 h-4" /> Edit Today's Entry
                            </h4>
                            <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className="text-gray-400 hover:text-gray-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="Checked By" value={staffEditForm.checked_by} onChange={ev => updateStaffEditForm('checked_by', ev.target.value)} />
                            <div className="flex items-end">
                              <div className="p-3 bg-sky-100 rounded-xl border border-sky-200 text-sm text-sky-700 w-full">
                                <span className="font-medium">Date:</span> {new Date().toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <InputField label="Notes" large value={staffEditForm.notes} onChange={ev => updateStaffEditForm('notes', ev.target.value)} placeholder="Update notes..." />
                          <div className="flex gap-2">
                            <button onClick={saveStaffEntryUpdate} disabled={saving} className={`flex-1 py-2.5 ${BTN.save} disabled:opacity-50`}>
                              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                            </button>
                            <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className={`px-4 py-2.5 ${BTN.cancel}`}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <StatusBadge status={checklistStatus['claims-documents']?.entry?.status || 'Pending'} />
                              {checklistStatus['claims-documents']?.entry?.creator?.name && (
                                <span className="text-sm text-gray-500">By: {checklistStatus['claims-documents']?.entry?.creator?.name}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Checked By</span>
                              <p className="font-medium text-gray-800">{checklistStatus['claims-documents']?.entry?.checked_by || '-'}</p>
                            </div>
                            {checklistStatus['claims-documents']?.entry?.notes && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Notes</span>
                                <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-100 mt-1">{checklistStatus['claims-documents']?.entry?.notes}</p>
                              </div>
                            )}
                            {checklistStatus['claims-documents']?.entry?.admin_notes && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Admin Notes</span>
                                <p className={`p-3 rounded-lg border mt-1 ${checklistStatus['claims-documents']?.entry?.status === 'Needs Revisions' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                  {checklistStatus['claims-documents']?.entry?.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>
                          {!isChecklistPastDeadline() && (
                            <button
                              onClick={() => startEditingStaffEntry(checklistStatus['claims-documents']?.entry)}
                              className="w-full mt-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" /> Edit Today's Entry
                            </button>
                          )}
                          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                            <p className="text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                              <Lock className="w-4 h-4" /> One entry per day. Resets at midnight.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : isChecklistPastDeadline() ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-l-gray-400">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Claims & Documents</h2>
                          <p className="text-sm text-red-600 font-medium">Submissions closed for today</p>
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                        <p className="text-sm text-red-700">The deadline has passed. A new form will be available tomorrow.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={CARD.colored(currentColors)}>
                        <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-sky-500" /> Claims & Documents (X-ray, Documents)
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="Checked By" value={forms['claims-documents'].checked_by} onChange={e => updateForm('claims-documents', 'checked_by', e.target.value)} />
                          <div className="flex items-end">
                            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sm text-sky-700 w-full">
                              <span className="font-medium">Date:</span> {new Date().toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <InputField label="Notes" large value={forms['claims-documents'].notes} onChange={e => updateForm('claims-documents', 'notes', e.target.value)} placeholder="Enter claims/document notes..." />
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-6">
                        <FileUpload label="X-rays, Documents & Attachments" files={files['claims-documents'].documentation} onFilesChange={f => updateFiles('claims-documents', 'documentation', f)} onViewFile={setViewingFile} />
                      </div>
                    </>
                  )}
                </>
              )}

              {STAFF_FORM_CONFIG[activeModule] && (
                <>
                  <div className={CARD.colored(currentColors)}>
                    <h2 className="font-semibold mb-2 text-gray-800">{STAFF_FORM_CONFIG[activeModule].title}</h2>
                    {STAFF_FORM_CONFIG[activeModule].subtitle && <p className="text-sm text-gray-500 mb-4">{STAFF_FORM_CONFIG[activeModule].subtitle}</p>}
                    {!STAFF_FORM_CONFIG[activeModule].subtitle && <div className="mb-4" />}
                    {renderFormFields(STAFF_FORM_CONFIG[activeModule].fields, forms[activeModule], updateForm, activeModule)}
                    {STAFF_FORM_CONFIG[activeModule].largeField && (
                      <div className="mt-4">
                        <InputField label={STAFF_FORM_CONFIG[activeModule].largeField.label} large value={forms[activeModule][STAFF_FORM_CONFIG[activeModule].largeField.key]} onChange={e => updateForm(activeModule, STAFF_FORM_CONFIG[activeModule].largeField.key, e.target.value)} placeholder={STAFF_FORM_CONFIG[activeModule].largeField.placeholder} />
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <FileUpload label={STAFF_FORM_CONFIG[activeModule].fileLabel} files={files[activeModule][STAFF_FORM_CONFIG[activeModule].fileKey]} onFilesChange={f => updateFiles(activeModule, STAFF_FORM_CONFIG[activeModule].fileKey, f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}
{!((activeModule === 'daily-recon' && (checklistStatus['daily-recon']?.submitted || isChecklistPastDeadline())) ||
                 (activeModule === 'completed-procedure' && (checklistStatus['completed-procedure']?.submitted || isChecklistPastDeadline())) ||
                 (activeModule === 'claims-documents' && (checklistStatus['claims-documents']?.submitted || isChecklistPastDeadline()))) && (
                <button
                  onClick={() => saveEntry(activeModule)}
                  disabled={saving}
                  className={`w-full py-4 ${BTN.primary} rounded-xl text-lg font-semibold disabled:opacity-50`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Entry'}
                </button>
              )}
            </div>
          )}
{/* History View - Staff */}
{!isAdmin && view === 'history' && (
  <div className="space-y-4">
    {/* Sorting Controls */}
    <div className={CARD.analytics}>
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
    <div className={CARD.base}>
      <h2 className="font-semibold mb-4 text-gray-800">Your Entries</h2>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : getStaffEntries().length === 0 ? (
<div className="text-center py-12">
          <EmptyState icon={FileText} message={currentUser?.role === 'staff' && CHECKLIST_MODULES.some(m => m.id === activeModule)
              ? 'Checklist modules are not available for your role'
              : staffRecordSearch ? 'No records match your search' : 'No entries yet'} />
          {staffRecordSearch && (
            <button onClick={() => setStaffRecordSearch('')} className="mt-2 text-blue-600 text-sm font-medium hover:underline">Clear search</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {getStaffPaginatedEntries().map(e => {
            const isChecklist = CHECKLIST_MODULES.some(m => m.id === activeModule);
            const canEdit = isChecklist ? canEditChecklistEntry(e.created_at) : canEditRecord(e.created_at);
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
            } else if (activeModule === 'completed-procedure' || activeModule === 'claims-documents') {
              if (e.status === 'Approved') bgClass = 'bg-emerald-50 border-2 border-emerald-300';
              else if (e.status === 'Needs Revisions') bgClass = 'bg-red-50 border-2 border-red-300';
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
                        {renderStaffEditFields(
                          STAFF_EDIT_FIELDS_CONFIG['daily-recon'][currentUser?.role === 'rev_rangers' ? 'rev_rangers' : 'staff'],
                          staffEditForm, updateStaffEditForm
                        )}
                        <div className="col-span-2">
                          <InputField label={STAFF_EDIT_FIELDS_CONFIG['daily-recon'].notesField.label} value={staffEditForm[STAFF_EDIT_FIELDS_CONFIG['daily-recon'].notesField.key]} onChange={ev => updateStaffEditForm(STAFF_EDIT_FIELDS_CONFIG['daily-recon'].notesField.key, ev.target.value)} />
                        </div>
                      </div>
                    )}
                    {activeModule !== 'daily-recon' && STAFF_EDIT_FIELDS_CONFIG[activeModule] && (
                      <>
                        {renderStaffEditFields(STAFF_EDIT_FIELDS_CONFIG[activeModule].fields, staffEditForm, updateStaffEditForm)}
                        {(activeModule === 'completed-procedure' || activeModule === 'claims-documents') && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-end">
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 w-full">
                                <span className="font-medium">Module:</span> {activeModule === 'completed-procedure' ? 'Completed Procedure' : 'Claims & Documents'}
                              </div>
                            </div>
                          </div>
                        )}
                        {STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField && (
                          <div className="col-span-2 mt-3">
                            <InputField label={STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.label} large value={staffEditForm[STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.key]} onChange={ev => updateStaffEditForm(STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.key, ev.target.value)} placeholder={STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.placeholder} />
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button onClick={saveStaffEntryUpdate} disabled={saving} className={`flex-1 py-2.5 ${BTN.primary} disabled:opacity-50`}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                      </button>
                      <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className={`px-4 py-2.5 ${BTN.cancel}`}>
                        Cancel
                      </button>
                    </div>
                  </div>
) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
                      <div className="flex items-center gap-2">
<p className="font-medium text-gray-800">
                          {e.ticket_number ? `IT-${e.ticket_number}` : 
                           (activeModule === 'completed-procedure' || activeModule === 'claims-documents') ? <span className={`${activeModule === 'completed-procedure' ? 'text-teal-600' : 'text-sky-600'} font-bold`}>{activeModule === 'completed-procedure' ? 'Completed Procedure' : 'Claims & Documents'} — {new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', month: 'short', day: 'numeric' })}</span> :
                           (activeModule === 'daily-recon') ? <span className="text-emerald-600 font-bold">Recon: {e.recon_date}</span> :
                           (activeModule === 'bills-payment' && e.transaction_id) ? <span className="text-violet-600 font-bold">Invoice: {e.transaction_id}</span> :
                           (activeModule === 'billing-inquiry' && e.chart_number) ? <span className="text-blue-600 font-bold">Chart# {e.chart_number}</span> :
                           (activeModule === 'refund-requests' && e.chart_number) ? <span className="text-rose-600 font-bold">Chart# {e.chart_number}</span> :
                           e.patient_name || e.vendor || e.recon_date || new Date(e.created_at).toLocaleDateString()}
                        </p>
                        {activeModule === 'bills-payment' && e.transaction_id && e.vendor && (
                          <p className="text-sm text-gray-600">{e.vendor}</p>
                        )}
{activeModule === 'billing-inquiry' && e.chart_number && e.patient_name && (
                          <p className="text-sm text-gray-600">{e.patient_name}</p>
                        )}
                        {activeModule === 'refund-requests' && e.chart_number && e.patient_name && (
                          <p className="text-sm text-gray-600">{e.patient_name}</p>
                        )}
                        {(activeModule === 'completed-procedure' || activeModule === 'claims-documents') && e.checked_by && (
                          <p className="text-sm text-gray-600">Submitted by: {e.checked_by}</p>
                        )}
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
{(activeModule === 'completed-procedure' || activeModule === 'claims-documents') && e.admin_notes && (
                        <div className={`mt-2 p-2 rounded-lg text-sm ${e.status === 'Needs Revisions' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                          <span className="font-medium">Rev-Rangers Feedback: </span>{e.admin_notes}
                        </div>
                      )}
                      {docs.length > 0 && (
                        <div className="mt-3 space-y-1" onClick={ev => ev.stopPropagation()}>
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
<div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
                      <button onClick={() => setViewingEntry(e)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                      {canEdit && (
                        <button onClick={() => startEditingStaffEntry(e)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      )}
                      {(!isChecklist || canEdit) && (
                        <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Pagination */}
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
{sidebarOpen && <div className={LAYOUT.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
{/* Version Footer */}
      <div className="fixed bottom-6 left-4 lg:left-[310px] z-[25] pointer-events-none">
        <p className="text-xs text-gray-400 opacity-70">CMS v0.87</p>
      </div>
    </div>
  );
}
