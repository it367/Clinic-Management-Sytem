//Care Command Hub v0.94
// Devoloper: Mark Murillo
// Company: Kidshine Hawaii

'use client';
import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { FileText, Building2, Bot, Send, Loader2, LogOut, User, Upload, X, File, Shield, Receipt, CreditCard, Package, RefreshCw, Monitor, Menu, Eye, EyeOff, FolderOpen, Edit3, Users, Plus, Trash2, Lock, Download, Settings, MessageCircle, Sparkles, AlertCircle, Maximize2, Minimize2, Search, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, BookOpen, Clock, FileCheck, Banknote, PhoneCall, UserCheck, ChevronLeft, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import { MODULE_COLORS, STATUS_COLORS, ROLE_STYLES, BTN, CARD, INPUT, LAYOUT, ANALYTICS_CARDS, ICON_BOX, URGENCY_COLORS, CONFIRM_COLORS, FILE_UPLOAD, CHECKBOX } from './styles';
const MODULES = [
  { id: 'billing-inquiry', name: 'Billing Inquiry', icon: Receipt, color: 'blue', table: 'billing_inquiries' },
  { id: 'bills-payment', name: 'Bills Payment', icon: CreditCard, color: 'violet', table: 'bills_payment' },
  { id: 'order-requests', name: 'Order Requests', icon: Package, color: 'amber', table: 'order_requests' },
  { id: 'refund-requests', name: 'Refund Requests', icon: RefreshCw, color: 'rose', table: 'refund_requests' },
  { id: 'hospital-cases', name: 'Hospital Cases', icon: Building2, color: 'indigo', table: 'hospital_cases' },
];

const SUPPORT_MODULES = [
  { id: 'it-requests', name: 'IT Requests', icon: Monitor, color: 'cyan', table: 'it_requests' },
];

const EOD_MODULES = [
  { id: 'eod-patient-scheduling', name: 'Patient Scheduling', icon: Calendar, color: 'teal', table: 'eod_patient_scheduling' },
  { id: 'eod-insurance-verification', name: 'Insurance Verification', icon: FileCheck, color: 'cyan', table: 'eod_insurance_verification' },
  { id: 'eod-claim-submission', name: 'Claim Submission', icon: FileText, color: 'sky', table: 'eod_claim_submission' },
  { id: 'eod-payment-posting', name: 'Payment Posting', icon: Banknote, color: 'blue', table: 'eod_payment_posting' },
  { id: 'eod-claim-followup', name: 'Claim Follow-Up', icon: PhoneCall, color: 'violet', table: 'eod_claim_followup' },
  { id: 'eod-patient-aging', name: 'Patient Aging', icon: UserCheck, color: 'purple', table: 'eod_patient_aging' },
];

const ALL_MODULES = [...MODULES, ...SUPPORT_MODULES, ...EOD_MODULES];

// MODULE_COLORS imported from styles
const isEodModule = (moduleId) => EOD_MODULES.some(m => m.id === moduleId);
const canAccessEod = (role) => ['rev_rangers', 'rev_rangers_admin', 'super_admin', 'finance_admin', 'it'].includes(role);

const IT_STATUSES = ['For Review', 'In Progress', 'On-hold', 'Resolved'];
const INQUIRY_TYPES = ['Patient Refund', 'Insurance Refund', 'Patient Balance', 'Payment Plan', 'Other'];
const HOSPITAL_CASE_TYPES = ['Claim', 'Referral', 'Patient Balance'];
const REFUND_TYPES = ['Refund', 'Credit', 'Adjustment'];
const CONTACT_METHODS = ['Phone', 'Email', 'Text'];
const DATE_RANGES = ['This Week', 'Last 2 Weeks', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Custom'];
const INSURANCE_PROVIDERS = ['AETNA', 'AMERITAS', 'Anthem BC', 'BCBS FEP', 'CIGNA DENTAL', 'DELTA DENTAL', 'GEHA', 'HDS', 'HDS MEDICAID', 'HMAA', 'HMSA', 'Hospital cases', 'METLIFE', 'GUARDIAN', 'No Insurance', 'OTHER', 'UCCI', 'UCCI FED VIP', 'UCCI TDP'];
const PATIENT_TYPES = ['New', 'Existing', 'Other'];
const REFERRAL_SOURCES = ['Patient', 'Referral Provider', 'Practice Provider', 'General Dentist', 'Doctor Referral', 'Social Media', 'Mailers', 'Outreach', 'Family', 'Online', 'Posters', 'Campaign Poster', 'Friend', 'School', 'Community Event'];
const CALL_TYPES = ['Inbound', 'Outbound', 'Appointment Confirmation'];
const CALL_OUTCOMES = ['Scheduled', 'Appt Cancelled', 'Appt Confirmed', 'Rescheduled', 'Inquiry Handled', 'Left VM', 'No VM', 'Full VM', 'Unconfirmed', 'Call Disconnected', 'Ortho Inquiry', 'Will Callback', 'Other', 'Transfer', 'Need Follow-Up', 'No Answer'];
const VERIFICATION_STATUSES = ['Verified', 'Pending', 'Termed', 'On Hold', 'Treatment Plan', 'Reverified'];
const LOCATE_BY_OPTIONS = ['Call', 'Web & CS', 'Uploaded', 'Drive', 'FAX'];
const PAYMENT_TYPE_OPTIONS = ['Insurance Check', 'Direct Transfer - EFT', 'Credit/Debit Card - VCC'];
const CLAIM_STATUSES = ['Acknowledged (Payor)', 'Reopened', 'Resubmitted (Payor)', 'Partially Paid', 'Denied', 'Other', 'Submitted (Payor)', 'Patient to Contact Office', 'CS Please Review', 'Submitted Through Portal', 'Submitted Electronically', 'Claim Submission', 'Close'];
const SCHEDULING_LOCATIONS = ['Pearl City', 'Kailua', 'Kapolei', 'HHDS', 'Ortho'];
const EOD_STATUSES = ['For Review', 'Approved', 'Updates Needed', 'Declined'];

// MODULE_FIELD_CONFIG: maps moduleId -> fields used in saveEntry / startEditingStaffEntry / saveStaffEntryUpdate
const MODULE_FIELD_CONFIG = {
  'billing-inquiry': {
    getEntryData: (form, user) => ({
      patient_name: form.patient_name, chart_number: form.chart_number, parent_name: form.parent_name,
      date_of_request: form.date_of_request || null, inquiry_type: form.inquiry_type,
      description: form.description, amount_in_question: parseFloat(form.amount_in_question) || null,
      best_contact_method: form.best_contact_method || null, best_contact_time: form.best_contact_time,
      billing_team_reviewed: form.billing_team_reviewed, date_reviewed: form.date_reviewed || null,
      status: form.status || 'Pending', result: form.result
    }),
    getEditInitial: (entry) => ({
      patient_name: entry.patient_name || '', chart_number: entry.chart_number || '',
      parent_name: entry.parent_name || '', date_of_request: entry.date_of_request || '',
      inquiry_type: entry.inquiry_type || '', description: entry.description || '',
      amount_in_question: entry.amount_in_question || '', best_contact_method: entry.best_contact_method || '',
      best_contact_time: entry.best_contact_time || ''
    }),
    getUpdateData: (f) => ({
      patient_name: f.patient_name, chart_number: f.chart_number, parent_name: f.parent_name,
      date_of_request: f.date_of_request || null, inquiry_type: f.inquiry_type, description: f.description,
      amount_in_question: parseFloat(f.amount_in_question) || null,
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
  },
  'hospital-cases': {
    getEntryData: (form, user) => ({
      patient_name: form.patient_name, chart_number: form.chart_number, parent_name: form.parent_name,
      date_of_request: form.date_of_request || null, inquiry_type: form.inquiry_type,
      description: form.description,
      best_contact_method: form.best_contact_method || null, best_contact_time: form.best_contact_time,
      status: 'Pending'
    }),
    getEditInitial: (entry) => ({
      patient_name: entry.patient_name || '', chart_number: entry.chart_number || '',
      parent_name: entry.parent_name || '', date_of_request: entry.date_of_request || '',
      inquiry_type: entry.inquiry_type || '', description: entry.description || '',
      best_contact_method: entry.best_contact_method || '', best_contact_time: entry.best_contact_time || ''
    }),
    getUpdateData: (f) => ({
      patient_name: f.patient_name, chart_number: f.chart_number, parent_name: f.parent_name,
      date_of_request: f.date_of_request || null, inquiry_type: f.inquiry_type, description: f.description,
      best_contact_method: f.best_contact_method || null, best_contact_time: f.best_contact_time
    })
  },
  'eod-patient-scheduling': {
    getEntryData: (form) => ({
      patient_name_id: form.patient_name_id, patient_type: form.patient_type, insurance_provider: form.insurance_provider,
      referral_source: form.referral_source, worked_call_date: form.worked_call_date || null, appt_booked_rs_date: form.appt_booked_rs_date || null,
      call_type: form.call_type, call_outcome: form.call_outcome, location: form.location,
      additional_patients: form.additional_patients ? form.additional_patients.filter(p => p.trim()) : [],
      memo: form.memo, review_status: 'For Review'
    }),
    getEditInitial: (e) => ({
      patient_name_id: e.patient_name_id || '', patient_type: e.patient_type || '', insurance_provider: e.insurance_provider || '',
      referral_source: e.referral_source || '', worked_call_date: e.worked_call_date || '', appt_booked_rs_date: e.appt_booked_rs_date || '',
      call_type: e.call_type || '', call_outcome: e.call_outcome || '', location: e.location || '',
      additional_patients: e.additional_patients || [],
      memo: e.memo || ''
    }),
    getUpdateData: (f) => ({
      patient_name_id: f.patient_name_id, patient_type: f.patient_type, insurance_provider: f.insurance_provider,
      referral_source: f.referral_source, worked_call_date: f.worked_call_date || null, appt_booked_rs_date: f.appt_booked_rs_date || null,
      call_type: f.call_type, call_outcome: f.call_outcome, location: f.location,
      additional_patients: f.additional_patients ? f.additional_patients.filter(p => p.trim()) : [],
      memo: f.memo, review_status: 'For Review', reviewed_by: null, review_notes: null, date_reviewed: null
    }),
    requiredFields: ['patient_name_id', 'patient_type', 'insurance_provider', 'call_type', 'location', 'call_outcome', 'memo']
  },
  'eod-insurance-verification': {
    getEntryData: (form) => ({
      patient_id: form.patient_id, insurance_provider: form.insurance_provider, location: form.location,
      verified_date: form.verified_date || null, dos: form.dos || null,
      time_started_hst: form.time_started_hst || null, time_ended_hst: form.time_ended_hst || null, time_duration: form.time_duration,
      status: form.status, review_status: 'For Review'
    }),
    getEditInitial: (e) => ({
      patient_id: e.patient_id || '', insurance_provider: e.insurance_provider || '', location: e.location || '',
      verified_date: e.verified_date || '', dos: e.dos || '',
      time_started_hst: e.time_started_hst || '', time_ended_hst: e.time_ended_hst || '', time_duration: e.time_duration || '',
      status: e.status || ''
    }),
    getUpdateData: (f) => ({
      patient_id: f.patient_id, insurance_provider: f.insurance_provider, location: f.location,
      verified_date: f.verified_date || null, dos: f.dos || null,
      time_started_hst: f.time_started_hst || null, time_ended_hst: f.time_ended_hst || null, time_duration: f.time_duration,
      status: f.status, review_status: 'For Review', reviewed_by: null, review_notes: null, date_reviewed: null
    }),
    requiredFields: ['patient_id', 'insurance_provider', 'location', 'verified_date', 'dos', 'time_started_hst', 'time_ended_hst', 'time_duration', 'status']
  },
  'eod-claim-submission': {
    getEntryData: (form) => ({
      claim_id: form.claim_id, insurance_provider: form.insurance_provider,
      worked_date: form.worked_date || null, date_of_service: form.date_of_service || null,
      claim_amount: parseFloat(form.claim_amount) || null,
      time_started_hst: form.time_started_hst || null, time_ended_hst: form.time_ended_hst || null, time_duration: form.time_duration,
      claim_status: form.claim_status, comments: form.comments, review_status: 'For Review'
    }),
    getEditInitial: (e) => ({
      claim_id: e.claim_id || '', insurance_provider: e.insurance_provider || '',
      worked_date: e.worked_date || '', date_of_service: e.date_of_service || '',
      claim_amount: e.claim_amount || '', time_started_hst: e.time_started_hst || '', time_ended_hst: e.time_ended_hst || '',
      time_duration: e.time_duration || '', claim_status: e.claim_status || '', comments: e.comments || ''
    }),
    getUpdateData: (f) => ({
      claim_id: f.claim_id, insurance_provider: f.insurance_provider,
      worked_date: f.worked_date || null, date_of_service: f.date_of_service || null,
      claim_amount: parseFloat(f.claim_amount) || null,
      time_started_hst: f.time_started_hst || null, time_ended_hst: f.time_ended_hst || null, time_duration: f.time_duration,
      claim_status: f.claim_status, comments: f.comments, review_status: 'For Review', reviewed_by: null, review_notes: null, date_reviewed: null
    }),
    requiredFields: ['claim_id', 'insurance_provider', 'worked_date', 'date_of_service', 'claim_amount', 'time_started_hst', 'time_ended_hst', 'time_duration', 'claim_status', 'comments']
  },
  'eod-payment-posting': {
    getEntryData: (form) => ({
      insurance_provider: form.insurance_provider, receipt_number: form.receipt_number,
      time_started_hst: form.time_started_hst || null,
      payment_date: form.payment_date || null, deposit_date: form.deposit_date || null,
      amount: parseFloat(form.amount) || null, payment_type: form.payment_type, reference_number: form.reference_number,
      date_posted: form.date_posted || null, time_ended_hst: form.time_ended_hst || null, time_duration: form.time_duration,
      locate_by: form.locate_by, location: form.location, remarks: form.remarks, review_status: 'For Review'
    }),
    getEditInitial: (e) => ({
      insurance_provider: e.insurance_provider || '', receipt_number: e.receipt_number || '',
      time_started_hst: e.time_started_hst || '',
      payment_date: e.payment_date || '', deposit_date: e.deposit_date || '',
      amount: e.amount || '', payment_type: e.payment_type || '', reference_number: e.reference_number || '',
      date_posted: e.date_posted || '', time_ended_hst: e.time_ended_hst || '', time_duration: e.time_duration || '',
      locate_by: e.locate_by || '', location: e.location || '', remarks: e.remarks || ''
    }),
    getUpdateData: (f) => ({
      insurance_provider: f.insurance_provider, receipt_number: f.receipt_number,
      time_started_hst: f.time_started_hst || null,
      payment_date: f.payment_date || null, deposit_date: f.deposit_date || null,
      amount: parseFloat(f.amount) || null, payment_type: f.payment_type, reference_number: f.reference_number,
      date_posted: f.date_posted || null, time_ended_hst: f.time_ended_hst || null, time_duration: f.time_duration,
      locate_by: f.locate_by, location: f.location, remarks: f.remarks, review_status: 'For Review', reviewed_by: null, review_notes: null, date_reviewed: null
    }),
    requiredFields: ['insurance_provider', 'receipt_number', 'payment_date', 'deposit_date', 'amount', 'payment_type', 'reference_number', 'date_posted', 'time_started_hst', 'time_ended_hst', 'time_duration', 'locate_by', 'location', 'remarks']
  },
  'eod-claim-followup': {
    getEntryData: (form) => ({
      claim_id: form.claim_id, insurance_provider: form.insurance_provider,
      worked_date: form.worked_date || null, date_of_service: form.date_of_service || null,
      insurance_expected: parseFloat(form.insurance_expected) || null,
      time_started_mnl: form.time_started_mnl || null, time_ended_mnl: form.time_ended_mnl || null, time_duration: form.time_duration,
      claim_status: form.claim_status, amount_collected: parseFloat(form.amount_collected) || null, review_status: 'For Review'
    }),
    getEditInitial: (e) => ({
      claim_id: e.claim_id || '', insurance_provider: e.insurance_provider || '',
      worked_date: e.worked_date || '', date_of_service: e.date_of_service || '',
      insurance_expected: e.insurance_expected || e.claim_amount || '', time_started_mnl: e.time_started_mnl || '', time_ended_mnl: e.time_ended_mnl || '',
      time_duration: e.time_duration || '', claim_status: e.claim_status || '', amount_collected: e.amount_collected || ''
    }),
    getUpdateData: (f) => ({
      claim_id: f.claim_id, insurance_provider: f.insurance_provider,
      worked_date: f.worked_date || null, date_of_service: f.date_of_service || null,
      insurance_expected: parseFloat(f.insurance_expected) || null,
      time_started_mnl: f.time_started_mnl || null, time_ended_mnl: f.time_ended_mnl || null, time_duration: f.time_duration,
      claim_status: f.claim_status, amount_collected: parseFloat(f.amount_collected) || null,
      review_status: 'For Review', reviewed_by: null, review_notes: null, date_reviewed: null
    }),
    requiredFields: ['amount_collected']
  },
  'eod-patient-aging': {
    getEntryData: (form) => ({
      patient_id: form.patient_id, insurance_provider: form.insurance_provider,
      worked_date: form.worked_date || null, date_of_service: form.date_of_service || null,
      text_to_pay_amount_sent: parseFloat(form.text_to_pay_amount_sent) || null,
      time_started_mnl: form.time_started_mnl || null, time_ended_mnl: form.time_ended_mnl || null, time_duration: form.time_duration,
      claim_status: form.claim_status, amount_collected: parseFloat(form.amount_collected) || null, location: form.location, review_status: 'For Review'
    }),
    getEditInitial: (e) => ({
      patient_id: e.patient_id || '', insurance_provider: e.insurance_provider || '',
      worked_date: e.worked_date || '', date_of_service: e.date_of_service || '',
      text_to_pay_amount_sent: e.text_to_pay_amount_sent || '', time_started_mnl: e.time_started_mnl || '', time_ended_mnl: e.time_ended_mnl || '',
      time_duration: e.time_duration || '', claim_status: e.claim_status || '', amount_collected: e.amount_collected || '', location: e.location || ''
    }),
    getUpdateData: (f) => ({
      patient_id: f.patient_id, insurance_provider: f.insurance_provider,
      worked_date: f.worked_date || null, date_of_service: f.date_of_service || null,
      text_to_pay_amount_sent: parseFloat(f.text_to_pay_amount_sent) || null,
      time_started_mnl: f.time_started_mnl || null, time_ended_mnl: f.time_ended_mnl || null, time_duration: f.time_duration,
      claim_status: f.claim_status, amount_collected: parseFloat(f.amount_collected) || null, location: f.location,
      review_status: 'For Review', reviewed_by: null, review_notes: null, date_reviewed: null
    }),
    requiredFields: ['patient_id', 'insurance_provider', 'location', 'worked_date', 'date_of_service', 'text_to_pay_amount_sent', 'time_started_mnl', 'time_ended_mnl', 'time_duration', 'claim_status', 'amount_collected']
  }
};

// Config for EntryPreview: module-specific preview fields, edit forms, and admin edit sections
const ENTRY_PREVIEW_CONFIG = {
  'billing-inquiry': {
    previewFields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'Date of Request', key: 'date_of_request', format: 'date' },
      { label: 'Inquiry Type', key: 'inquiry_type' }, { label: 'Amount in Question', key: 'amount_in_question', format: 'currency', colorClass: 'text-emerald-600' },
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
  },
  'hospital-cases': {
    previewFields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'Date of Request', key: 'date_of_request', format: 'date' },
      { label: 'Inquiry Type', key: 'inquiry_type' },
      { label: 'Contact Method', key: 'best_contact_method' }, { label: 'Best Time to Contact', key: 'best_contact_time' },
      { label: 'Description', key: 'description', colSpan: 2, isBlock: true }
    ],
    reviewReadOnly: { show: (e) => e.reviewed_by || e.date_reviewed || e.result, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-800', title: 'Review Details',
      fields: [{ label: 'Reviewed By', key: 'reviewed_by' }, { label: 'Date Reviewed', key: 'date_reviewed', format: 'date' }, { label: 'Result', key: 'result', colSpan: 2 }] },
    adminEdit: { btnGradient: 'from-indigo-500 to-purple-500', btnLabel: 'Review & Update Status', editBg: 'bg-indigo-50', editBorder: 'border-indigo-200', editTextColor: 'text-indigo-800', editTitle: 'Review Hospital Case', focusColor: 'focus:border-indigo-400',
      statuses: ['Pending', 'In Progress', 'Reviewed'], formKey: 'hospital', saveHandler: 'handleHospitalSave',
      fields: [
        { type: 'select', label: 'Status', key: 'status' },
        { type: 'reviewerSelect', label: 'Reviewed By', key: 'reviewed_by' },
        { type: 'date', label: 'Date Reviewed', key: 'date_reviewed' }
      ],
      extraFields: [{ type: 'textarea', label: 'Result', key: 'result', placeholder: 'Enter review result or notes...' }]
    }
  },
  'eod-patient-scheduling': {
    previewFields: [
      { label: 'Patient Name / ID', key: 'patient_name_id' }, { label: 'Patient Type', key: 'patient_type' },
      { label: 'Insurance Provider', key: 'insurance_provider' }, { label: 'Referral Source', key: 'referral_source' },
      { label: 'Location', key: 'location' },
      { label: 'Worked / Call Date', key: 'worked_call_date', format: 'date' }, { label: 'Appt Booked / RS Date', key: 'appt_booked_rs_date', format: 'date' },
      { label: 'Call Type', key: 'call_type' }, { label: 'Call Outcome', key: 'call_outcome' },
      { label: 'Additional Patients', key: 'additional_patients', customRender: (e) => e.additional_patients?.length > 0 ? e.additional_patients.join(', ') : '-' },
      { label: 'Memo', key: 'memo', colSpan: 2, isBlock: true }
    ]
  },
  'eod-insurance-verification': {
    previewFields: [
      { label: 'Patient ID', key: 'patient_id' }, { label: 'Insurance Provider', key: 'insurance_provider' },
      { label: 'Location', key: 'location' },
      { label: 'Verified Date', key: 'verified_date', format: 'date' },
      { label: 'Date of Service', key: 'dos', format: 'date' },
      { label: 'Time Started (HST)', key: 'time_started_hst' }, { label: 'Time Ended (HST)', key: 'time_ended_hst' },
      { label: 'Time Duration', key: 'time_duration' }, { label: 'Status', key: 'status' }
    ]
  },
  'eod-claim-submission': {
    previewFields: [
      { label: 'Claim ID', key: 'claim_id' }, { label: 'Insurance Provider', key: 'insurance_provider' },
      { label: 'Worked Date', key: 'worked_date', format: 'date' },
      { label: 'Date of Service', key: 'date_of_service', format: 'date' }, { label: 'Claim Amount', key: 'claim_amount', format: 'currency', colorClass: 'text-emerald-600' },
      { label: 'Time Started (HST)', key: 'time_started_hst' }, { label: 'Time Ended (HST)', key: 'time_ended_hst' },
      { label: 'Time Duration', key: 'time_duration' }, { label: 'Claim Status', key: 'claim_status' },
      { label: 'Comments', key: 'comments', colSpan: 2, isBlock: true }
    ]
  },
  'eod-payment-posting': {
    previewFields: [
      { label: 'Insurance Provider', key: 'insurance_provider' }, { label: 'Receipt #', key: 'receipt_number' },
      { label: 'Payment Date', key: 'payment_date', format: 'date' },
      { label: 'Deposit Date', key: 'deposit_date', format: 'date' }, { label: 'Amount', key: 'amount', format: 'currency', colorClass: 'text-emerald-600' },
      { label: 'Payment Type', key: 'payment_type' }, { label: 'Reference #', key: 'reference_number' },
      { label: 'Date Posted', key: 'date_posted', format: 'date' },
      { label: 'Time Started (HST)', key: 'time_started_hst' }, { label: 'Time Ended (HST)', key: 'time_ended_hst' },
      { label: 'Time Duration', key: 'time_duration' }, { label: 'Locate By', key: 'locate_by' },
      { label: 'Location', key: 'location' },
      { label: 'Remarks', key: 'remarks', colSpan: 2, isBlock: true }
    ]
  },
  'eod-claim-followup': {
    previewFields: [
      { label: 'Claim ID', key: 'claim_id' }, { label: 'Insurance Provider', key: 'insurance_provider' },
      { label: 'Worked Date', key: 'worked_date', format: 'date' },
      { label: 'Date of Service', key: 'date_of_service', format: 'date' }, { label: 'Insurance Expected', key: 'insurance_expected', format: 'currency', colorClass: 'text-emerald-600' },
      { label: 'Time Started (MNL)', key: 'time_started_mnl' }, { label: 'Time Ended (MNL)', key: 'time_ended_mnl' },
      { label: 'Time Duration', key: 'time_duration' }, { label: 'Claim Status', key: 'claim_status' },
      { label: 'Amount Collected', key: 'amount_collected', format: 'currency', colorClass: 'text-emerald-600' }
    ]
  },
  'eod-patient-aging': {
    previewFields: [
      { label: 'Patient ID', key: 'patient_id' }, { label: 'Insurance Provider', key: 'insurance_provider' },
      { label: 'Location', key: 'location' },
      { label: 'Worked Date', key: 'worked_date', format: 'date' },
      { label: 'Date of Service', key: 'date_of_service', format: 'date' },
      { label: 'Text to Pay Amount Sent', key: 'text_to_pay_amount_sent', format: 'currency', colorClass: 'text-emerald-600' },
      { label: 'Time Started (MNL)', key: 'time_started_mnl' }, { label: 'Time Ended (MNL)', key: 'time_ended_mnl' },
      { label: 'Time Duration', key: 'time_duration' }, { label: 'Claim Status', key: 'claim_status' },
      { label: 'Amount Collected', key: 'amount_collected', format: 'currency', colorClass: 'text-emerald-600' }
    ]
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
    getAmount: (e) => e.amount_in_question > 0 ? `$${Number(e.amount_in_question || 0).toFixed(2)}` : null,
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
  },
  'hospital-cases': {
    getTitle: (e) => e.chart_number ? <span className="font-bold text-indigo-600">Chart# {e.chart_number}</span> : null,
    getSubtitle: (e) => e.patient_name || 'No Patient Name',
    getDetail: (e) => `${e.locations?.name} • ${e.inquiry_type || 'No Type'} • ${e.date_of_request ? new Date(e.date_of_request).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}`,
  },
  'eod-patient-scheduling': {
    getTitle: (e) => <span className="font-bold text-teal-600">{e.creator?.name || 'Unknown'}</span>,
    getSubtitle: (e) => `${(e.batch_records?.length || 1)} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}`,
    getDetail: (e) => `${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • Patient Scheduling`,
  },
  'eod-insurance-verification': {
    getTitle: (e) => <span className="font-bold text-cyan-600">{e.creator?.name || 'Unknown'}</span>,
    getSubtitle: (e) => `${(e.batch_records?.length || 1)} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}`,
    getDetail: (e) => `${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • Insurance Verification`,
  },
  'eod-claim-submission': {
    getTitle: (e) => <span className="font-bold text-sky-600">{e.creator?.name || 'Unknown'}</span>,
    getSubtitle: (e) => `${(e.batch_records?.length || 1)} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}`,
    getDetail: (e) => `${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • Claim Submission`,
  },
  'eod-payment-posting': {
    getTitle: (e) => <span className="font-bold text-blue-600">{e.creator?.name || 'Unknown'}</span>,
    getSubtitle: (e) => `${(e.batch_records?.length || 1)} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}`,
    getDetail: (e) => `${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • Payment Posting`,
  },
  'eod-claim-followup': {
    getTitle: (e) => <span className="font-bold text-violet-600">{e.creator?.name || 'Unknown'}</span>,
    getSubtitle: (e) => `${(e.batch_records?.length || 1)} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}`,
    getDetail: (e) => `${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • Claim Follow-Up`,
  },
  'eod-patient-aging': {
    getTitle: (e) => <span className="font-bold text-purple-600">{e.creator?.name || 'Unknown'}</span>,
    getSubtitle: (e) => `${(e.batch_records?.length || 1)} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}`,
    getDetail: (e) => `${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • Patient Aging`,
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
      { label: 'Amount in Question', key: 'amount_in_question', prefix: '$' },
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
  },
  'hospital-cases': {
    title: 'Hospital Case',
    fields: [
      { label: 'Patient Name', key: 'patient_name' },
      { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' },
      { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type of Inquiry', key: 'inquiry_type', options: HOSPITAL_CASE_TYPES },
      { label: 'Best Contact Method', key: 'best_contact_method', options: CONTACT_METHODS },
      { label: 'Best Time to Contact', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description', key: 'description' },
    fileLabel: 'Supporting Documentation', fileKey: 'documentation'
  },
  'eod-patient-scheduling': {
    title: 'Patient Scheduling',
    fields: [
      { label: 'Patient Name / ID', key: 'patient_name_id', required: true },
      { label: 'Patient Type', key: 'patient_type', options: PATIENT_TYPES, required: true },
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS, required: true },
      { label: 'Referral Source', key: 'referral_source', options: REFERRAL_SOURCES },
      { label: 'Location', key: 'location', options: SCHEDULING_LOCATIONS, required: true },
      { label: 'Worked / Call Date', key: 'worked_call_date', type: 'date' },
      { label: 'Appt Booked / RS Date', key: 'appt_booked_rs_date', type: 'date' },
      { label: 'Call Type', key: 'call_type', options: CALL_TYPES, required: true },
      { label: 'Call Outcome', key: 'call_outcome', options: CALL_OUTCOMES, required: true },
    ],
    largeField: { label: 'Memo', key: 'memo', required: true },
    hasMultiplePatients: true,
    fileLabel: 'Documentation', fileKey: 'documentation'
  },
  'eod-insurance-verification': {
    title: 'Insurance Verification',
    fields: [
      { label: 'Patient ID', key: 'patient_id', required: true },
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS, required: true },
      { label: 'Location', key: 'location', options: SCHEDULING_LOCATIONS, required: true },
      { label: 'Verified Date', key: 'verified_date', type: 'date', required: true },
      { label: 'Date of Service', key: 'dos', type: 'date', required: true },
      { label: 'Time Started (HST)', key: 'time_started_hst', type: 'time', required: true },
      { label: 'Time Ended (HST)', key: 'time_ended_hst', type: 'time', required: true },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m', required: true },
      { label: 'Status', key: 'status', options: VERIFICATION_STATUSES, required: true },
    ],
    fileLabel: 'Documentation', fileKey: 'documentation'
  },
  'eod-claim-submission': {
    title: 'Claim Submission',
    fields: [
      { label: 'Claim ID', key: 'claim_id', required: true },
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS, required: true },
      { label: 'Worked Date', key: 'worked_date', type: 'date', required: true },
      { label: 'Date of Service', key: 'date_of_service', type: 'date', required: true },
      { label: 'Claim Amount', key: 'claim_amount', prefix: '$', required: true },
      { label: 'Time Started (HST)', key: 'time_started_hst', type: 'time', required: true },
      { label: 'Time Ended (HST)', key: 'time_ended_hst', type: 'time', required: true },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m', required: true },
      { label: 'Claim Status', key: 'claim_status', required: true },
    ],
    largeField: { label: 'Comments', key: 'comments', required: true },
    fileLabel: 'Documentation', fileKey: 'documentation'
  },
  'eod-payment-posting': {
    title: 'Payment Posting',
    fields: [
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS, required: true },
      { label: 'Receipt #', key: 'receipt_number', required: true },
      { label: 'Payment Date', key: 'payment_date', type: 'date', required: true },
      { label: 'Deposit Date', key: 'deposit_date', type: 'date', required: true },
      { label: 'Amount', key: 'amount', prefix: '$', required: true },
      { label: 'Payment Type', key: 'payment_type', options: PAYMENT_TYPE_OPTIONS, required: true },
      { label: 'Reference #', key: 'reference_number', required: true },
      { label: 'Date Posted', key: 'date_posted', type: 'date', required: true },
      { label: 'Time Started (HST)', key: 'time_started_hst', type: 'time', required: true },
      { label: 'Time Ended (HST)', key: 'time_ended_hst', type: 'time', required: true },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m', required: true },
      { label: 'Locate By', key: 'locate_by', options: LOCATE_BY_OPTIONS, required: true },
      { label: 'Location', key: 'location', options: 'locations', required: true },
    ],
    largeField: { label: 'Remarks', key: 'remarks', required: true },
    fileLabel: 'Documentation', fileKey: 'documentation'
  },
  'eod-claim-followup': {
    title: 'Claim Follow-Up',
    fields: [
      { label: 'Claim ID', key: 'claim_id' },
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS },
      { label: 'Worked Date', key: 'worked_date', type: 'date' },
      { label: 'Date of Service', key: 'date_of_service', type: 'date' },
      { label: 'Insurance Expected', key: 'insurance_expected', prefix: '$' },
      { label: 'Time Started (MNL)', key: 'time_started_mnl', type: 'time' },
      { label: 'Time Ended (MNL)', key: 'time_ended_mnl', type: 'time' },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m' },
      { label: 'Claim Status', key: 'claim_status', options: CLAIM_STATUSES },
      { label: 'Amount Collected', key: 'amount_collected', prefix: '$', required: true },
    ],
    fileLabel: 'Documentation', fileKey: 'documentation'
  },
  'eod-patient-aging': {
    title: 'Patient Aging',
    fields: [
      { label: 'Patient ID', key: 'patient_id', required: true },
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS, required: true },
      { label: 'Location', key: 'location', options: 'locations', required: true },
      { label: 'Worked Date', key: 'worked_date', type: 'date', required: true },
      { label: 'Date of Service', key: 'date_of_service', type: 'date', required: true },
      { label: 'Text to Pay Amount Sent', key: 'text_to_pay_amount_sent', prefix: '$', required: true },
      { label: 'Time Started (MNL)', key: 'time_started_mnl', type: 'time', required: true },
      { label: 'Time Ended (MNL)', key: 'time_ended_mnl', type: 'time', required: true },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m', required: true },
      { label: 'Claim Status', key: 'claim_status', required: true },
      { label: 'Amount Collected', key: 'amount_collected', prefix: '$', required: true },
    ],
    fileLabel: 'Documentation', fileKey: 'documentation'
  }
};

// Config for staff history edit form fields
const STAFF_EDIT_FIELDS_CONFIG = {
  'billing-inquiry': {
    fields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type of Inquiry', key: 'inquiry_type', options: INQUIRY_TYPES },
      { label: 'Amount in Question', key: 'amount_in_question', prefix: '$' },
      { label: 'Contact Method', key: 'best_contact_method', options: CONTACT_METHODS },
      { label: 'Best Time to Contact', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description', key: 'description' }
  },
  'hospital-cases': {
    fields: [
      { label: 'Patient Name', key: 'patient_name' }, { label: 'Chart Number', key: 'chart_number' },
      { label: 'Parent Name', key: 'parent_name' }, { label: 'Date of Request', key: 'date_of_request', type: 'date' },
      { label: 'Type of Inquiry', key: 'inquiry_type', options: HOSPITAL_CASE_TYPES },
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
  'it-requests': {
    fields: [
      { label: 'Date Reported', key: 'date_reported', type: 'date' },
      { label: 'Urgency', key: 'urgency', options: ['Low', 'Medium', 'High', 'Critical'] },
      { label: 'Requester Name', key: 'requester_name' }, { label: 'Device/System', key: 'device_system' },
      { label: 'Contact Method', key: 'best_contact_method', options: ['Phone', 'Email', 'Text'] },
      { label: 'Best Contact Time', key: 'best_contact_time' },
    ],
    largeField: { label: 'Description of Issue', key: 'description_of_issue' }
  },
  'eod-patient-scheduling': {
    fields: [
      { label: 'Patient Name / ID', key: 'patient_name_id' }, { label: 'Patient Type', key: 'patient_type', options: PATIENT_TYPES },
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS },
      { label: 'Referral Source', key: 'referral_source', options: REFERRAL_SOURCES },
      { label: 'Location', key: 'location', options: SCHEDULING_LOCATIONS },
      { label: 'Worked / Call Date', key: 'worked_call_date', type: 'date' },
      { label: 'Appt Booked / RS Date', key: 'appt_booked_rs_date', type: 'date' },
      { label: 'Call Type', key: 'call_type', options: CALL_TYPES }, { label: 'Call Outcome', key: 'call_outcome', options: CALL_OUTCOMES },
    ],
    largeField: { label: 'Memo', key: 'memo' }
  },
  'eod-insurance-verification': {
    fields: [
      { label: 'Patient ID', key: 'patient_id' }, { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS },
      { label: 'Location', key: 'location', options: SCHEDULING_LOCATIONS },
      { label: 'Verified Date', key: 'verified_date', type: 'date' },
      { label: 'Date of Service', key: 'dos', type: 'date' },
      { label: 'Time Started (HST)', key: 'time_started_hst', type: 'time' }, { label: 'Time Ended (HST)', key: 'time_ended_hst', type: 'time' },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m' }, { label: 'Status', key: 'status', options: VERIFICATION_STATUSES },
    ]
  },
  'eod-claim-submission': {
    fields: [
      { label: 'Claim ID', key: 'claim_id' }, { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS },
      { label: 'Worked Date', key: 'worked_date', type: 'date' },
      { label: 'Date of Service', key: 'date_of_service', type: 'date' }, { label: 'Claim Amount', key: 'claim_amount', prefix: '$' },
      { label: 'Time Started (HST)', key: 'time_started_hst', type: 'time' }, { label: 'Time Ended (HST)', key: 'time_ended_hst', type: 'time' },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m' }, { label: 'Claim Status', key: 'claim_status' },
    ],
    largeField: { label: 'Comments', key: 'comments' }
  },
  'eod-payment-posting': {
    fields: [
      { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS }, { label: 'Receipt #', key: 'receipt_number' },
      { label: 'Payment Date', key: 'payment_date', type: 'date' },
      { label: 'Deposit Date', key: 'deposit_date', type: 'date' }, { label: 'Amount', key: 'amount', prefix: '$' },
      { label: 'Payment Type', key: 'payment_type', options: PAYMENT_TYPE_OPTIONS }, { label: 'Reference #', key: 'reference_number' },
      { label: 'Date Posted', key: 'date_posted', type: 'date' },
      { label: 'Time Started (HST)', key: 'time_started_hst', type: 'time' }, { label: 'Time Ended (HST)', key: 'time_ended_hst', type: 'time' },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m' }, { label: 'Locate By', key: 'locate_by', options: LOCATE_BY_OPTIONS },
      { label: 'Location', key: 'location', options: 'locations' },
    ],
    largeField: { label: 'Remarks', key: 'remarks' }
  },
  'eod-claim-followup': {
    fields: [
      { label: 'Claim ID', key: 'claim_id' }, { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS },
      { label: 'Worked Date', key: 'worked_date', type: 'date' },
      { label: 'Date of Service', key: 'date_of_service', type: 'date' }, { label: 'Insurance Expected', key: 'insurance_expected', prefix: '$' },
      { label: 'Time Started (MNL)', key: 'time_started_mnl', type: 'time' }, { label: 'Time Ended (MNL)', key: 'time_ended_mnl', type: 'time' },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m' }, { label: 'Claim Status', key: 'claim_status', options: CLAIM_STATUSES },
      { label: 'Amount Collected', key: 'amount_collected', prefix: '$' },
    ]
  },
  'eod-patient-aging': {
    fields: [
      { label: 'Patient ID', key: 'patient_id' }, { label: 'Insurance Provider', key: 'insurance_provider', options: INSURANCE_PROVIDERS },
      { label: 'Location', key: 'location', options: 'locations' },
      { label: 'Worked Date', key: 'worked_date', type: 'date' },
      { label: 'Date of Service', key: 'date_of_service', type: 'date' }, { label: 'Text to Pay Amount Sent', key: 'text_to_pay_amount_sent', prefix: '$' },
      { label: 'Time Started (MNL)', key: 'time_started_mnl', type: 'time' }, { label: 'Time Ended (MNL)', key: 'time_ended_mnl', type: 'time' },
      { label: 'Time Duration', key: 'time_duration', placeholder: 'e.g. 1h 30m' }, { label: 'Claim Status', key: 'claim_status' },
      { label: 'Amount Collected', key: 'amount_collected', prefix: '$' },
    ]
  }
};

// Helper: render InputField grid from config
const renderFormFields = (fields, formState, updateFn, moduleId, extras) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {fields.map(f => {
      const opts = f.options === 'locations' ? (extras?.locations || []).map(l => l.name) : f.options;
      return <InputField key={f.key} label={f.required ? f.label + ' *' : f.label} type={f.type || 'text'} value={formState[f.key]} onChange={e => updateFn(moduleId, f.key, e.target.value)} prefix={f.prefix} options={opts} placeholder={f.placeholder} />;
    })}
  </div>
);

// Helper: render staff edit fields from config
const renderStaffEditFields = (fields, staffEditForm, updateStaffEditForm, extras) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {fields.map(f => {
      const opts = f.options === 'locations' ? (extras?.locations || []).map(l => l.name) : f.options;
      return <InputField key={f.key} label={f.label} type={f.type || 'text'} value={staffEditForm[f.key]} onChange={ev => updateStaffEditForm(f.key, ev.target.value)} prefix={f.prefix} options={opts} placeholder={f.placeholder} />;
    })}
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
        <p className={`text-xs sm:text-sm font-medium ${ANALYTICS_CARDS.subtitleColors[c.color]}`}>{c.label}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-1">{c.value}</p>
        {c.detail && <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${ANALYTICS_CARDS.detailColors[c.color]}`}>{c.detail}</p>}
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
  const roleMap = { 'it': 'IT', 'staff': 'Staff', 'super_admin': 'Super Admin', 'finance_admin': 'Finance Admin', 'office_manager': 'Office Manager', 'rev_rangers': 'Rev Rangers', 'rev_rangers_admin': 'Rev Rangers Admin' };
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
      <div className="bg-white rounded-2xl max-w-5xl max-h-[90vh] w-full mx-2 sm:mx-auto overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
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

function EntryPreview({ entry, module, onClose, colors, onViewDocument, currentUser, itUsers, financeAdminUsers, onUpdateStatus, onDelete, onUpdateBillingInquiry, onUpdateBillsPayment, onUpdateOrderRequest, onUpdateRefundRequest, onUpdateHospitalCase, onEodReview }) {
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
const [isEditing, setIsEditing] = useState(false);
  const [eodReviewForm, setEodReviewForm] = useState({ review_status: entry?.review_status || 'For Review', review_notes: entry?.review_notes || '' });
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
setEodReviewForm({
        review_status: entry.review_status || 'For Review',
        review_notes: entry.review_notes || ''
      });
      setIsEditing(false);
    }
  }, [entry]);
  if (!entry) return null;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' }) : '-';
  const formatCurrency = (val) => val ? `$${Number(val).toFixed(2)}` : '$0.00';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }) + ' HST' : '-';
const isITRequest = module?.id === 'it-requests';
const isBillingInquiry = module?.id === 'billing-inquiry';
  const isBillsPayment = module?.id === 'bills-payment';
  const isOrderRequest = module?.id === 'order-requests';
  const canEditIT = isITRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'it');
const canEditBilling = (isBillingInquiry || isBillsPayment) && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin' || (currentUser.role === 'rev_rangers' && isBillingInquiry));
const canEditOrders = isOrderRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin');
  const isRefundRequest = module?.id === 'refund-requests';
  const canEditRefunds = isRefundRequest && currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'finance_admin');
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
    const handleRefundSave = () => {
    if (onUpdateRefundRequest) {
      onUpdateRefundRequest(entry.id, refundEditForm);
    }
    setIsEditing(false);
    onClose();
  };
  const handleHospitalSave = () => {
    if (onUpdateHospitalCase) {
      onUpdateHospitalCase(entry.id, billingEditForm);
    }
    setIsEditing(false);
    onClose();
  };
  const handleEodReviewSave = () => {
    if (onEodReview) {
      onEodReview(module?.id, entry.id, eodReviewForm.review_status, eodReviewForm.review_notes);
    }
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
            {isEodModule(module?.id) ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</span>
            ) : (
              <StatusBadge status={entry.status || 'Pending'} />
            )}
            <span className="text-sm text-gray-500">Created: {formatDateTime(entry.created_at)}</span>
            {entry.updated_at !== entry.created_at && (
              <span className="text-sm text-gray-500">Updated: {formatDateTime(entry.updated_at)}</span>
            )}
            {entry.creator?.name && <span className="text-sm text-gray-500">By: {entry.creator.name}</span>}
          </div>
          {entry.locations?.name && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              <Building2 className="w-4 h-4" /> {entry.locations.name}
            </div>
          )}
{/* EOD Batch Spreadsheet View */}
          {isEodModule(module?.id) && entry.batch_records && entry.batch_records.length > 0 && (() => {
            const config = ENTRY_PREVIEW_CONFIG[module?.id];
            const fields = STAFF_FORM_CONFIG[module?.id]?.fields || [];
            const largeField = STAFF_FORM_CONFIG[module?.id]?.largeField;
            const allFields = largeField ? [...fields, largeField] : fields;
            return (
              <div className="space-y-4">
                {/* Record Count Badge */}
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 ${colors?.bg || 'bg-gray-100'} ${colors?.text || 'text-gray-700'} rounded-lg text-sm font-semibold flex items-center gap-2`}>
                    <FileText className="w-4 h-4" /> {entry.batch_records.length} Record{entry.batch_records.length > 1 ? 's' : ''}
                  </div>
                </div>
                {/* Spreadsheet Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider w-8 sm:w-10">#</th>
                          {allFields.map(f => (
                            <th key={f.key} className="px-2 sm:px-3 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{f.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entry.batch_records.map((record, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-400 font-medium">{idx + 1}</td>
                            {allFields.map(f => {
                              let val = record[f.key] || '-';
                              if (f.prefix && val !== '-') val = `${f.prefix}${val}`;
                              return <td key={f.key} className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{val}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Review Section */}
              </div>
            );
          })()}

          {/* Standard Preview for non-batch entries */}
          {(!isEodModule(module?.id) || !entry.batch_records || entry.batch_records.length === 0) && ENTRY_PREVIEW_CONFIG[module?.id] && (() => {
            const config = ENTRY_PREVIEW_CONFIG[module?.id];
            const isEod = config.adminEdit?.isEodReview;
            const canEdit = isEod ? (currentUser?.role === 'rev_rangers_admin' || currentUser?.role === 'super_admin')
              : module?.id === 'billing-inquiry' || module?.id === 'bills-payment' ? canEditBilling
              : module?.id === 'order-requests' ? canEditOrders
              : module?.id === 'refund-requests' ? canEditRefunds : false;
            const formKey = config.adminEdit?.formKey;
            const form = formKey === 'eodReview' ? eodReviewForm : formKey === 'billing' ? billingEditForm : formKey === 'order' ? orderEditForm : formKey === 'refund' ? refundEditForm : billingEditForm;
            const setForm = formKey === 'eodReview' ? setEodReviewForm : formKey === 'billing' ? setBillingEditForm : formKey === 'order' ? setOrderEditForm : formKey === 'refund' ? setRefundEditForm : setBillingEditForm;
            const saveFn = config.adminEdit?.saveHandler === 'handleEodReviewSave' ? handleEodReviewSave
              : config.adminEdit?.saveHandler === 'handleBillingSave' ? handleBillingSave
              : config.adminEdit?.saveHandler === 'handleBillsPaymentSave' ? handleBillsPaymentSave
              : config.adminEdit?.saveHandler === 'handleOrderSave' ? handleOrderSave
              : config.adminEdit?.saveHandler === 'handleRefundSave' ? handleRefundSave : config.adminEdit?.saveHandler === 'handleHospitalSave' ? handleHospitalSave : null;
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {config.reviewReadOnly.fields.map(rf => (
                        <div key={rf.key} className={rf.colSpan === 2 ? 'col-span-2' : ''}><span className="text-gray-600 text-sm block">{rf.label}</span><span className="font-medium">{rf.customRender ? rf.customRender(entry) : rf.format === 'date' ? formatDate(entry[rf.key]) : rf.format === 'datetime' ? formatDateTime(entry[rf.key]) : (entry[rf.key] || '-')}</span></div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {/* IT Requests */}
          {module?.id === 'it-requests' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    ? 'w-full sm:w-[600px] h-[85vh] sm:h-[700px]'
    : 'w-[calc(100vw-3rem)] sm:w-96 h-[70vh] sm:h-[500px]';
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
  const [activeModule, setActiveModule] = useState(() => {
    try { return localStorage.getItem('cch_last_activeModule') || 'billing-inquiry'; } catch (e) { return 'billing-inquiry'; }
  });
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('cch_last_view') || 'entry'; } catch (e) { return 'entry'; }
  });
  const [adminView, setAdminView] = useState(() => {
    try { return localStorage.getItem('cch_last_adminView') || 'records'; } catch (e) { return 'records'; }
  });
  const [moduleData, setModuleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewingFile, setViewingFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (key) => {
    setCollapsedSections(prev => {
      const wasCollapsed = prev[key] !== false;
      const next = {};
      Object.keys(prev).forEach(k => { next[k] = true; });
      if (wasCollapsed) next[key] = false;
      return next;
    });
  };
  const [adminLocation, setAdminLocation] = useState('all');
  const [editingStatus, setEditingStatus] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
const [sortOrder, setSortOrder] = useState('desc');
const [recordsPerPage, setRecordsPerPage] = useState(20);
const [currentPage, setCurrentPage] = useState(1);
const [eodFilterUser, setEodFilterUser] = useState('all');
const [eodFilterDateFrom, setEodFilterDateFrom] = useState('');
const [eodFilterDateTo, setEodFilterDateTo] = useState('');
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
  const [exportModule, setExportModule] = useState('billing-inquiry');
  const [exportLocation, setExportLocation] = useState('all');
  const [exportRange, setExportRange] = useState('This Month');
const [analyticsRange, setAnalyticsRange] = useState('This Month');
const [analyticsModule, setAnalyticsModule] = useState('billing-inquiry');
const [eodAnalyticsMonth, setEodAnalyticsMonth] = useState(() => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const y = parseInt(parts.find(p => p.type === 'year').value);
    const m = parseInt(parts.find(p => p.type === 'month').value) - 1;
    const d = parseInt(parts.find(p => p.type === 'day').value);
    return new Date(y, m, d);
  });
const [eodSelectedUser, setEodSelectedUser] = useState('all');
const [eodAnalyticsData, setEodAnalyticsData] = useState({});
const [eodCalendarPopup, setEodCalendarPopup] = useState(null);
const [vaReportDate, setVaReportDate] = useState(() => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
});
const [vaReportFilter, setVaReportFilter] = useState('all');
const [vaReportData, setVaReportData] = useState([]);
const [callAnalyticsRecords, setCallAnalyticsRecords] = useState([]);
const [callAnalyticsForm, setCallAnalyticsForm] = useState(() => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const hstToday = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
  return { date: hstToday, location: '', answered_by_va: '', answered_by_fd: '', missed_calls: '', short_missed: '', pre_queue_drop: '', capacity_missed: '' };
});
const [callAnalyticsFilterStart, setCallAnalyticsFilterStart] = useState('');
const [callAnalyticsFilterEnd, setCallAnalyticsFilterEnd] = useState('');
const [callAnalyticsFilterLocation, setCallAnalyticsFilterLocation] = useState('all');
const [editingCallAnalyticsId, setEditingCallAnalyticsId] = useState(null);
const [callAnalyticsTab, setCallAnalyticsTab] = useState('board');
  const [chatMessages, setChatMessages] = useState([{
    role: 'assistant',
    content: "👋 Hi! I'm your AI assistant. I can help with:\n\n• Data summaries & reports\n• Weekly comparisons\n• Location analytics\n• IT request status\n\nWhat would you like to know?"
  }]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [entryDocuments, setEntryDocuments] = useState({});
  const enrichWithLocationsAndUsers = async (data, includeUpdater = false) => {
    const locIds = [...new Set(data.map(d => d.location_id).filter(Boolean))];
    const { data: locsData } = await supabase.from('locations').select('id, name').in('id', locIds).eq('is_active', true);
    const locMap = {}; locsData?.forEach(l => { locMap[l.id] = l; });
    const userIds = [...new Set([...data.map(d => d.created_by), ...(includeUpdater ? data.map(d => d.updated_by) : []), ...data.map(d => d.reviewed_by)].filter(Boolean))];
    const { data: usersData } = await supabase.from('users').select('id, name').in('id', userIds);
    const userMap = {}; usersData?.forEach(u => { userMap[u.id] = u; });
    return data.map(d => ({ ...d, locations: locMap[d.location_id] || null, creator: userMap[d.created_by] || null, reviewer: userMap[d.reviewed_by] || null, ...(includeUpdater ? { updater: userMap[d.updated_by] || null } : {}) }));
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
  // Hawaii time (Pacific/Honolulu) - used for default dates throughout the system
  const today = (() => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
  })();
  const [forms, setForms] = useState({
    'billing-inquiry': { patient_name: '', chart_number: '', parent_name: '', date_of_request: today, inquiry_type: '', description: '', amount_in_question: '', best_contact_method: '', best_contact_time: '', billing_team_reviewed: '', date_reviewed: '', status: 'Pending', result: '' },
'bills-payment': { bill_date: today, vendor: '', transaction_id: '', description: '', amount: '', due_date: '', paid: '' },
    'order-requests': { date_entered: today, vendor: '', invoice_number: '', invoice_date: '', due_date: '', amount: '', entered_by: '', notes: '' },
  'refund-requests': { patient_name: '', chart_number: '', parent_name: '', rp_address: '', date_of_request: today, type: '', description: '', amount_requested: '', best_contact_method: '', contact_info: '', eassist_audited: '', status: 'Pending' },
    'hospital-cases': { patient_name: '', chart_number: '', parent_name: '', date_of_request: today, inquiry_type: '', description: '', best_contact_method: '', best_contact_time: '' },
'it-requests': { date_reported: today, urgency: '', requester_name: '', device_system: '', description_of_issue: '', best_contact_method: '', best_contact_time: '', assigned_to: '', status: 'Open', resolution_notes: '', completed_by: '' },
    'eod-patient-scheduling': { patient_name_id: '', patient_type: '', insurance_provider: '', referral_source: '', location: '', worked_call_date: today, appt_booked_rs_date: '', call_type: '', call_outcome: '', additional_patients: [], memo: '' },
    'eod-insurance-verification': { patient_id: '', insurance_provider: '', location: '', verified_date: today, dos: '', time_started_hst: '', time_ended_hst: '', time_duration: '', status: '' },
    'eod-claim-submission': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', claim_amount: '', time_started_hst: '', time_ended_hst: '', time_duration: '', claim_status: '', comments: '' },
    'eod-payment-posting': { insurance_provider: '', receipt_number: '', time_started_hst: '', payment_date: today, deposit_date: '', amount: '', payment_type: '', reference_number: '', date_posted: '', time_ended_hst: '', time_duration: '', locate_by: '', location: '', remarks: '' },
    'eod-claim-followup': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', insurance_expected: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' },
    'eod-patient-aging': { patient_id: '', insurance_provider: '', location: '', worked_date: today, date_of_service: '', text_to_pay_amount_sent: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' },
  });
  const [files, setFiles] = useState({
    'billing-inquiry': { documentation: [] },
    'bills-payment': { documentation: [] },
    'order-requests': { orderInvoices: [] },
    'refund-requests': { documentation: [] },
    'hospital-cases': { documentation: [] },
'it-requests': { documentation: [] },
    'eod-patient-scheduling': { documentation: [] },
    'eod-insurance-verification': { documentation: [] },
    'eod-claim-submission': { documentation: [] },
    'eod-payment-posting': { documentation: [] },
    'eod-claim-followup': { documentation: [] },
    'eod-patient-aging': { documentation: [] },
  });
  const [eodBatchRecords, setEodBatchRecords] = useState({});
  const [editingBatchIndex, setEditingBatchIndex] = useState(null);
  const [pendingBatchLoaded, setPendingBatchLoaded] = useState(false);
  const savePendingBatch = async (moduleId, batchArray) => {
    if (!currentUser?.id) return;
    if (batchArray.length === 0) {
      await supabase.from('eod_pending_batches').delete().eq('user_id', currentUser.id).eq('module_id', moduleId);
    } else {
      await supabase.from('eod_pending_batches').upsert({ user_id: currentUser.id, module_id: moduleId, batch_data: batchArray, updated_at: new Date().toISOString() }, { onConflict: 'user_id,module_id' });
    }
  };
  const loadPendingBatches = async () => {
    if (!currentUser?.id) return;
    const { data } = await supabase.from('eod_pending_batches').select('module_id, batch_data').eq('user_id', currentUser.id);
    if (data && data.length > 0) {
      const restored = {};
      data.forEach(row => { if (row.batch_data && row.batch_data.length > 0) restored[row.module_id] = row.batch_data; });
      setEodBatchRecords(prev => ({ ...prev, ...restored }));
    }
    setPendingBatchLoaded(true);
  };
useEffect(() => { if (currentUser?.id) loadPendingBatches(); }, [currentUser?.id]);
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
setAdminView('analytics');
} else if (sessionData.user.role === 'rev_rangers_admin') {
  loadUsers();
  setActiveModule('eod-patient-scheduling');
  setAdminView('eod-tracking');
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
useEffect(() => { try { localStorage.setItem('cch_last_activeModule', activeModule); } catch (e) {} }, [activeModule]);
useEffect(() => { try { localStorage.setItem('cch_last_view', view); } catch (e) {} }, [view]);
useEffect(() => { try { localStorage.setItem('cch_last_adminView', adminView); } catch (e) {} }, [adminView]);
useEffect(() => { setCurrentPage(1); setRecordSearch(''); }, [activeModule, adminLocation]);
  useEffect(() => { setStaffCurrentPage(1); setStaffRecordSearch(''); setEditingStaffEntry(null); }, [activeModule, selectedLocation]);
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
  const userIsAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'rev_rangers';
if (userIsAdmin && adminView === 'analytics' && analyticsModule) {
    if (!moduleData[analyticsModule]) {
      loadModuleData(analyticsModule);
    }
  }
}, [analyticsModule, adminView]);
const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'it' || currentUser?.role === 'rev_rangers' || currentUser?.role === 'rev_rangers_admin';
const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'it';
const isOfficeManager = currentUser?.role === 'office_manager';
const isITViewOnly = currentUser?.role === 'it' && activeModule !== 'it-requests';
useEffect(() => {
  if (!currentUser) return;
  const role = currentUser.role;
  const hasModules = true;
  const hasSupport = role === 'super_admin' || role === 'it' || !isAdmin || role === 'office_manager';
  const hasEod = canAccessEod(role);
  const sections = ['modules', 'eodReports', 'eod', 'management', 'support'];
  const visible = sections.filter(s => s === 'modules' ? hasModules : s === 'support' ? hasSupport : (s === 'eod' || s === 'eodReports') ? hasEod : isAdmin);
  const collapsed = {};
  visible.forEach((s, i) => { collapsed[s] = i > 0; });
  setCollapsedSections(collapsed);
}, [currentUser?.id]);
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
  if (isEodModule(moduleId) && currentUser?.role !== 'rev_rangers_admin' && currentUser?.role !== 'super_admin' && currentUser?.role !== 'it') {
    showMessage('error', 'Only admins can delete EOD records'); return false;
  }
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
  if (isEodModule(activeModule) && currentUser?.role !== 'rev_rangers_admin' && currentUser?.role !== 'super_admin' && currentUser?.role !== 'it') {
    showMessage('error', 'Only admins can delete EOD records'); return;
  }
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
    if (currentUser?.role === 'rev_rangers_admin' && !isEodModule(moduleId) && moduleId !== 'billing-inquiry' && moduleId !== 'hospital-cases') return;
    setLoading(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    if (!module) return;
    let query = supabase.from(module.table).select('*').order('created_at', { ascending: false });
    if (!isEodModule(moduleId)) {
if ((!isAdmin || isOfficeManager) && selectedLocation) {
      const loc = locations.find(l => l.name === selectedLocation);
      if (loc) query = query.eq('location_id', loc.id);
    } else if (isAdmin && !isOfficeManager && adminLocation !== 'all') {
      const loc = locations.find(l => l.name === adminLocation);
      if (loc) query = query.eq('location_id', loc.id);
    }
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
setAdminView('analytics');
    } else if (user.role === 'rev_rangers_admin') {
      loadUsers();
      setActiveModule('eod-patient-scheduling');
      setAdminView('eod-tracking');
      loadEodAnalyticsData(eodAnalyticsMonth);
      loadVaReport(vaReportDate, vaReportFilter);
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
  if ((currentUser.role === 'it' || currentUser.role === 'rev_rangers' || currentUser.role === 'rev_rangers_admin') && newUser.role === 'super_admin') {
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
  if ((currentUser.role === 'it' || currentUser.role === 'rev_rangers' || currentUser.role === 'rev_rangers_admin') && editingUser.role === 'super_admin') {
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
  const formatHstTime = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) + ' HST'; }
    catch (e) { return ''; }
  };
  const calcTimeDuration = (start, end) => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const updateForm = (module, field, value) => {
    setForms(prev => {
      const updated = { ...prev[module], [field]: value };
      const timeStartKey = updated.time_started_hst !== undefined ? 'time_started_hst' : updated.time_started_mnl !== undefined ? 'time_started_mnl' : null;
      const timeEndKey = updated.time_ended_hst !== undefined ? 'time_ended_hst' : updated.time_ended_mnl !== undefined ? 'time_ended_mnl' : null;
      if (timeStartKey && timeEndKey && (field === timeStartKey || field === timeEndKey)) {
        updated.time_duration = calcTimeDuration(updated[timeStartKey], updated[timeEndKey]);
      }
      return { ...prev, [module]: updated };
    });
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
    if (currentUser?.role === 'rev_rangers_admin' && !isEodModule(moduleId) && moduleId !== 'billing-inquiry' && moduleId !== 'hospital-cases') { showMessage('error', 'Access denied'); return; }
    const confirmed = await showConfirm('Submit Entry', 'Are you sure you want to submit this entry?', 'Submit', 'green');
    if (!confirmed) return;;
    setSaving(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    const form = forms[moduleId];
    let entryData = { created_by: currentUser.id, updated_by: currentUser.id };
    if (isEodModule(moduleId)) {
      // EOD modules don't need location_id
    } else {
const locationName = currentUser.role === 'rev_rangers' ? adminLocation : selectedLocation;
    const loc = locations.find(l => l.name === locationName);
    if (!loc) {
      showMessage('error', currentUser.role === 'rev_rangers' ? 'Please select a specific location from the sidebar filter' : 'Please select a location');
      setSaving(false);
      return;
    }
      entryData.location_id = loc.id;
    }
if (MODULE_FIELD_CONFIG[moduleId]) {
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
    setSaving(false);
  };
  // EOD Batch Entry Functions
  const getEodBatchLabel = (moduleId, record) => {
    const cfg = STAFF_FORM_CONFIG[moduleId];
    if (!cfg) return 'Record';
    const firstField = cfg.fields[0];
    return record[firstField.key] || 'Record';
  };
  const addToEodBatch = (moduleId) => {
    const form = forms[moduleId];
    const cfg = STAFF_FORM_CONFIG[moduleId];
    if (!cfg) return;
    // Check required fields
    const reqFields = MODULE_FIELD_CONFIG[moduleId]?.requiredFields;
    if (reqFields) {
      const missing = reqFields.filter(k => !form[k] || (typeof form[k] === 'string' && !form[k].trim()));
      if (missing.length > 0) {
        const labels = missing.map(k => { const f = cfg.fields.find(f => f.key === k) || (cfg.largeField?.key === k ? cfg.largeField : null); return f?.label?.replace(' *', '') || k; });
        showMessage('error', `Please fill in: ${labels.join(', ')}`); return;
      }
    } else {
      const firstKey = cfg.fields[0].key;
      if (!form[firstKey]) { showMessage('error', `Please fill in ${cfg.fields[0].label}`); return; }
    }
    const entryData = MODULE_FIELD_CONFIG[moduleId]?.getEntryData(form, currentUser) || {};
    const displayData = { ...form };
    if (editingBatchIndex !== null) {
      const updatedBatch = [...(eodBatchRecords[moduleId] || [])];
      updatedBatch[editingBatchIndex] = { entryData, displayData };
      setEodBatchRecords(prev => ({ ...prev, [moduleId]: updatedBatch }));
      savePendingBatch(moduleId, updatedBatch);
      setEditingBatchIndex(null);
      showMessage('success', '\u2713 Record updated in batch');
    } else {
      const updatedBatch = [...(eodBatchRecords[moduleId] || []), { entryData, displayData }];
      setEodBatchRecords(prev => ({ ...prev, [moduleId]: updatedBatch }));
      savePendingBatch(moduleId, updatedBatch);
      showMessage('success', '\u2713 Record added to batch');
    }
    // Reset entire form including dates
    const initForms = { 'eod-patient-scheduling': { patient_name_id: '', patient_type: '', insurance_provider: '', referral_source: '', location: '', worked_call_date: today, appt_booked_rs_date: '', call_type: '', call_outcome: '', additional_patients: [], memo: '' }, 'eod-insurance-verification': { patient_id: '', insurance_provider: '', verified_date: today, dos: '', time_started_hst: '', time_ended_hst: '', time_duration: '', status: '' }, 'eod-claim-submission': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', claim_amount: '', time_started_hst: '', time_ended_hst: '', time_duration: '', claim_status: '', comments: '' }, 'eod-payment-posting': { insurance_provider: '', receipt_number: '', time_started_hst: '', payment_date: today, deposit_date: '', amount: '', payment_type: '', reference_number: '', date_posted: '', time_ended_hst: '', time_duration: '', locate_by: '', location: '', remarks: '' }, 'eod-claim-followup': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', insurance_expected: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' }, 'eod-patient-aging': { patient_id: '', insurance_provider: '', location: '', worked_date: today, date_of_service: '', text_to_pay_amount_sent: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' } };
    setForms(prev => ({ ...prev, [moduleId]: initForms[moduleId] || prev[moduleId] }));
  };
  const editBatchRecord = (moduleId, index) => {
    const batch = eodBatchRecords[moduleId] || [];
    if (!batch[index]) return;
    setForms(prev => ({ ...prev, [moduleId]: { ...batch[index].displayData } }));
    setEditingBatchIndex(index);
  };
  const removeFromEodBatch = (moduleId, index) => {
    const batch = [...(eodBatchRecords[moduleId] || [])];
    batch.splice(index, 1);
    setEodBatchRecords(prev => ({ ...prev, [moduleId]: batch }));
    savePendingBatch(moduleId, batch);
    if (editingBatchIndex === index) { setEditingBatchIndex(null); }
    else if (editingBatchIndex !== null && editingBatchIndex > index) { setEditingBatchIndex(editingBatchIndex - 1); }
  };
  const submitEodBatch = async (moduleId) => {
    const batch = eodBatchRecords[moduleId] || [];
    if (batch.length === 0) { showMessage('error', 'No records to submit. Add records first.'); return; }
    const confirmed = await showConfirm('Submit EOD Entry', `Submit ${batch.length} record${batch.length > 1 ? 's' : ''} for ${STAFF_FORM_CONFIG[moduleId]?.title || moduleId}?`, 'Submit All', 'green');
    if (!confirmed) return;
    setSaving(true);
    const module = ALL_MODULES.find(m => m.id === moduleId);
    // Build batch_records JSON array from all records
    const batchJson = batch.map(r => r.entryData);
    // Insert ONE row: first record populates main columns, all records go in batch_records
    const firstEntry = { ...batch[0].entryData };
    delete firstEntry.review_status;
    delete firstEntry.entry_time_hst;
    const insertData = {
      ...firstEntry,
      batch_records: batchJson,
      review_status: 'For Review',
      created_by: currentUser.id,
      updated_by: currentUser.id,
    };
    const { error } = await supabase.from(module.table).insert(insertData);
    if (error) {
      showMessage('error', 'Failed to submit: ' + error.message);
      setSaving(false);
      return;
    }
    showMessage('success', `\u2713 Entry submitted with ${batch.length} record${batch.length > 1 ? 's' : ''}!`);
    setEodBatchRecords(prev => ({ ...prev, [moduleId]: [] }));
    savePendingBatch(moduleId, []);
    setEditingBatchIndex(null);
    loadModuleData(moduleId);
    setSaving(false);
  };
// Generic module update: maps moduleId -> { table, title, color, getUpdateData }
const MODULE_UPDATE_MAP = {
  'billing-inquiry': { table: 'billing_inquiries', title: 'Billing Inquiry', color: 'blue', getData: (f, uid) => ({ status: f.status, billing_team_reviewed: f.billing_team_reviewed || null, date_reviewed: f.date_reviewed || null, result: f.result || null, updated_by: uid }) },
  'bills-payment': { table: 'bills_payment', title: 'Bills Payment', color: 'violet', getData: (f, uid) => ({ status: f.status, ap_reviewed: f.billing_team_reviewed || null, date_reviewed: f.date_reviewed || null, paid: f.paid, updated_by: uid }) },
  'order-requests': { table: 'order_requests', title: 'Order Request', color: 'amber', getData: (f, uid) => ({ status: f.status, reviewed_by: f.reviewed_by || null, reviewed_at: f.status === 'Reviewed' ? new Date().toISOString() : null, updated_by: uid }) },
  'refund-requests': { table: 'refund_requests', title: 'Refund Request', color: 'rose', getData: (f, uid) => ({ status: f.status, reviewed_by: f.reviewed_by || null, reviewed_at: f.status === 'Reviewed' ? new Date().toISOString() : null, result: f.result || null, updated_by: uid }) },
  'hospital-cases': { table: 'hospital_cases', title: 'Hospital Case', color: 'indigo', getData: (f, uid) => ({ status: f.status, reviewed_by: f.reviewed_by || null, date_reviewed: f.date_reviewed || null, result: f.result || null, updated_by: uid }) },
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
const updateHospitalCase = (id, form) => updateModuleRecord('hospital-cases', id, form);
const handleEodReview = async (moduleId, entryId, reviewStatus, reviewNotes) => {
  const confirmed = await showConfirm('Submit Review', `Set status to "${reviewStatus}"?`, 'Confirm', reviewStatus === 'Approved' ? 'green' : 'red');
  if (!confirmed) return;
  const module = ALL_MODULES.find(m => m.id === moduleId);
  if (!module) return;
  const { error } = await supabase.from(module.table).update({
    review_status: reviewStatus,
    review_notes: reviewNotes || null,
    reviewed_by: currentUser.id,
    date_reviewed: new Date().toISOString(),
    updated_by: currentUser.id,
    updated_at: new Date().toISOString(),
  }).eq('id', entryId);
  if (error) { showMessage('error', 'Failed to update review: ' + error.message); return; }
  showMessage('success', `✓ Entry ${reviewStatus.toLowerCase()}!`);
  loadModuleData(moduleId);
  setViewingEntry(null);
};
const loadEodAnalyticsData = async (month, userOverride) => {
  const selectedUser = userOverride !== undefined ? userOverride : eodSelectedUser;
  const year = month.getFullYear();
  const m = month.getMonth();
  // Hawaii is UTC-10: start of month 00:00 HST = 10:00 UTC same day
  const startDate = new Date(Date.UTC(year, m, 1, 10, 0, 0)).toISOString();
  const endDate = new Date(Date.UTC(year, m + 1, 1, 9, 59, 59)).toISOString();
  const result = {};
  for (const mod of EOD_MODULES) {
    let query = supabase.from(mod.table).select('id, created_by, review_status, created_at').gte('created_at', startDate).lte('created_at', endDate);
    if (selectedUser !== 'all') query = query.eq('created_by', selectedUser);
    const { data } = await query;
    if (data) {
      data.forEach(entry => {
        const day = new Date(entry.created_at).toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
        if (!result[day]) result[day] = {};
        if (!result[day][mod.id]) result[day][mod.id] = [];
        result[day][mod.id].push(entry.review_status);
      });
    }
  }
  setEodAnalyticsData(result);
};
const loadEodCalendarEntries = async (dateStr, moduleId, moduleName, userOverride) => {
  const selectedUser = userOverride !== undefined ? userOverride : eodSelectedUser;
  const mod = EOD_MODULES.find(m => m.id === moduleId);
  if (!mod) return;
  // Hawaii is UTC-10: dateStr 00:00 HST = dateStr 10:00 UTC, dateStr 23:59 HST = next day 09:59 UTC
  const [y, mo, d] = dateStr.split('-').map(Number);
  const nextDay = new Date(Date.UTC(y, mo - 1, d + 1));
  const nextDayStr = nextDay.toISOString().split('T')[0];
  let query = supabase.from(mod.table).select('*').gte('created_at', dateStr + 'T10:00:00Z').lte('created_at', nextDayStr + 'T09:59:59Z');
  if (selectedUser !== 'all') query = query.eq('created_by', selectedUser);
  const { data } = await query;
  const enriched = data ? await enrichWithLocationsAndUsers(data, false) : [];
  setEodCalendarPopup({ date: dateStr, moduleId, moduleName, entries: enriched });
};
const loadVaReport = async (dateStr, vaFilterOverride) => {
  const filter = vaFilterOverride !== undefined ? vaFilterOverride : vaReportFilter;
  // Hawaii UTC-10: dateStr 00:00 HST = dateStr 10:00 UTC, dateStr 23:59 HST = next day 09:59 UTC
  const [y, mo, d] = dateStr.split('-').map(Number);
  const nextDay = new Date(Date.UTC(y, mo - 1, d + 1));
  const nextDayStr = nextDay.toISOString().split('T')[0];
  let query = supabase.from('eod_patient_scheduling').select('*').gte('created_at', dateStr + 'T10:00:00Z').lte('created_at', nextDayStr + 'T09:59:59Z');
  if (filter !== 'all') query = query.eq('created_by', filter);
  const { data } = await query;
  if (!data) { setVaReportData([]); return; }
  // Group by creator
  const byCreator = {};
  for (const entry of data) {
    const creatorId = entry.created_by;
    if (!byCreator[creatorId]) byCreator[creatorId] = { creatorId, records: [] };
    const rows = entry.batch_records && entry.batch_records.length > 0 ? entry.batch_records : [entry];
    rows.forEach(r => byCreator[creatorId].records.push(r));
  }
  // Resolve creator names
  const creatorIds = Object.keys(byCreator);
  let creatorMap = {};
  if (creatorIds.length > 0) {
    const { data: usersData } = await supabase.from('users').select('id, name').in('id', creatorIds);
    if (usersData) usersData.forEach(u => { creatorMap[u.id] = u.name; });
  }
  // Aggregate metrics per VA
  const result = creatorIds.map(cid => {
    const recs = byCreator[cid].records;
    let inbound = 0, outbound = 0, apptConfirmation = 0, didNotCall = 0, apptBooked = 0, apptRescheduled = 0, rcm = 0, totalPatients = 0;
    recs.forEach(r => {
      const ct = (r.call_type || '').toLowerCase();
      const co = (r.call_outcome || '').toLowerCase();
      if (ct === 'inbound') inbound++;
      else if (ct === 'outbound') outbound++;
      else if (ct === 'appointment confirmation') apptConfirmation++;
      if (co === 'no answer' || co === 'left vm' || co === 'no vm' || co === 'full vm') didNotCall++;
      if (co === 'scheduled' || co === 'appt confirmed') apptBooked++;
      if (co === 'rescheduled') apptRescheduled++;
      if (co === 'rcm' || ct === 'rcm') rcm++;
      // Count this patient + any additional_patients on the record
      const addl = Array.isArray(r.additional_patients) ? r.additional_patients.length : 0;
      totalPatients += 1 + addl;
    });
    const totalCalls = inbound + outbound + apptConfirmation;
    return { vaName: creatorMap[cid] || 'Unknown', inbound, outbound, apptConfirmation, didNotCall, apptBooked, apptRescheduled, rcm, totalCalls, totalPatients };
  }).sort((a, b) => a.vaName.localeCompare(b.vaName));
  setVaReportData(result);
};
const canManageCallAnalytics = currentUser?.role === 'super_admin' || currentUser?.role === 'rev_rangers_admin';
const loadCallAnalytics = async () => {
  let query = supabase.from('eod_call_analytics').select('*').order('date', { ascending: false });
  if (callAnalyticsFilterStart) query = query.gte('date', callAnalyticsFilterStart);
  if (callAnalyticsFilterEnd) query = query.lte('date', callAnalyticsFilterEnd);
  if (callAnalyticsFilterLocation !== 'all') query = query.eq('location', callAnalyticsFilterLocation);
  const { data, error } = await query;
  if (error) { showMessage('error', 'Failed to load call analytics: ' + error.message); return; }
  setCallAnalyticsRecords(data || []);
};
const saveCallAnalytics = async () => {
  if (!canManageCallAnalytics) { showMessage('error', 'You do not have permission'); return; }
  const f = callAnalyticsForm;
  if (!f.date || !f.location) { showMessage('error', 'Date and Location are required'); return; }
  const payload = {
    date: f.date,
    location: f.location,
    answered_by_va: parseInt(f.answered_by_va) || 0,
    answered_by_fd: parseInt(f.answered_by_fd) || 0,
    missed_calls: parseInt(f.missed_calls) || 0,
    short_missed: parseInt(f.short_missed) || 0,
    pre_queue_drop: parseInt(f.pre_queue_drop) || 0,
    capacity_missed: parseInt(f.capacity_missed) || 0,
    updated_by: currentUser.id,
    updated_at: new Date().toISOString(),
  };
  let error;
  if (editingCallAnalyticsId) {
    ({ error } = await supabase.from('eod_call_analytics').update(payload).eq('id', editingCallAnalyticsId));
  } else {
    payload.created_by = currentUser.id;
    ({ error } = await supabase.from('eod_call_analytics').upsert(payload, { onConflict: 'date,location' }));
  }
  if (error) { showMessage('error', 'Failed to save: ' + error.message); return; }
  showMessage('success', editingCallAnalyticsId ? '\u2713 Record updated' : '\u2713 Record saved');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const hstToday = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
  setCallAnalyticsForm({ date: hstToday, location: '', answered_by_va: '', answered_by_fd: '', missed_calls: '', short_missed: '', pre_queue_drop: '', capacity_missed: '' });
  setEditingCallAnalyticsId(null);
  loadCallAnalytics();
};
const editCallAnalytics = (record) => {
  if (!canManageCallAnalytics) return;
  setCallAnalyticsForm({
    date: record.date,
    location: record.location,
    answered_by_va: record.answered_by_va || '',
    answered_by_fd: record.answered_by_fd || '',
    missed_calls: record.missed_calls || '',
    short_missed: record.short_missed || '',
    pre_queue_drop: record.pre_queue_drop || '',
    capacity_missed: record.capacity_missed || '',
  });
  setEditingCallAnalyticsId(record.id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
const deleteCallAnalytics = async (id) => {
  if (!canManageCallAnalytics) return;
  const confirmed = await showConfirm('Delete Record', 'Are you sure you want to delete this call analytics record?', 'Delete', 'red');
  if (!confirmed) return;
  const { error } = await supabase.from('eod_call_analytics').delete().eq('id', id);
  if (error) { showMessage('error', 'Failed to delete: ' + error.message); return; }
  showMessage('success', '\u2713 Record deleted');
  loadCallAnalytics();
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
  if (isEodModule(activeModule)) {
    if (eodFilterUser !== 'all') data = data.filter(e => e.created_by === eodFilterUser);
    if (eodFilterDateFrom) data = data.filter(e => new Date(e.created_at) >= new Date(eodFilterDateFrom + 'T00:00:00'));
    if (eodFilterDateTo) data = data.filter(e => new Date(e.created_at) <= new Date(eodFilterDateTo + 'T23:59:59'));
  }
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
  const [editingBatchForms, setEditingBatchForms] = useState([]);
  const startEditingStaffEntry = (entry) => {
  if (isEodModule(activeModule) && currentUser?.role === 'rev_rangers' && entry.created_by !== currentUser?.id) {
    showMessage('error', 'You can only edit your own records'); return;
  }
  setEditingStaffEntry(entry.id);
  if (isEodModule(activeModule) && entry.batch_records && entry.batch_records.length > 0) {
    setEditingBatchForms(entry.batch_records.map(r => ({ ...r })));
    setStaffEditForm({});
  } else if (MODULE_FIELD_CONFIG[activeModule]) {
    setStaffEditForm(MODULE_FIELD_CONFIG[activeModule].getEditInitial(entry));
    setEditingBatchForms([]);
  }
};
const updateStaffEditForm = (field, value) => {
  setStaffEditForm(prev => ({ ...prev, [field]: value }));
};
const updateBatchEditForm = (index, field, value) => {
  setEditingBatchForms(prev => {
    const updated = [...prev];
    const row = { ...updated[index], [field]: value };
    const timeStartKey = row.time_started_hst !== undefined ? 'time_started_hst' : row.time_started_mnl !== undefined ? 'time_started_mnl' : null;
    const timeEndKey = row.time_ended_hst !== undefined ? 'time_ended_hst' : row.time_ended_mnl !== undefined ? 'time_ended_mnl' : null;
    if (timeStartKey && timeEndKey && (field === timeStartKey || field === timeEndKey)) {
      row.time_duration = calcTimeDuration(row[timeStartKey], row[timeEndKey]);
    }
    updated[index] = row;
    return updated;
  });
};
const addBatchEditRow = () => {
  const fields = STAFF_FORM_CONFIG[activeModule]?.fields || [];
  const largeField = STAFF_FORM_CONFIG[activeModule]?.largeField;
  const emptyRow = {};
  fields.forEach(f => { emptyRow[f.key] = ''; });
  if (largeField) emptyRow[largeField.key] = '';
  emptyRow.review_status = 'For Review';
  setEditingBatchForms(prev => [...prev, emptyRow]);
};
const removeBatchEditRow = (index) => {
  setEditingBatchForms(prev => prev.filter((_, i) => i !== index));
};
const saveStaffEntryUpdate = async () => {
  if (!editingStaffEntry) return;
  const confirmed = await showConfirm('Save Changes', 'Are you sure you want to save these changes?', 'Save', 'green');
  if (!confirmed) return;
  setSaving(true);
  const module = ALL_MODULES.find(m => m.id === activeModule);
  if (isEodModule(activeModule) && editingBatchForms.length > 0) {
    // Update batch_records and first record's main columns
    const firstRecord = { ...editingBatchForms[0] };
    delete firstRecord.review_status;
    const updateData = { ...firstRecord, batch_records: editingBatchForms, updated_by: currentUser.id };
    const { error } = await supabase.from(module.table).update(updateData).eq('id', editingStaffEntry);
    if (error) { showMessage('error', 'Failed to update: ' + error.message); setSaving(false); return; }
  } else {
    let updateData = { updated_by: currentUser.id };
    if (MODULE_FIELD_CONFIG[activeModule]) {
      updateData = { ...updateData, ...MODULE_FIELD_CONFIG[activeModule].getUpdateData(staffEditForm) };
    }
    const { error } = await supabase.from(module.table).update(updateData).eq('id', editingStaffEntry);
    if (error) { showMessage('error', 'Failed to update: ' + error.message); setSaving(false); return; }
  }
  showMessage('success', '\u2713 Entry updated!');
  setEditingStaffEntry(null);
  setStaffEditForm({});
  setEditingBatchForms([]);
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
const currentColors = MODULE_COLORS[activeModule] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', accent: 'bg-gray-500', light: 'bg-gray-100' };
  const currentModule = ALL_MODULES.find(m => m.id === activeModule);
  const visibleModules = currentUser?.role === 'rev_rangers'
    ? MODULES.filter(m => m.id === 'billing-inquiry' || m.id === 'hospital-cases')
    : currentUser?.role === 'rev_rangers_admin'
    ? MODULES.filter(m => m.id === 'billing-inquiry' || m.id === 'hospital-cases')
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
      {/* Animated background orbs */}
      <div className="absolute top-1/4 -left-20 w-40 h-40 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-44 h-44 sm:w-80 sm:h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      {/* Floating grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

      <div className={LAYOUT.loginCard}>
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-full"></div>

        <div className="text-center mb-8">
          <div className="w-52 h-16 sm:w-72 sm:h-20 mx-auto mb-5 relative">
            <img src="/kidshine.png" alt="KidShine Hawaii" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Care Command Hub</h1>
          <p className="text-gray-400 text-sm mt-1.5 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Secure Portal
          </p>
        </div>

        {message.text && (
          <div className={`mb-5 p-3.5 rounded-xl text-sm flex items-center gap-2.5 animate-in slide-in-from-top duration-300 ${message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {message.text}
          </div>
        )}

        <div className="space-y-5">
          <div className="group">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-blue-600">Email / Username</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center transition-all group-focus-within:bg-blue-100">
                <User className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              </div>
              <input
                type="text"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="group">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-blue-600">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center transition-all group-focus-within:bg-blue-100">
                <Lock className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              </div>
              <input
                type={showLoginPwd ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-14 pr-14 py-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200">
                {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2.5 group/check"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-200' : 'border-gray-300 group-hover/check:border-blue-400'}`}>
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-500 select-none group-hover/check:text-gray-700 transition-colors">Stay logged in</span>
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loginLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Sign In <ChevronRight className="w-4 h-4" /></>
            )}
          </button>

          {/* Footer info */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>256-bit encrypted</span>
            </div>
            <span className="text-gray-300">|</span>
            <p className="text-xs text-gray-400">v0.94</p>
          </div>
        </div>
      </div>
    </div>
  );
}
if ((!isAdmin || isOfficeManager) && !selectedLocation && userLocations.length > 1) {
    return (
      <div className={LAYOUT.loginBg}>
        {/* Animated background orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        <div className={LAYOUT.loginCard}>
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-full"></div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Welcome, {currentUser.name}!</h1>
            <p className="text-gray-400 text-sm mt-1">Select your location to continue</p>
          </div>
          <div className="space-y-2.5">
            {userLocations.map((loc, i) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.name)}
                className="w-full p-4 border-2 border-gray-100 rounded-xl text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-3 transition-all duration-200 group"
                style={{animationDelay: `${i * 100}ms`}}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">{loc.name}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-all duration-200 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="w-full mt-6 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-all duration-200 flex items-center justify-center gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back to Login
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
    <div className="bg-white rounded-2xl max-w-md w-full mx-4 sm:mx-auto shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="p-4 sm:p-6">
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
  onUpdateHospitalCase={async (entryId, formData) => {
    await updateHospitalCase(entryId, formData);
    setViewingEntry(null);
  }}
  onEodReview={handleEodReview}
onDelete={(isITViewOnly || (isEodModule(activeModule) && currentUser?.role !== 'rev_rangers_admin' && currentUser?.role !== 'super_admin' && currentUser?.role !== 'it')) ? null : async (recordId) => {
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
              {currentUser?.role === 'it' ? <Monitor className="w-6 h-6 text-white" /> : currentUser?.role === 'rev_rangers' ? <Shield className="w-6 h-6 text-white" /> : currentUser?.role === 'rev_rangers_admin' ? <Shield className="w-6 h-6 text-white" /> : currentUser?.role === 'office_manager' ? <Users className="w-6 h-6 text-white" /> : isSuperAdmin ? <Shield className="w-6 h-6 text-white" /> : isAdmin ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
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
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-2">
{visibleModules.length > 0 && (
          <div className="rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
          <button onClick={() => toggleSection('modules')} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-100/80 transition-all duration-200 group">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-purple-400 transition-all duration-300 group-hover:h-5"></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinic Operations</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out ${collapsedSections.modules ? '-rotate-90' : 'rotate-0'}`} />
          </button>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedSections.modules ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
            <div className="px-1.5 pb-2 space-y-0.5">
          {isAdmin && currentUser?.role !== 'rev_rangers_admin' && currentUser?.role !== 'rev_rangers' && (
              <button
                onClick={() => { setAdminView('analytics'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'analytics' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'analytics' ? 'bg-purple-100' : 'bg-white group-hover/item:scale-105'}`}>
                  <BarChart3 className={`w-4 h-4 transition-colors duration-200 ${adminView === 'analytics' ? 'text-purple-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
                </div>
                <span className="text-sm font-medium">Operations Analytics</span>
                {adminView === 'analytics' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>}
              </button>
          )}
          {visibleModules.map(m => {
            const colors = MODULE_COLORS[m.id] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', accent: 'bg-gray-500', light: 'bg-gray-100' };
            const isActive = activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'settings';
            return (
              <button
                key={m.id}
                onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${isActive ? `${colors.bg} ${colors.text} shadow-sm` : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? colors.light : 'bg-white group-hover/item:scale-105'}`}>
                  <m.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? colors.text : 'text-gray-400 group-hover/item:text-gray-600'}`} />
                </div>
                <span className="text-sm font-medium">{m.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>}
            </button>
            );
          })}
            </div>
          </div>
          </div>
          )}
{canAccessEod(currentUser?.role) && (
  <div className="rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
    <button onClick={() => toggleSection('eodReports')} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-100/80 transition-all duration-200 group">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-emerald-400 transition-all duration-300 group-hover:h-5"></div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">EOD Reports</p>
      </div>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out ${collapsedSections.eodReports ? '-rotate-90' : 'rotate-0'}`} />
    </button>
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedSections.eodReports ? 'max-h-0 opacity-0' : 'max-h-[400px] opacity-100'}`}>
      <div className="px-1.5 pb-2 space-y-0.5">
        <button onClick={() => { setAdminView('eod-tracking'); loadEodAnalyticsData(eodAnalyticsMonth); loadVaReport(vaReportDate, vaReportFilter); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'eod-tracking' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'eod-tracking' ? 'bg-emerald-100' : 'bg-white group-hover/item:scale-105'}`}>
            <BarChart3 className={`w-4 h-4 transition-colors duration-200 ${adminView === 'eod-tracking' ? 'text-emerald-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
          </div>
          <span className="text-sm font-medium">Tracking</span>
          {adminView === 'eod-tracking' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
        </button>
        <button onClick={() => { setAdminView('eod-analytics'); loadCallAnalytics(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'eod-analytics' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'eod-analytics' ? 'bg-emerald-100' : 'bg-white group-hover/item:scale-105'}`}>
            <PieChart className={`w-4 h-4 transition-colors duration-200 ${adminView === 'eod-analytics' ? 'text-emerald-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
          </div>
          <span className="text-sm font-medium">Call Analytics</span>
          {adminView === 'eod-analytics' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
        </button>
        <button onClick={() => { setAdminView('eod-trends'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'eod-trends' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'eod-trends' ? 'bg-emerald-100' : 'bg-white group-hover/item:scale-105'}`}>
            <TrendingUp className={`w-4 h-4 transition-colors duration-200 ${adminView === 'eod-trends' ? 'text-emerald-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
          </div>
          <span className="text-sm font-medium">Trend Analysis</span>
          {adminView === 'eod-trends' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
        </button>
      </div>
    </div>
  </div>
)}
{canAccessEod(currentUser?.role) && (
  <div className="rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
    <button onClick={() => toggleSection('eod')} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-100/80 transition-all duration-200 group">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-teal-400 transition-all duration-300 group-hover:h-5"></div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">EOD Tracker</p>
      </div>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out ${collapsedSections.eod ? '-rotate-90' : 'rotate-0'}`} />
    </button>
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedSections.eod ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
      <div className="px-1.5 pb-2 space-y-0.5">
    {EOD_MODULES.map(m => {
      const colors = MODULE_COLORS[m.id] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', accent: 'bg-gray-500', light: 'bg-gray-100' };
      const isActive = activeModule === m.id && adminView !== 'eod-tracking' && adminView !== 'eod-analytics' && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings';
      return (
        <button
          key={m.id}
          onClick={() => { setActiveModule(m.id); setAdminView('rev-entry'); setView('entry'); setSidebarOpen(false); loadModuleData(m.id); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${isActive ? `${colors.bg} ${colors.text} shadow-sm` : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? colors.light : 'bg-white group-hover/item:scale-105'}`}>
            <m.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? colors.text : 'text-gray-400 group-hover/item:text-gray-600'}`} />
          </div>
          <span className="text-sm font-medium">{m.name}</span>
          {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>}
        </button>
      );
    })}
      </div>
    </div>
  </div>
)}
{!isAdmin && (
  <div className="mt-1">
    <button onClick={() => { setView('sop'); loadSOPs(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${view === 'sop' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:translate-x-0.5'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${view === 'sop' ? 'bg-blue-100' : 'bg-gray-100'}`}><BookOpen className="w-4 h-4" /></div>
      <span className="text-sm font-medium">SOPs</span>
    </button>
  </div>
)}
{isAdmin && (
          <div className="rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('management')} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-100/80 transition-all duration-200 group">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-indigo-400 transition-all duration-300 group-hover:h-5"></div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Management</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out ${collapsedSections.management ? '-rotate-90' : 'rotate-0'}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedSections.management ? 'max-h-0 opacity-0' : 'max-h-[400px] opacity-100'}`}>
                <div className="px-1.5 pb-2 space-y-0.5">
              <button onClick={() => { setAdminView('documents'); loadDocuments(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'documents' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'documents' ? 'bg-purple-100' : 'bg-white group-hover/item:scale-105'}`}><FolderOpen className={`w-4 h-4 transition-colors duration-200 ${adminView === 'documents' ? 'text-purple-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} /></div>
                <span className="text-sm font-medium">Documents</span>
                {adminView === 'documents' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>}
              </button>
              <button onClick={() => { setAdminView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'export' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'export' ? 'bg-purple-100' : 'bg-white group-hover/item:scale-105'}`}><Download className={`w-4 h-4 transition-colors duration-200 ${adminView === 'export' ? 'text-purple-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} /></div>
                <span className="text-sm font-medium">Export</span>
                {adminView === 'export' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>}
              </button>
              <button onClick={() => { setAdminView('sop'); loadSOPs(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'sop' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'sop' ? 'bg-purple-100' : 'bg-white group-hover/item:scale-105'}`}><BookOpen className={`w-4 h-4 transition-colors duration-200 ${adminView === 'sop' ? 'text-purple-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} /></div>
                <span className="text-sm font-medium">SOPs</span>
                {adminView === 'sop' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>}
              </button>
{(currentUser?.role === 'super_admin' || currentUser?.role === 'it' || currentUser?.role === 'rev_rangers' || currentUser?.role === 'rev_rangers_admin') && (
                <button onClick={() => { setAdminView('users'); loadUsers(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${adminView === 'users' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${adminView === 'users' ? 'bg-purple-100' : 'bg-white group-hover/item:scale-105'}`}><Users className={`w-4 h-4 transition-colors duration-200 ${adminView === 'users' ? 'text-purple-600' : 'text-gray-400 group-hover/item:text-gray-600'}`} /></div>
                  <span className="text-sm font-medium">Users</span>
                  {adminView === 'users' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>}
                </button>
              )}
                </div>
              </div>
          </div>
          )}
{(currentUser?.role === 'super_admin' || currentUser?.role === 'it' || !isAdmin || isOfficeManager) && (
          <div className="rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('support')} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-100/80 transition-all duration-200 group">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-amber-400 transition-all duration-300 group-hover:h-5"></div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Support</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out ${collapsedSections.support ? '-rotate-90' : 'rotate-0'}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsedSections.support ? 'max-h-0 opacity-0' : 'max-h-[400px] opacity-100'}`}>
                <div className="px-1.5 pb-2 space-y-0.5">
              {SUPPORT_MODULES.map(m => {
                const colors = MODULE_COLORS[m.id] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', accent: 'bg-gray-500', light: 'bg-gray-100' };
                const isActive = activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'settings';
                return (
                  <button
                    key={m.id}
                    onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group/item ${isActive ? `${colors.bg} ${colors.text} shadow-sm` : 'text-gray-600 hover:bg-white hover:shadow-sm hover:translate-x-0.5'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? colors.light : 'bg-white group-hover/item:scale-105'}`}>
                      <m.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? colors.text : 'text-gray-400 group-hover/item:text-gray-600'}`} />
                    </div>
                    <span className="text-sm font-medium">{m.name}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>}
                  </button>
                );
              })}
                </div>
              </div>
          </div>
          )}
        </nav>
        {/* Bottom buttons */}
        <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-gradient-to-t from-gray-50 to-white">
          <button
            onClick={() => { isAdmin ? setAdminView('settings') : setView('settings'); setSidebarOpen(false); }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 mb-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${(isAdmin ? adminView : view) === 'settings' ? (isAdmin ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm') : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
          >
            <Settings className={`w-4 h-4 transition-transform duration-300 ${(isAdmin ? adminView : view) === 'settings' ? 'rotate-90' : ''}`} /> Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-200">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen isolate">
<header className={LAYOUT.header}>
        <div className="flex items-center justify-between px-4 py-2 min-h-[70px]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-5 h-5" /></button>
              <div>
<h1 className="font-bold text-gray-800 text-sm sm:text-lg truncate max-w-[180px] sm:max-w-none">
                  {isAdmin ? (adminView === 'users' ? 'User Management' : adminView === 'export' ? 'Export Data' : adminView === 'documents' ? 'All Documents' : adminView === 'sop' ? 'SOPs' : adminView === 'settings' ? 'Settings' : adminView === 'analytics' ? 'Operations Analytics' : adminView === 'eod-tracking' ? 'EOD Tracking' : adminView === 'eod-analytics' ? 'EOD Analytics' : adminView === 'eod-trends' ? 'Trend Analysis' : adminView === 'rev-entry' ? `New Entry: ${currentModule?.name}` : currentUser?.role === 'rev_rangers' ? `Review: ${currentModule?.name}` : currentModule?.name) : (view === 'settings' ? 'Settings' : view === 'sop' ? 'SOPs' : currentModule?.name)}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[180px] sm:max-w-none">{isAdmin ? (adminLocation === 'all' ? 'All Locations' : adminLocation) : selectedLocation}</p>
              </div>
</div>
            <div className="flex items-center gap-4">
              {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
           <img src="/kidshine.png" alt="KidShine Hawaii" className="h-14 w-44 hidden sm:block object-contain" />
            </div>
          </div>
{/* Tabs */}
          <div className="flex gap-1.5 sm:gap-2 px-3 sm:px-4 pb-3 overflow-x-auto">
{isAdmin && isEodModule(activeModule) && (adminView === 'records' || adminView === 'rev-entry') ? (
              [{ id: 'rev-entry', label: '+ New Entry' }, { id: 'records', label: 'Records' }].map(tab => (
                <button key={tab.id} onClick={() => setAdminView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${adminView === tab.id ? `${currentColors?.accent} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
              ))
            ) : isAdmin && currentUser?.role === 'rev_rangers' && (adminView === 'records' || adminView === 'rev-entry') ? (
              [{ id: 'rev-entry', label: '+ New Entry' }, { id: 'records', label: 'Records' }].map(tab => (
                <button key={tab.id} onClick={() => setAdminView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${adminView === tab.id ? `${currentColors?.accent} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
              ))
            ) : isAdmin && adminView === 'records' ? (
              <button className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${currentColors?.accent} text-white shadow-lg`}>
                <FileText className="w-4 h-4" />Records
              </button>
            ) : !isAdmin && view !== 'settings' ? (
              [{ id: 'entry', label: '+ New Entry' }, { id: 'history', label: 'History' }].map(tab => (
<button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === tab.id ? BTN.tabActive : BTN.tabInactive}`}>{tab.label}</button>
              ))
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
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Name *" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                    <InputField label="Username *" value={editingUser ? (editingUser.username || '') : newUser.username} onChange={e => editingUser ? setEditingUser({...editingUser, username: e.target.value}) : setNewUser({...newUser, username: e.target.value})} placeholder="Login username" />
                    <InputField label="Email *" value={editingUser ? editingUser.email : newUser.email} onChange={e => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} />
                    <PasswordField label={editingUser ? "New Password" : "Password *"} value={editingUser ? (editingUser.newPassword || '') : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, newPassword: e.target.value}) : setNewUser({...newUser, password: e.target.value})} placeholder={editingUser ? "Leave blank to keep current" : ""} />
<InputField label="Role" value={editingUser ? editingUser.role : newUser.role} onChange={e => editingUser ? setEditingUser({...editingUser, role: e.target.value}) : setNewUser({...newUser, role: e.target.value})}options={currentUser?.role === 'super_admin' ? ['staff', 'office_manager', 'rev_rangers', 'rev_rangers_admin', 'finance_admin', 'it', 'super_admin'] : (currentUser?.role === 'it' || currentUser?.role === 'rev_rangers' || currentUser?.role === 'rev_rangers_admin') ? ['staff', 'office_manager', 'rev_rangers', 'rev_rangers_admin', 'finance_admin', 'it'] : ['staff', 'office_manager', 'rev_rangers', 'rev_rangers_admin', 'finance_admin']} />
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
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
           <div className={`${ICON_BOX.avatar} shrink-0 ${ROLE_STYLES[u.role]?.avatar || ROLE_STYLES.staff.avatar}`}>
              {u.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{u.name}</p>
             <p className="text-xs sm:text-sm text-gray-500 truncate">{u.username && <span className="text-blue-600">@{u.username} • </span>}{u.email} • {formatRole(u.role)}</p>
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
{isAdmin && adminView === 'analytics' && currentUser?.role !== 'rev_rangers_admin' && (
  <div className="space-y-6">
    {/* Module Selector */}
    <div className={CARD.analytics}>
<div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
 {[
          ...(currentUser?.role === 'rev_rangers' ? MODULES.filter(m => m.id === 'billing-inquiry' || m.id === 'hospital-cases') : MODULES)
        ].map(m => {
          const colors = MODULE_COLORS[m.id] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', accent: 'bg-gray-500', light: 'bg-gray-100' };
          const isActive = analyticsModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setAnalyticsModule(m.id)}
              className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all shrink-0 ${isActive ? `${colors.accent} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <m.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{m.name}</span>
              <span className="sm:hidden">{m.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
    {/* Date Range & Location Filter */}
    <div className={CARD.analytics}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${MODULE_COLORS[analyticsModule]?.light}`}>
            <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${MODULE_COLORS[analyticsModule]?.text}`} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">{ALL_MODULES.find(m => m.id === analyticsModule)?.name} Analytics</h2>
            <p className="text-xs sm:text-sm text-gray-500">{adminLocation === 'all' ? 'All Locations' : adminLocation}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
            <select
              value={adminLocation}
              onChange={e => setAdminLocation(e.target.value)}
              className={`${INPUT.filter} text-xs sm:text-sm flex-1 sm:flex-initial`}
            >
              <option value="all">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
            <select
              value={analyticsRange}
              onChange={e => setAnalyticsRange(e.target.value)}
              className={`${INPUT.filter} text-xs sm:text-sm flex-1 sm:flex-initial`}
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
      if (!moduleData[analyticsModule]) {
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
if (filteredData.length === 0) {
        return <EmptyState icon={BarChart3} message="No data available for this period" />;
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
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">{stats.count}</p>
                    <p className="text-sm text-gray-500">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Status Overview */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-blue-600">{inProgressCount}</p>
                  <p className="text-sm text-gray-600 mt-1">In Progress</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-emerald-600">{resolvedCount}</p>
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
                    <div key={loc} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-50 gap-2">
                      <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{loc}</span>
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
                        <span className="font-medium text-gray-800 text-sm sm:text-base truncate mr-2">{vendor}</span>
                        <span className="font-bold text-violet-600 text-sm sm:text-base shrink-0">${stats.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                        <span className="text-[10px] sm:text-xs text-gray-500 w-14 sm:w-20 flex-shrink-0">{monthName}</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-blue-600">{approvedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Approved</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-emerald-600">{completedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Completed</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-red-600">{deniedCount}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(byType).filter(([_, s]) => s.count > 0).map(([type, stats]) => (
                    <div key={type} className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="font-medium text-gray-800">{type}</p>
                      <p className="text-lg sm:text-2xl font-bold text-rose-600 mt-1">{stats.count}</p>
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
                    <div key={loc} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-50 gap-2">
                      <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{loc}</span>
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
      if (analyticsModule === 'hospital-cases') {
        const pendingCount = filteredData.filter(r => r.status === 'Pending' || !r.status).length;
        const inProgressCount = filteredData.filter(r => r.status === 'In Progress').length;
        const reviewedCount = filteredData.filter(r => r.status === 'Reviewed').length;
        const avgResolutionDays = (() => {
          const reviewed = filteredData.filter(r => r.date_reviewed && r.created_at);
          if (reviewed.length === 0) return 0;
          const totalDays = reviewed.reduce((sum, r) => {
            const created = new Date(r.created_at);
            const resolved = new Date(r.date_reviewed);
            return sum + Math.max(0, (resolved - created) / (1000 * 60 * 60 * 24));
          }, 0);
          return (totalDays / reviewed.length).toFixed(1);
        })();
        const byType = {};
        HOSPITAL_CASE_TYPES.forEach(t => byType[t] = { count: 0, pending: 0 });
        filteredData.forEach(r => {
          const type = r.inquiry_type || 'Other';
          if (!byType[type]) byType[type] = { count: 0, pending: 0 };
          byType[type].count += 1;
          if (r.status === 'Pending' || !r.status) byType[type].pending += 1;
        });
        const byLocation = {};
        filteredData.forEach(r => {
          const loc = r.locations?.name || 'Unknown';
          if (!byLocation[loc]) byLocation[loc] = { count: 0, pending: 0, reviewed: 0 };
          byLocation[loc].count += 1;
          if (r.status === 'Pending' || !r.status) byLocation[loc].pending += 1;
          if (r.status === 'Reviewed') byLocation[loc].reviewed += 1;
        });
        const byContact = {};
        filteredData.forEach(r => {
          const method = r.best_contact_method || 'Not Specified';
          if (!byContact[method]) byContact[method] = 0;
          byContact[method] += 1;
        });
        const recentCases = filteredData.filter(r => {
          const d = new Date(r.created_at);
          return (now - d) / (1000 * 60 * 60 * 24) <= 7;
        }).length;
        const prevWeekCases = filteredData.filter(r => {
          const d = new Date(r.created_at);
          const days = (now - d) / (1000 * 60 * 60 * 24);
          return days > 7 && days <= 14;
        }).length;
        const trend = prevWeekCases > 0 ? (((recentCases - prevWeekCases) / prevWeekCases) * 100).toFixed(0) : 0;
        return (
          <>
            {renderKPICards([
              { color: 'indigo', label: 'Total Cases', value: filteredData.length, detail: analyticsRange },
              { color: 'amber', label: 'Pending Review', value: pendingCount, detail: `${filteredData.length > 0 ? ((pendingCount / filteredData.length) * 100).toFixed(0) : 0}% of total` },
              { color: 'emerald', label: 'Reviewed', value: reviewedCount, detail: `${filteredData.length > 0 ? ((reviewedCount / filteredData.length) * 100).toFixed(0) : 0}% resolved` },
              { color: 'blue', label: 'Avg. Resolution', value: `${avgResolutionDays}d`, detail: 'Days to review' },
            ])}
            {/* Weekly Trend */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                {Number(trend) >= 0 ? <TrendingUp className="w-5 h-5 text-indigo-500" /> : <TrendingDown className="w-5 h-5 text-emerald-500" />}
                Weekly Trend
              </h3>
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex-1 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-indigo-600">{recentCases}</p>
                  <p className="text-sm text-gray-600 mt-1">This Week</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex-1 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-gray-600">{prevWeekCases}</p>
                  <p className="text-sm text-gray-600 mt-1">Last Week</p>
                </div>
                <div className={`p-4 rounded-xl flex-1 text-center ${Number(trend) > 0 ? 'bg-red-50 border border-red-200' : Number(trend) < 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-3xl font-bold ${Number(trend) > 0 ? 'text-red-600' : Number(trend) < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>{Number(trend) > 0 ? '+' : ''}{trend}%</p>
                  <p className="text-sm text-gray-600 mt-1">Change</p>
                </div>
              </div>
            </div>
            {/* Status Distribution */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-blue-600">{inProgressCount}</p>
                  <p className="text-sm text-gray-600 mt-1">In Progress</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-emerald-600">{reviewedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Reviewed</p>
                </div>
              </div>
            </div>
            {/* Case Type Breakdown */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" /> By Case Type
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(byType).filter(([_, s]) => s.count > 0).map(([type, stats]) => (
                  <div key={type} className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="font-medium text-gray-800">{type}</p>
                    <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1">{stats.count}</p>
                    <p className="text-sm text-gray-500">{stats.pending} pending</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Contact Method Breakdown */}
            <div className={CARD.base}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" /> Preferred Contact Method
              </h3>
              <div className="space-y-3">
                {Object.entries(byContact).sort((a, b) => b[1] - a[1]).map(([method, count]) => {
                  const pct = filteredData.length > 0 ? (count / filteredData.length * 100).toFixed(0) : 0;
                  return (
                    <div key={method} className="flex items-center gap-4">
                      <span className="font-medium text-gray-700 w-32">{method}</span>
                      <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-end pr-3" style={{ width: `${Math.max(pct, 8)}%` }}>
                          <span className="text-xs font-bold text-white">{count}</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-500 w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* By Location */}
            {Object.keys(byLocation).length > 1 && (
              <div className={CARD.base}>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" /> By Location
                </h3>
                <div className="space-y-3">
                  {Object.entries(byLocation).sort((a, b) => b[1].count - a[1].count).map(([loc, stats]) => (
                    <div key={loc} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-50 gap-2">
                      <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{loc}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-amber-600 font-medium">{stats.pending} pending</span>
                        <span className="text-sm text-emerald-600 font-medium">{stats.reviewed} reviewed</span>
                        <span className="font-bold text-indigo-600">{stats.count} cases</span>
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
{/* ADMIN: EOD Tracking */}
{isAdmin && adminView === 'eod-tracking' && (
  <div className="space-y-6">
    {/* Month Navigation & User Filter */}
    <div className={CARD.base}>
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => { const d = new Date(eodAnalyticsMonth); d.setMonth(d.getMonth() - 1); setEodAnalyticsMonth(d); loadEodAnalyticsData(d); }} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <h2 className="font-semibold text-gray-800 text-sm sm:text-lg">{eodAnalyticsMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => { const d = new Date(eodAnalyticsMonth); d.setMonth(d.getMonth() + 1); setEodAnalyticsMonth(d); loadEodAnalyticsData(d); }} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
        </div>
        {(currentUser?.role === 'rev_rangers_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin' || currentUser?.role === 'it') && (
          <select value={eodSelectedUser} onChange={e => { const newUser = e.target.value; setEodSelectedUser(newUser); loadEodAnalyticsData(eodAnalyticsMonth, newUser); }} className={INPUT.filter}>
            <option value="all">All Rev Rangers</option>
            {users.filter(u => u.role === 'rev_rangers').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>
    </div>
    {/* Per-Module Submission Counts */}
    {(() => {
      const monthLabel = eodAnalyticsMonth.toLocaleString('default', { month: 'long' });
      const perModuleCounts = {};
      EOD_MODULES.forEach(mod => { perModuleCounts[mod.id] = 0; });
      Object.values(eodAnalyticsData).forEach(day => {
        Object.entries(day).forEach(([modId, statuses]) => {
          if (perModuleCounts[modId] !== undefined) perModuleCounts[modId] += statuses.length;
        });
      });
      const totalEntries = Object.values(perModuleCounts).reduce((a, b) => a + b, 0);
      return (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-700">Submissions per Module — {monthLabel}</h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-700">Total: {totalEntries}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {EOD_MODULES.map(mod => {
              const colors = MODULE_COLORS[mod.id] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', light: 'bg-gray-100' };
              const count = perModuleCounts[mod.id] || 0;
              const ModIcon = mod.icon;
              return (
                <div key={mod.id} className={`p-3 rounded-xl border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg ${colors.light} flex items-center justify-center`}>
                      <ModIcon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className={`text-2xl font-bold ${colors.text}`}>{count}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-600 leading-tight">{mod.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    })()}
    {/* Calendar Grid */}
    <div className={CARD.base}>
      <div className="mb-4">
        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm text-gray-600 mb-3 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-lg bg-emerald-400 inline-block"></span> Submitted</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-lg bg-gray-100 inline-block"></span> No Submission</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] sm:text-sm font-semibold text-gray-500 py-2 sm:py-3">{d}</div>
        ))}
        {(() => {
          const year = eodAnalyticsMonth.getFullYear();
          const month = eodAnalyticsMonth.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const todayStr = today;
          const cells = [];
          for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="p-1 sm:p-3"></div>);
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = eodAnalyticsData[dateStr] || {};
            const isToday = dateStr === todayStr;
            cells.push(
              <div key={day} className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl border min-h-[70px] sm:min-h-[110px] ${isToday ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-gray-100 hover:bg-gray-50'} transition-all`}>
                <p className={`text-[10px] sm:text-sm font-bold mb-1 sm:mb-2 ${isToday ? 'text-teal-700' : 'text-gray-700'}`}>{day}</p>
                <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
                  {EOD_MODULES.map(mod => {
                    const statuses = dayData[mod.id] || [];
                    const ModIcon = mod.icon;
                    if (statuses.length === 0) return <div key={mod.id} className="w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg bg-gray-100 flex items-center justify-center" title={`${mod.name}: No submission`}><ModIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-gray-300" /></div>;
                    return <button key={mod.id} onClick={() => loadEodCalendarEntries(dateStr, mod.id, mod.name)} className="w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg bg-emerald-400 flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-md transition-all duration-200" title={`${mod.name}: ${statuses.length} entries — Click to view`}><ModIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" /></button>;
                  })}
                </div>
              </div>
            );
          }
          return cells;
        })()}
      </div>
    </div>
    {/* Calendar Popup */}
    {eodCalendarPopup && (
      <div className={LAYOUT.modalOverlay} onClick={() => setEodCalendarPopup(null)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full mx-2 sm:mx-auto shadow-2xl overflow-hidden" onClick={ev => ev.stopPropagation()}>
          <div className={`p-4 border-b ${MODULE_COLORS[eodCalendarPopup.moduleId]?.bg || 'bg-gray-50'} flex items-center justify-between`}>
            <div>
              <h3 className="font-semibold text-gray-800">{eodCalendarPopup.moduleName}</h3>
              <p className="text-sm text-gray-500">{new Date(eodCalendarPopup.date + 'T12:00:00').toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button onClick={() => setEodCalendarPopup(null)} className="p-2 hover:bg-white/50 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {eodCalendarPopup.entries.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No entries found.</p>
            ) : (
              <div className="space-y-3">
                {eodCalendarPopup.entries.map(entry => (
                  <div key={entry.id} className={`p-3.5 rounded-xl border ${MODULE_COLORS[eodCalendarPopup.moduleId]?.border || 'border-gray-200'} ${MODULE_COLORS[eodCalendarPopup.moduleId]?.bg || 'bg-gray-50'} hover:shadow-sm transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{entry.creator?.name || 'Unknown'}</span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</span>
                      </div>
                      <span className="text-xs text-gray-400">{entry.batch_records?.length || 1} record{(entry.batch_records?.length || 1) > 1 ? 's' : ''}</span>
                    </div>
                    {entry.batch_records && entry.batch_records.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="border-b border-gray-200">
                            <th className="px-2 py-1 text-left text-gray-500 font-semibold">#</th>
                            {(STAFF_FORM_CONFIG[eodCalendarPopup.moduleId]?.fields || []).slice(0, 4).map(f => (
                              <th key={f.key} className="px-2 py-1 text-left text-gray-500 font-semibold whitespace-nowrap">{f.label}</th>
                            ))}
                          </tr></thead>
                          <tbody>{entry.batch_records.map((r, i) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                              {(STAFF_FORM_CONFIG[eodCalendarPopup.moduleId]?.fields || []).slice(0, 4).map(f => (
                                <td key={f.key} className="px-2 py-1 text-gray-700 whitespace-nowrap">{r[f.key] || '-'}</td>
                              ))}
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Single record entry</p>
                    )}
                    <button onClick={() => { setActiveModule(eodCalendarPopup.moduleId); setAdminView('records'); loadModuleData(eodCalendarPopup.moduleId); setViewingEntry(entry); setEodCalendarPopup(null); }} className={`mt-2 w-full py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${MODULE_COLORS[eodCalendarPopup.moduleId]?.accent || 'bg-gray-500'} text-white hover:opacity-90`}>
                      <Eye className="w-3 h-3" /> View Record
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <button onClick={() => setEodCalendarPopup(null)} className={`w-full py-2.5 ${BTN.cancel} rounded-xl`}>Close</button>
          </div>
        </div>
      </div>
    )}
    {/* VA Performance Report */}
    <div className={CARD.base}>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 text-lg mb-1">Report for: {(() => { const [y, mo, d] = vaReportDate.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }); })()}</h3>
        <p className="text-sm text-gray-500">Patient Scheduling — Per VA breakdown</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input type="date" value={vaReportDate} onChange={e => setVaReportDate(e.target.value)} className="p-2 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">VA Name:</label>
          <select value={vaReportFilter} onChange={e => setVaReportFilter(e.target.value)} className="p-2 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none bg-white">
            <option value="all">All</option>
            {users.filter(u => u.role === 'rev_rangers' || u.role === 'rev_rangers_admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <button onClick={() => loadVaReport(vaReportDate, vaReportFilter)} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-medium hover:from-rose-600 hover:to-red-600 shadow-md">Filter</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">VA NAME</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">INBOUND CALLS</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">OUTBOUND CALLS</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">APPOINTMENT CONFIRMATION</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">COMPLETED PATIENT ALLOCATION (DID NOT CALL)</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">APPOINTMENT BOOKED</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">APPOINTMENT RESCHEDULED</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">RCM</th>
              <th className="px-3 py-3 text-center font-semibold border-r border-blue-400 whitespace-nowrap">TOTAL CALLS</th>
              <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">TOTAL PATIENTS HANDLED</th>
            </tr>
          </thead>
          <tbody>
            {vaReportData.length === 0 ? (
              <tr><td colSpan="10" className="px-3 py-8 text-center text-gray-400">No data for this date</td></tr>
            ) : vaReportData.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-200">
                <td className="px-3 py-3 text-center font-medium text-gray-800 bg-white">{row.vaName}</td>
                <td className="px-3 py-3 text-center bg-green-50 text-green-700 font-medium">{row.inbound}</td>
                <td className="px-3 py-3 text-center bg-blue-50 text-blue-700 font-medium">{row.outbound}</td>
                <td className="px-3 py-3 text-center bg-amber-50 text-amber-700 font-medium">{row.apptConfirmation}</td>
                <td className="px-3 py-3 text-center bg-purple-50 text-purple-700 font-medium">{row.didNotCall}</td>
                <td className="px-3 py-3 text-center bg-sky-50 text-sky-700 font-medium">{row.apptBooked}</td>
                <td className="px-3 py-3 text-center bg-gray-50 text-gray-700 font-medium">{row.apptRescheduled}</td>
                <td className="px-3 py-3 text-center bg-violet-50 text-violet-700 font-medium">{row.rcm}</td>
                <td className="px-3 py-3 text-center bg-rose-50 text-rose-700 font-bold">{row.totalCalls}</td>
                <td className="px-3 py-3 text-center bg-pink-50 text-pink-700 font-bold">{row.totalPatients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {/* Module Legend */}
    <div className={CARD.base}>
      <h3 className="font-semibold text-gray-800 mb-3">Module Legend</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {EOD_MODULES.map(mod => {
          const colors = MODULE_COLORS[mod.id] || {};
          return (
            <div key={mod.id} className={`p-3 rounded-xl ${colors.bg} ${colors.border} border text-center`}>
              <mod.icon className={`w-5 h-5 mx-auto ${colors.text}`} />
              <p className={`text-xs font-medium mt-1 ${colors.text}`}>{mod.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
{/* ADMIN: EOD Analytics (blank placeholder) */}
{isAdmin && adminView === 'eod-analytics' && (() => {
  const aggregates = {};
  SCHEDULING_LOCATIONS.forEach(loc => { aggregates[loc] = { answered_by_va: 0, answered_by_fd: 0, missed_calls: 0, short_missed: 0, pre_queue_drop: 0, capacity_missed: 0 }; });
  callAnalyticsRecords.forEach(r => {
    if (!aggregates[r.location]) aggregates[r.location] = { answered_by_va: 0, answered_by_fd: 0, missed_calls: 0, short_missed: 0, pre_queue_drop: 0, capacity_missed: 0 };
    aggregates[r.location].answered_by_va += r.answered_by_va || 0;
    aggregates[r.location].answered_by_fd += r.answered_by_fd || 0;
    aggregates[r.location].missed_calls += r.missed_calls || 0;
    aggregates[r.location].short_missed += r.short_missed || 0;
    aggregates[r.location].pre_queue_drop += r.pre_queue_drop || 0;
    aggregates[r.location].capacity_missed += r.capacity_missed || 0;
  });
  const locationRows = Object.entries(aggregates).filter(([loc, v]) => v.answered_by_va + v.answered_by_fd + v.missed_calls + v.short_missed + v.pre_queue_drop + v.capacity_missed > 0);
  const grandTotals = locationRows.reduce((acc, [_, v]) => {
    acc.answered_by_va += v.answered_by_va; acc.answered_by_fd += v.answered_by_fd;
    acc.missed_calls += v.missed_calls; acc.short_missed += v.short_missed;
    acc.pre_queue_drop += v.pre_queue_drop; acc.capacity_missed += v.capacity_missed;
    return acc;
  }, { answered_by_va: 0, answered_by_fd: 0, missed_calls: 0, short_missed: 0, pre_queue_drop: 0, capacity_missed: 0 });
  const totalAnswered = grandTotals.answered_by_va + grandTotals.answered_by_fd;
  const totalMissed = grandTotals.missed_calls + grandTotals.short_missed + grandTotals.pre_queue_drop + grandTotals.capacity_missed;
  const totalCalls = totalAnswered + totalMissed;
  // Pie chart 1: Answered vs Missed breakdown (Answered, Missed Call, Pre-Queue Drop, Short Missed, Capacity Missed)
  const pie1Data = [
    { label: 'Answered Calls', value: totalAnswered, color: '#10b981' },
    { label: 'Missed Call', value: grandTotals.missed_calls, color: '#ef4444' },
    { label: 'Pre-Queue Drop', value: grandTotals.pre_queue_drop, color: '#a855f7' },
    { label: 'Short Missed', value: grandTotals.short_missed, color: '#eab308' },
    { label: 'Capacity Missed', value: grandTotals.capacity_missed, color: '#06b6d4' },
  ].filter(s => s.value > 0);
  // Pie chart 2: VA vs FD
  const pie2Data = [
    { label: "Answered by VA's", value: grandTotals.answered_by_va, color: '#10b981' },
    { label: 'Answered by FD', value: grandTotals.answered_by_fd, color: '#06b6d4' },
  ].filter(s => s.value > 0);
  const renderPie = (data, size = 180) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="flex items-center justify-center text-gray-400 text-sm" style={{width: size, height: size}}>No data</div>;
    let cumulative = 0;
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
        {data.map((d, i) => {
          const pct = d.value / total;
          const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
          cumulative += pct;
          const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = pct > 0.5 ? 1 : 0;
          if (data.length === 1) return <circle key={i} cx={cx} cy={cy} r={r} fill={d.color} />;
          return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={d.color} stroke="white" strokeWidth="2" />;
        })}
      </svg>
    );
  };
  return (
  <div className="space-y-6">
    {/* Header with Tab switcher */}
    <div className={CARD.base}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Call Analytics</h2>
            <p className="text-sm text-gray-500">{!canManageCallAnalytics || callAnalyticsTab === 'board' ? 'Answered & Missed Calls per Location' : 'Add or manage call data'}</p>
          </div>
        </div>
        {canManageCallAnalytics && (
          <div className="flex gap-2">
            {callAnalyticsTab === 'board' ? (
              <button onClick={() => setCallAnalyticsTab('entry')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-600 shadow-md flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            ) : (
              <button onClick={() => {
                const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
                const hstToday = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
                setCallAnalyticsForm({ date: hstToday, location: '', answered_by_va: '', answered_by_fd: '', missed_calls: '', short_missed: '', pre_queue_drop: '', capacity_missed: '' });
                setEditingCallAnalyticsId(null);
                setCallAnalyticsTab('board');
              }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back to Board
              </button>
            )}
          </div>
        )}
      </div>
      {/* Sub-tab pills */}
      {canManageCallAnalytics && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => setCallAnalyticsTab('board')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${callAnalyticsTab === 'board' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Dashboard
          </button>
          <button onClick={() => setCallAnalyticsTab('entry')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${callAnalyticsTab === 'entry' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Data Entry
          </button>
        </div>
      )}
    </div>

    {/* Input Form (admins only, Data Entry tab) */}
    {canManageCallAnalytics && callAnalyticsTab === 'entry' && (
      <div className={CARD.base}>
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-emerald-600" />
          {editingCallAnalyticsId ? 'Edit Call Data' : 'Add Call Data'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={INPUT.label}>Date *</label>
            <input type="date" value={callAnalyticsForm.date} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, date: e.target.value })} className={INPUT.base} />
          </div>
          <div>
            <label className={INPUT.label}>Location *</label>
            <select value={callAnalyticsForm.location} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, location: e.target.value })} className={INPUT.select}>
              <option value="">Select Location</option>
              {SCHEDULING_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label className={INPUT.label}>Answered by VA's</label>
            <input type="number" min="0" value={callAnalyticsForm.answered_by_va} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, answered_by_va: e.target.value })} className={INPUT.base} placeholder="0" />
          </div>
          <div>
            <label className={INPUT.label}>Answered by FD</label>
            <input type="number" min="0" value={callAnalyticsForm.answered_by_fd} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, answered_by_fd: e.target.value })} className={INPUT.base} placeholder="0" />
          </div>
          <div>
            <label className={INPUT.label}>Missed Calls</label>
            <input type="number" min="0" value={callAnalyticsForm.missed_calls} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, missed_calls: e.target.value })} className={INPUT.base} placeholder="0" />
          </div>
          <div>
            <label className={INPUT.label}>Short Missed</label>
            <input type="number" min="0" value={callAnalyticsForm.short_missed} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, short_missed: e.target.value })} className={INPUT.base} placeholder="0" />
          </div>
          <div>
            <label className={INPUT.label}>Pre-Queue Drop</label>
            <input type="number" min="0" value={callAnalyticsForm.pre_queue_drop} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, pre_queue_drop: e.target.value })} className={INPUT.base} placeholder="0" />
          </div>
          <div>
            <label className={INPUT.label}>Capacity Missed</label>
            <input type="number" min="0" value={callAnalyticsForm.capacity_missed} onChange={e => setCallAnalyticsForm({ ...callAnalyticsForm, capacity_missed: e.target.value })} className={INPUT.base} placeholder="0" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={saveCallAnalytics} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 shadow-md">
            {editingCallAnalyticsId ? 'Update Record' : 'Save Record'}
          </button>
          {editingCallAnalyticsId && (
            <button onClick={() => {
              const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
              const hstToday = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
              setCallAnalyticsForm({ date: hstToday, location: '', answered_by_va: '', answered_by_fd: '', missed_calls: '', short_missed: '', pre_queue_drop: '', capacity_missed: '' });
              setEditingCallAnalyticsId(null);
            }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
          )}
        </div>
      </div>
    )}

    {/* Board view: Filters + Tables + Pies */}
    {(!canManageCallAnalytics || callAnalyticsTab === 'board') && (
    <div className="space-y-6">
    <div className={CARD.base}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-800">Filters</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className={INPUT.label}>Start Date</label>
          <input type="date" value={callAnalyticsFilterStart} onChange={e => setCallAnalyticsFilterStart(e.target.value)} className={INPUT.base} />
        </div>
        <div>
          <label className={INPUT.label}>End Date</label>
          <input type="date" value={callAnalyticsFilterEnd} onChange={e => setCallAnalyticsFilterEnd(e.target.value)} className={INPUT.base} />
        </div>
        <div>
          <label className={INPUT.label}>Location</label>
          <select value={callAnalyticsFilterLocation} onChange={e => setCallAnalyticsFilterLocation(e.target.value)} className={INPUT.select}>
            <option value="all">All Locations</option>
            {SCHEDULING_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button onClick={loadCallAnalytics} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600">Apply</button>
          <button onClick={() => { setCallAnalyticsFilterStart(''); setCallAnalyticsFilterEnd(''); setCallAnalyticsFilterLocation('all'); setTimeout(loadCallAnalytics, 0); }} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Reset</button>
        </div>
      </div>
    </div>

    {/* Answered Calls Table + Pie */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`${CARD.base} lg:col-span-2`}>
        <h3 className="font-semibold text-gray-800 mb-4">Calls per Location (Answered)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Location</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Total Calls</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Answered Calls</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Answered by VA's</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Answered by FD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locationRows.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-gray-400">No data available</td></tr>
              ) : locationRows.map(([loc, v]) => {
                const ans = v.answered_by_va + v.answered_by_fd;
                const miss = v.missed_calls + v.short_missed + v.pre_queue_drop + v.capacity_missed;
                return (
                  <tr key={loc} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-medium text-gray-700">{loc}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{(ans + miss).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{ans.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{v.answered_by_va.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{v.answered_by_fd.toLocaleString()}</td>
                  </tr>
                );
              })}
              {locationRows.length > 0 && (
                <tr className="bg-gray-50 font-bold">
                  <td className="px-3 py-2.5 text-gray-800">Grand total</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{totalCalls.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{totalAnswered.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{grandTotals.answered_by_va.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{grandTotals.answered_by_fd.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className={CARD.base}>
        <h3 className="font-semibold text-gray-800 mb-4 text-center">Distribution</h3>
        <div className="flex flex-col items-center gap-4">
          {renderPie(pie1Data)}
          <div className="w-full space-y-1.5">
            {pie1Data.map(d => (
              <div key={d.label} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{backgroundColor: d.color}}></span>
                  <span className="text-gray-700">{d.label}</span>
                </div>
                <span className="text-gray-500 font-medium">{totalCalls > 0 ? ((d.value / totalCalls) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Missed Calls Table + Pie */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`${CARD.base} lg:col-span-2`}>
        <h3 className="font-semibold text-gray-800 mb-4">Calls per Location (Missed)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Location</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Total Missed</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Missed Call</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Short Missed</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Pre-Queue Drop</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Capacity Missed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locationRows.length === 0 ? (
                <tr><td colSpan="6" className="px-3 py-6 text-center text-gray-400">No data available</td></tr>
              ) : locationRows.map(([loc, v]) => {
                const miss = v.missed_calls + v.short_missed + v.pre_queue_drop + v.capacity_missed;
                return (
                  <tr key={loc} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-medium text-gray-700">{loc}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{miss.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{v.missed_calls.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{v.short_missed.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{v.pre_queue_drop.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{v.capacity_missed.toLocaleString()}</td>
                  </tr>
                );
              })}
              {locationRows.length > 0 && (
                <tr className="bg-gray-50 font-bold">
                  <td className="px-3 py-2.5 text-gray-800">Grand total</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{totalMissed.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{grandTotals.missed_calls.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{grandTotals.short_missed.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{grandTotals.pre_queue_drop.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-gray-800">{grandTotals.capacity_missed.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className={CARD.base}>
        <h3 className="font-semibold text-gray-800 mb-4 text-center">VA vs FD</h3>
        <div className="flex flex-col items-center gap-4">
          {renderPie(pie2Data)}
          <div className="w-full space-y-1.5">
            {pie2Data.map(d => (
              <div key={d.label} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{backgroundColor: d.color}}></span>
                  <span className="text-gray-700">{d.label}</span>
                </div>
                <span className="text-gray-500 font-medium">{totalAnswered > 0 ? ((d.value / totalAnswered) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    </div>
    )}

    {/* Records Management List (Data Entry tab, admins only) */}
    {canManageCallAnalytics && callAnalyticsTab === 'entry' && (
      <div className={CARD.base}>
        <h3 className="font-semibold text-gray-800 mb-4">All Records ({callAnalyticsRecords.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Date</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Location</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">VA's</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">FD</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Missed</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Short</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Pre-Queue</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Capacity</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {callAnalyticsRecords.length === 0 ? (
                <tr><td colSpan="9" className="px-3 py-6 text-center text-gray-400">No records</td></tr>
              ) : callAnalyticsRecords.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 text-gray-700">{r.date}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-700">{r.location}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{r.answered_by_va}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{r.answered_by_fd}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{r.missed_calls}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{r.short_missed}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{r.pre_queue_drop}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{r.capacity_missed}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => editCallAnalytics(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteCallAnalytics(r.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
  );
})()}
{isAdmin && adminView === 'eod-trends' && (
  <div className="space-y-6">
    <div className={CARD.base}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">Trend Analysis</h2>
          <p className="text-sm text-gray-500">Track performance trends over time — Coming Soon</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp className="w-10 h-10 text-emerald-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Trend Analysis</h3>
        <p className="text-gray-400 max-w-md">Historical trends, comparisons, and growth patterns for EOD submissions will be available here.</p>
      </div>
    </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Module</label>
                  <select value={exportModule} onChange={e => setExportModule(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none">
                    {(currentUser?.role === 'rev_rangers_admin' ? [...MODULES.filter(m => m.id === 'billing-inquiry' || m.id === 'hospital-cases'), ...EOD_MODULES] : currentUser?.role === 'rev_rangers' ? [...MODULES.filter(m => m.id === 'billing-inquiry' || m.id === 'hospital-cases'), ...EOD_MODULES] : ALL_MODULES).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
{/* Rev Rangers New Entry */}
{isAdmin && adminView === 'rev-entry' && (currentUser?.role === 'rev_rangers' || isEodModule(activeModule)) && STAFF_FORM_CONFIG[activeModule] && (
  <div className="space-y-4">
    {!isEodModule(activeModule) && adminLocation === 'all' ? (
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
    ) : isEodModule(activeModule) ? (
      <>
        <div className={CARD.colored(currentColors)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{STAFF_FORM_CONFIG[activeModule].title}</h2>
            {editingBatchIndex !== null && <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">Editing Record #{editingBatchIndex + 1}</span>}
          </div>
          {renderFormFields(STAFF_FORM_CONFIG[activeModule].fields, forms[activeModule], updateForm, activeModule, { locations })}
          {STAFF_FORM_CONFIG[activeModule].hasMultiplePatients && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className={INPUT.label}>Multiple Patients on This Call?</label>
              <select value={forms[activeModule]?.additional_patients?.length || 0} onChange={e => { const count = parseInt(e.target.value); const current = forms[activeModule]?.additional_patients || []; const updated = Array.from({ length: count }, (_, i) => current[i] || ''); updateForm(activeModule, 'additional_patients', updated); }} className={INPUT.select + ' mb-3'}>
                <option value="0">No additional patients</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} additional patient{n > 1 ? 's' : ''}</option>)}
              </select>
              {(forms[activeModule]?.additional_patients || []).map((pt, idx) => (
                <div key={idx} className="mt-2">
                  <InputField label={`Pt ${idx + 2} ID`} value={pt} onChange={e => { const updated = [...(forms[activeModule]?.additional_patients || [])]; updated[idx] = e.target.value; updateForm(activeModule, 'additional_patients', updated); }} placeholder="Patient Name / ID" />
                </div>
              ))}
            </div>
          )}
          {STAFF_FORM_CONFIG[activeModule].largeField && (
            <div className="mt-4">
              <InputField label={(STAFF_FORM_CONFIG[activeModule].largeField.required ? STAFF_FORM_CONFIG[activeModule].largeField.label + ' *' : STAFF_FORM_CONFIG[activeModule].largeField.label)} large value={forms[activeModule][STAFF_FORM_CONFIG[activeModule].largeField.key]} onChange={e => updateForm(activeModule, STAFF_FORM_CONFIG[activeModule].largeField.key, e.target.value)} placeholder={STAFF_FORM_CONFIG[activeModule].largeField.placeholder} />
            </div>
          )}
          <div className="flex gap-2 mt-5">
            <button onClick={() => addToEodBatch(activeModule)} className={`flex-1 py-3 ${BTN.primary} rounded-xl font-semibold flex items-center justify-center gap-2`}>
              <Plus className="w-4 h-4" /> {editingBatchIndex !== null ? 'Update Record' : 'Add Record'}
            </button>
            {editingBatchIndex !== null && (
              <button onClick={() => { setEditingBatchIndex(null); const initForms = { 'eod-patient-scheduling': { patient_name_id: '', patient_type: '', insurance_provider: '', referral_source: '', location: '', worked_call_date: today, appt_booked_rs_date: '', call_type: '', call_outcome: '', additional_patients: [], memo: '' }, 'eod-insurance-verification': { patient_id: '', insurance_provider: '', verified_date: today, dos: '', time_started_hst: '', time_ended_hst: '', time_duration: '', status: '' }, 'eod-claim-submission': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', claim_amount: '', time_started_hst: '', time_ended_hst: '', time_duration: '', claim_status: '', comments: '' }, 'eod-payment-posting': { insurance_provider: '', receipt_number: '', time_started_hst: '', payment_date: today, deposit_date: '', amount: '', payment_type: '', reference_number: '', date_posted: '', time_ended_hst: '', time_duration: '', locate_by: '', location: '', remarks: '' }, 'eod-claim-followup': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', insurance_expected: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' }, 'eod-patient-aging': { patient_id: '', insurance_provider: '', location: '', worked_date: today, date_of_service: '', text_to_pay_amount_sent: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' } }; setForms(prev => ({ ...prev, [activeModule]: initForms[activeModule] || prev[activeModule] })); }} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all">
                Cancel
              </button>
            )}
          </div>
        </div>
        {/* Batch Records Table */}
        {(eodBatchRecords[activeModule]?.length > 0) && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${currentColors?.light || 'bg-gray-100'} flex items-center justify-center`}>
                  <FileText className={`w-4 h-4 ${currentColors?.text || 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Pending Records</h3>
                  <p className="text-xs text-gray-400">{eodBatchRecords[activeModule].length} record{eodBatchRecords[activeModule].length > 1 ? 's' : ''} ready to submit</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${currentColors?.bg || 'bg-gray-100'} ${currentColors?.text || 'text-gray-600'}`}>
                {eodBatchRecords[activeModule].length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {eodBatchRecords[activeModule].map((record, idx) => {
                const fields = STAFF_FORM_CONFIG[activeModule].fields;
                return (
                  <div key={idx} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-all duration-200 ${editingBatchIndex === idx ? 'bg-amber-50 border-l-4 border-amber-400' : ''}`}>
                    <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800 text-sm truncate">{getEodBatchLabel(activeModule, record.displayData)}</p>
                        {(() => { const s = record.displayData?.time_started_hst || record.displayData?.time_started_mnl; const e = record.displayData?.time_ended_hst || record.displayData?.time_ended_mnl; return (s || e) ? <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded whitespace-nowrap"><Clock className="w-2.5 h-2.5 inline mr-0.5" />{s || '--'} - {e || '--'}</span> : null; })()}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{fields.slice(1, 4).map(f => record.displayData[f.key] || '-').join(' \u2022 ')}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => editBatchRecord(activeModule, idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeFromEodBatch(activeModule, idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Remove"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Submit All Button */}
        {(eodBatchRecords[activeModule]?.length > 0) && (
          <button
            onClick={() => submitEodBatch(activeModule)}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-lg font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Submit Entry ({eodBatchRecords[activeModule].length} Record{eodBatchRecords[activeModule].length > 1 ? 's' : ''})</>}
          </button>
        )}
      </>
    ) : (
      <>
        <div className={CARD.colored(currentColors)}>
          <h2 className="font-semibold mb-2 text-gray-800">{STAFF_FORM_CONFIG[activeModule].title}</h2>
          {STAFF_FORM_CONFIG[activeModule].subtitle && <p className="text-sm text-gray-500 mb-4">{STAFF_FORM_CONFIG[activeModule].subtitle}</p>}
          {!STAFF_FORM_CONFIG[activeModule].subtitle && <div className="mb-4" />}
          {renderFormFields(STAFF_FORM_CONFIG[activeModule].fields, forms[activeModule], updateForm, activeModule, { locations })}
          {STAFF_FORM_CONFIG[activeModule].largeField && (
            <div className="mt-4">
              <InputField label={STAFF_FORM_CONFIG[activeModule].largeField.label} large value={forms[activeModule][STAFF_FORM_CONFIG[activeModule].largeField.key]} onChange={e => updateForm(activeModule, STAFF_FORM_CONFIG[activeModule].largeField.key, e.target.value)} placeholder={STAFF_FORM_CONFIG[activeModule].largeField.placeholder} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <FileUpload label={STAFF_FORM_CONFIG[activeModule].fileLabel} files={files[activeModule][STAFF_FORM_CONFIG[activeModule].fileKey]} onFilesChange={f => updateFiles(activeModule, STAFF_FORM_CONFIG[activeModule].fileKey, f)} onViewFile={setViewingFile} />
        </div>
        <button
          onClick={() => saveEntry(activeModule)}
          disabled={saving}
          className={`w-full py-4 ${BTN.primary} rounded-xl text-lg font-semibold disabled:opacity-50`}
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
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={recordSearch}
              onChange={e => { setRecordSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all"
            />
            {recordSearch && (
              <button onClick={() => setRecordSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {/* EOD User Filter */}
        {isEodModule(activeModule) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">User:</span>
            <select value={eodFilterUser} onChange={e => { setEodFilterUser(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white">
              <option value="all">All Users</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
        {/* EOD Date Range Filter */}
        {isEodModule(activeModule) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">From:</span>
            <input type="date" value={eodFilterDateFrom} onChange={e => { setEodFilterDateFrom(e.target.value); setCurrentPage(1); }} className="px-2 sm:px-3 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl text-xs sm:text-sm focus:border-blue-400 outline-none bg-white" />
            <span className="text-xs text-gray-500 font-medium">To:</span>
            <input type="date" value={eodFilterDateTo} onChange={e => { setEodFilterDateTo(e.target.value); setCurrentPage(1); }} className="px-2 sm:px-3 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl text-xs sm:text-sm focus:border-blue-400 outline-none bg-white" />
            {(eodFilterDateFrom || eodFilterDateTo) && (
              <button onClick={() => { setEodFilterDateFrom(''); setEodFilterDateTo(''); setCurrentPage(1); }} className="text-xs text-blue-600 hover:underline font-medium">Clear</button>
            )}
          </div>
        )}
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
        {!isITViewOnly && (!isEodModule(activeModule) || currentUser?.role === 'rev_rangers_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'it') && (<div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
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
            const isEditingThis = editingStaffEntry === e.id;
            return (
              <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all ${selectedRecords.includes(e.id) ? 'ring-2 ring-purple-500' : ''}`}>
              {isEditingThis && isEodModule(activeModule) && editingBatchForms.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-semibold ${currentColors?.text} flex items-center gap-2`}><Edit3 className="w-4 h-4" /> Edit Entry ({editingBatchForms.length} Records)</h4>
                    <button onClick={() => { setEditingStaffEntry(null); setEditingBatchForms([]); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="px-1 sm:px-2 py-2 text-left text-[10px] sm:text-xs font-bold text-gray-500 w-6 sm:w-8">#</th>
                            {(STAFF_FORM_CONFIG[activeModule]?.fields || []).map(f => (
                              <th key={f.key} className="px-1 sm:px-2 py-2 text-left text-[10px] sm:text-xs font-bold text-gray-500 whitespace-nowrap">{f.label}</th>
                            ))}
                            {STAFF_FORM_CONFIG[activeModule]?.largeField && <th className="px-1 sm:px-2 py-2 text-left text-[10px] sm:text-xs font-bold text-gray-500 whitespace-nowrap">{STAFF_FORM_CONFIG[activeModule].largeField.label}</th>}
                            <th className="px-1 sm:px-2 py-2 w-6 sm:w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {editingBatchForms.map((record, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-2 py-1.5 text-gray-400 font-medium text-center">{idx + 1}</td>
                              {(STAFF_FORM_CONFIG[activeModule]?.fields || []).map(f => (
                                <td key={f.key} className="px-1 py-1">
                                  {f.options ? (
                                    <select value={record[f.key] || ''} onChange={ev => updateBatchEditForm(idx, f.key, ev.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white min-w-[100px]">
                                      <option value="">Select...</option>
                                      {(f.options === 'locations' ? locations.map(l => l.name) : f.options).map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  ) : (
                                    <input type={f.type || 'text'} value={record[f.key] || ''} onChange={ev => updateBatchEditForm(idx, f.key, ev.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 min-w-[90px]" placeholder={f.placeholder || ''} />
                                  )}
                                </td>
                              ))}
                              {STAFF_FORM_CONFIG[activeModule]?.largeField && (
                                <td className="px-1 py-1">
                                  <input type="text" value={record[STAFF_FORM_CONFIG[activeModule].largeField.key] || ''} onChange={ev => updateBatchEditForm(idx, STAFF_FORM_CONFIG[activeModule].largeField.key, ev.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 min-w-[120px]" />
                                </td>
                              )}
                              <td className="px-1 py-1">
                                {editingBatchForms.length > 1 && <button onClick={() => removeBatchEditRow(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Remove row"><X className="w-3.5 h-3.5" /></button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button onClick={addBatchEditRow} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveStaffEntryUpdate} disabled={saving} className={`flex-1 py-2.5 ${BTN.save} disabled:opacity-50`}>{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Save All (${editingBatchForms.length} Records)`}</button>
                    <button onClick={() => { setEditingStaffEntry(null); setEditingBatchForms([]); }} className={`px-4 py-2.5 ${BTN.cancel}`}>Cancel</button>
                  </div>
                </div>
              ) : isEditingThis && STAFF_EDIT_FIELDS_CONFIG[activeModule] ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-semibold ${currentColors?.text} flex items-center gap-2`}><Edit3 className="w-4 h-4" /> Edit Entry</h4>
                    <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  {renderStaffEditFields(STAFF_EDIT_FIELDS_CONFIG[activeModule].fields, staffEditForm, updateStaffEditForm, { locations })}
                  {STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField && (
                    <div className="mt-2">
                      <InputField label={STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.label} large value={staffEditForm[STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.key]} onChange={ev => updateStaffEditForm(STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.key, ev.target.value)} placeholder={STAFF_EDIT_FIELDS_CONFIG[activeModule].largeField.placeholder} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveStaffEntryUpdate} disabled={saving} className={`flex-1 py-2.5 ${BTN.save} disabled:opacity-50`}>{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}</button>
                    <button onClick={() => { setEditingStaffEntry(null); setStaffEditForm({}); }} className={`px-4 py-2.5 ${BTN.cancel}`}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button onClick={() => toggleRecordSelection(e.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedRecords.includes(e.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'}`}>
                      {selectedRecords.includes(e.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
<div className="flex-1 cursor-pointer" onClick={() => setViewingEntry(e)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">
                        {ADMIN_CARD_CONFIG[activeModule]?.getTitle?.(e) || (activeModule === 'billing-inquiry'
                          ? (e.chart_number ? `Chart #${e.chart_number}` : e.patient_name || 'No Chart #')
                          : (e.patient_name || e.vendor || e.created_at?.split('T')[0]))}
                      </p>
                      {isEodModule(activeModule) ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</span>
                      ) : (
                        <StatusBadge status={e.status} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {isEodModule(activeModule) ? `${e.creator?.name || 'Unknown'} • ${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })} • ${e.batch_records?.length || 1} record${(e.batch_records?.length || 1) > 1 ? 's' : ''}` : `${e.locations?.name} • ${e.creator?.name || 'Unknown'} • ${new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })}`}
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
                  {isEodModule(activeModule) && (currentUser?.role === 'rev_rangers_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'it' || (currentUser?.role === 'rev_rangers' && e.created_by === currentUser?.id)) && <button onClick={() => startEditingStaffEntry(e)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>}
                  {(!isEodModule(activeModule) || currentUser?.role === 'rev_rangers_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'it') && <button onClick={() => deleteRecord(activeModule, e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
              )}
            </div>
          );
          })}
        </div>
      )}
      {/* Pagination Controls */}
      {!loading && getModuleEntries().length > 0 && recordsPerPage !== 'all' && getTotalPages() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {getTotalPages()}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <div className="hidden sm:flex items-center gap-1">
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
            <span className="sm:hidden text-xs font-medium text-gray-600 px-2">{currentPage}/{getTotalPages()}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
              disabled={currentPage === getTotalPages()}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(getTotalPages())}
              disabled={currentPage === getTotalPages()}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              {STAFF_FORM_CONFIG[activeModule] && isEodModule(activeModule) ? (
                <>
                  <div className={CARD.colored(currentColors)}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-800">{STAFF_FORM_CONFIG[activeModule].title}</h2>
                      {editingBatchIndex !== null && <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">Editing Record #{editingBatchIndex + 1}</span>}
                    </div>
                    {renderFormFields(STAFF_FORM_CONFIG[activeModule].fields, forms[activeModule], updateForm, activeModule, { locations })}
                    {STAFF_FORM_CONFIG[activeModule].hasMultiplePatients && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className={INPUT.label}>Multiple Patients on This Call?</label>
                        <select value={forms[activeModule]?.additional_patients?.length || 0} onChange={e => { const count = parseInt(e.target.value); const current = forms[activeModule]?.additional_patients || []; const updated = Array.from({ length: count }, (_, i) => current[i] || ''); updateForm(activeModule, 'additional_patients', updated); }} className={INPUT.select + ' mb-3'}>
                          <option value="0">No additional patients</option>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} additional patient{n > 1 ? 's' : ''}</option>)}
                        </select>
                        {(forms[activeModule]?.additional_patients || []).map((pt, idx) => (
                          <div key={idx} className="mt-2">
                            <InputField label={`Pt ${idx + 2} ID`} value={pt} onChange={e => { const updated = [...(forms[activeModule]?.additional_patients || [])]; updated[idx] = e.target.value; updateForm(activeModule, 'additional_patients', updated); }} placeholder="Patient Name / ID" />
                          </div>
                        ))}
                      </div>
                    )}
                    {STAFF_FORM_CONFIG[activeModule].largeField && (
                      <div className="mt-4">
                        <InputField label={(STAFF_FORM_CONFIG[activeModule].largeField.required ? STAFF_FORM_CONFIG[activeModule].largeField.label + ' *' : STAFF_FORM_CONFIG[activeModule].largeField.label)} large value={forms[activeModule][STAFF_FORM_CONFIG[activeModule].largeField.key]} onChange={e => updateForm(activeModule, STAFF_FORM_CONFIG[activeModule].largeField.key, e.target.value)} placeholder={STAFF_FORM_CONFIG[activeModule].largeField.placeholder} />
                      </div>
                    )}
                    <div className="flex gap-2 mt-5">
                      <button onClick={() => addToEodBatch(activeModule)} className={`flex-1 py-3 ${BTN.primary} rounded-xl font-semibold flex items-center justify-center gap-2`}>
                        <Plus className="w-4 h-4" /> {editingBatchIndex !== null ? 'Update Record' : 'Add Record'}
                      </button>
                      {editingBatchIndex !== null && (
                        <button onClick={() => { setEditingBatchIndex(null); const initForms = { 'eod-patient-scheduling': { patient_name_id: '', patient_type: '', insurance_provider: '', referral_source: '', location: '', worked_call_date: today, appt_booked_rs_date: '', call_type: '', call_outcome: '', additional_patients: [], memo: '' }, 'eod-insurance-verification': { patient_id: '', insurance_provider: '', verified_date: today, dos: '', time_started_hst: '', time_ended_hst: '', time_duration: '', status: '' }, 'eod-claim-submission': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', claim_amount: '', time_started_hst: '', time_ended_hst: '', time_duration: '', claim_status: '', comments: '' }, 'eod-payment-posting': { insurance_provider: '', receipt_number: '', time_started_hst: '', payment_date: today, deposit_date: '', amount: '', payment_type: '', reference_number: '', date_posted: '', time_ended_hst: '', time_duration: '', locate_by: '', location: '', remarks: '' }, 'eod-claim-followup': { claim_id: '', insurance_provider: '', worked_date: today, date_of_service: '', insurance_expected: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' }, 'eod-patient-aging': { patient_id: '', insurance_provider: '', location: '', worked_date: today, date_of_service: '', text_to_pay_amount_sent: '', time_started_mnl: '', time_ended_mnl: '', time_duration: '', claim_status: '', amount_collected: '' } }; setForms(prev => ({ ...prev, [activeModule]: initForms[activeModule] || prev[activeModule] })); }} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Batch Records Table */}
                  {(eodBatchRecords[activeModule]?.length > 0) && (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                      <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${currentColors?.light || 'bg-gray-100'} flex items-center justify-center`}>
                            <FileText className={`w-4 h-4 ${currentColors?.text || 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">Pending Records</h3>
                            <p className="text-xs text-gray-400">{eodBatchRecords[activeModule].length} record{eodBatchRecords[activeModule].length > 1 ? 's' : ''} ready to submit</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${currentColors?.bg || 'bg-gray-100'} ${currentColors?.text || 'text-gray-600'}`}>
                          {eodBatchRecords[activeModule].length}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {eodBatchRecords[activeModule].map((record, idx) => {
                          const fields = STAFF_FORM_CONFIG[activeModule].fields;
                          return (
                            <div key={idx} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-all duration-200 ${editingBatchIndex === idx ? 'bg-amber-50 border-l-4 border-amber-400' : ''}`}>
                              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-gray-800 text-sm truncate">{getEodBatchLabel(activeModule, record.displayData)}</p>
                                  {(() => { const s = record.displayData?.time_started_hst || record.displayData?.time_started_mnl; const e = record.displayData?.time_ended_hst || record.displayData?.time_ended_mnl; return (s || e) ? <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded whitespace-nowrap"><Clock className="w-2.5 h-2.5 inline mr-0.5" />{s || '--'} - {e || '--'}</span> : null; })()}
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{fields.slice(1, 4).map(f => record.displayData[f.key] || '-').join(' \u2022 ')}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => editBatchRecord(activeModule, idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => removeFromEodBatch(activeModule, idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Remove"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Submit All Button */}
                  {(eodBatchRecords[activeModule]?.length > 0) && (
                    <button
                      onClick={() => submitEodBatch(activeModule)}
                      disabled={saving}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-lg font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Submit Entry ({eodBatchRecords[activeModule].length} Record{eodBatchRecords[activeModule].length > 1 ? 's' : ''})</>}
                    </button>
                  )}
                </>
              ) : STAFF_FORM_CONFIG[activeModule] ? (
                <>
                  <div className={CARD.colored(currentColors)}>
                    <h2 className="font-semibold mb-2 text-gray-800">{STAFF_FORM_CONFIG[activeModule].title}</h2>
                    {STAFF_FORM_CONFIG[activeModule].subtitle && <p className="text-sm text-gray-500 mb-4">{STAFF_FORM_CONFIG[activeModule].subtitle}</p>}
                    {!STAFF_FORM_CONFIG[activeModule].subtitle && <div className="mb-4" />}
                    {renderFormFields(STAFF_FORM_CONFIG[activeModule].fields, forms[activeModule], updateForm, activeModule, { locations })}
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
              ) : null}
              {STAFF_FORM_CONFIG[activeModule] && !isEodModule(activeModule) && (
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
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
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
          <EmptyState icon={FileText} message={staffRecordSearch ? 'No records match your search' : 'No entries yet'} />
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

                    {STAFF_EDIT_FIELDS_CONFIG[activeModule] && (
                      <>
                        {renderStaffEditFields(STAFF_EDIT_FIELDS_CONFIG[activeModule].fields, staffEditForm, updateStaffEditForm, { locations })}
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
                           (activeModule === 'bills-payment' && e.transaction_id) ? <span className="text-violet-600 font-bold">Invoice: {e.transaction_id}</span> :
                           (activeModule === 'billing-inquiry' && e.chart_number) ? <span className="text-blue-600 font-bold">Chart# {e.chart_number}</span> :
                           (activeModule === 'refund-requests' && e.chart_number) ? <span className="text-rose-600 font-bold">Chart# {e.chart_number}</span> :
                           e.patient_name || e.vendor || new Date(e.created_at).toLocaleDateString()}
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
                        <StatusBadge status={e.status} />
                        {!canEdit && <Lock className="w-4 h-4 text-gray-400" title="Locked (past Friday cutoff)" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{new Date(e.created_at).toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' })}</p>
                      {(e.amount || e.amount_requested || e.amount_in_question) && (
                        <p className="text-lg font-bold text-emerald-600 mt-2">${Number(e.amount || e.amount_requested || e.amount_in_question).toFixed(2)}</p>
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
                      {canEdit && e.created_by === currentUser?.id && (
                        <button onClick={() => startEditingStaffEntry(e)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      )}
                      {(!isEodModule(activeModule) || currentUser?.role === 'rev_rangers_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'it') && (
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Page {staffCurrentPage} of {getStaffTotalPages()}</p>
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <button onClick={() => setStaffCurrentPage(1)} disabled={staffCurrentPage === 1} className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
            <button onClick={() => setStaffCurrentPage(p => Math.max(p - 1, 1))} disabled={staffCurrentPage === 1} className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
            <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">{staffCurrentPage}</span>
            <button onClick={() => setStaffCurrentPage(p => Math.min(p + 1, getStaffTotalPages()))} disabled={staffCurrentPage === getStaffTotalPages()} className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            <button onClick={() => setStaffCurrentPage(getStaffTotalPages())} disabled={staffCurrentPage === getStaffTotalPages()} className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
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
      <div className="fixed bottom-2 sm:bottom-6 left-4 lg:left-[310px] z-[25] pointer-events-none">
        <p className="text-[10px] sm:text-xs text-gray-400 opacity-70">CCH v0.94</p>
      </div>
    </div>
  );
}
