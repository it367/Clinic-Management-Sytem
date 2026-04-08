// Care Command Hub - Styles Configuration
// All visual/UI styles extracted for easy customization
// Change colors, spacing, and appearance here without touching logic code

// ============================================================
// MODULE COLORS — Per-module color scheme
// ============================================================
export const MODULE_COLORS = {
  'daily-recon': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', light: 'bg-emerald-100' },
  'billing-inquiry': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100' },
  'bills-payment': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500', light: 'bg-violet-100' },
  'order-requests': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500', light: 'bg-amber-100' },
  'refund-requests': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500', light: 'bg-rose-100' },
  'it-requests': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-500', light: 'bg-cyan-100' },
  'completed-procedure': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', accent: 'bg-teal-500', light: 'bg-teal-100' },
  'claims-documents': { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', accent: 'bg-sky-500', light: 'bg-sky-100' },
  'hospital-cases': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-500', light: 'bg-indigo-100' },
  'eod-patient-scheduling': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', accent: 'bg-teal-500', light: 'bg-teal-100' },
  'eod-insurance-verification': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-500', light: 'bg-cyan-100' },
  'eod-claim-submission': { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', accent: 'bg-sky-500', light: 'bg-sky-100' },
  'eod-payment-posting': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100' },
  'eod-claim-followup': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500', light: 'bg-violet-100' },
  'eod-patient-aging': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500', light: 'bg-purple-100' },
};

// ============================================================
// STATUS COLORS — Badge colors for each status
// ============================================================
export const STATUS_COLORS = {
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
  'Rejected': 'bg-red-100 text-red-700 border-red-200',
  'Needs Revisions': 'bg-orange-100 text-orange-700 border-orange-200',
  'Reviewed': 'bg-blue-100 text-blue-700 border-blue-200',
  'Updates Needed': 'bg-orange-100 text-orange-700 border-orange-200',
  _default: 'bg-gray-100 text-gray-600 border-gray-200',
};

// ============================================================
// ROLE STYLES — Sidebar header gradients & avatar colors per role
// ============================================================
export const ROLE_STYLES = {
  it: { gradient: 'bg-gradient-to-r from-cyan-600 to-teal-600', avatar: 'bg-gradient-to-br from-cyan-500 to-teal-500', textAccent: 'text-cyan-600' },
  rev_rangers: { gradient: 'bg-gradient-to-r from-amber-600 to-orange-600', avatar: 'bg-gradient-to-br from-amber-500 to-orange-500', textAccent: 'text-amber-600' },
  office_manager: { gradient: 'bg-gradient-to-r from-emerald-600 to-green-600', avatar: 'bg-gradient-to-br from-emerald-500 to-green-500', textAccent: 'text-emerald-600' },
  super_admin: { gradient: 'bg-gradient-to-r from-rose-600 to-pink-600', avatar: 'bg-gradient-to-br from-rose-500 to-pink-500', textAccent: 'text-purple-600' },
  finance_admin: { gradient: 'bg-gradient-to-r from-purple-600 to-indigo-600', avatar: 'bg-gradient-to-br from-purple-500 to-indigo-500', textAccent: 'text-purple-600' },
  staff: { gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600', avatar: 'bg-gradient-to-br from-blue-500 to-indigo-500', textAccent: 'text-blue-600' },
  rev_rangers_admin: { gradient: 'bg-gradient-to-r from-violet-600 to-purple-600', avatar: 'bg-gradient-to-br from-violet-500 to-purple-500', textAccent: 'text-violet-600' },
};

// ============================================================
// BTN — Button variant classes
// ============================================================
export const BTN = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all',
  save: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg transition-all',
  cancel: 'bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition-all',
  admin: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all',
  amber: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all',
  // Tab buttons
  tabActive: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg',
  tabInactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  tabAdminActive: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg',
  tabAmberActive: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg',
  // Nav sidebar buttons
  navActive: (colors) => `${colors.bg} ${colors.text} ${colors.border} border-2`,
  navInactive: 'text-gray-600 hover:bg-gray-50',
  navAdminActive: 'bg-purple-50 text-purple-700 border-2 border-purple-200',
  // Pagination
  pageActive: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg',
  pageInactive: 'text-gray-600 bg-gray-100 hover:bg-gray-200',
  pageDisabled: 'px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all',
};

// ============================================================
// CARD — Card wrapper classes
// ============================================================
export const CARD = {
  base: 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100',
  colored: (colors) => `bg-white rounded-2xl shadow-lg p-6 border-l-4 ${colors?.accent}`,
  analytics: 'bg-white rounded-2xl shadow-lg p-4 border border-gray-100',
  section: 'bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden',
};

// ============================================================
// INPUT — Input, select, textarea base classes
// ============================================================
export const INPUT = {
  base: 'w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white',
  select: 'w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed',
  textarea: 'w-full p-3 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed',
  wrapper: 'flex items-center border-2 border-gray-200 rounded-xl bg-white transition-all hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100',
  label: 'text-xs font-medium text-gray-600 mb-1.5',
  search: 'w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all',
  filter: 'px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white',
  filterPurple: 'px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 outline-none bg-white',
};

// ============================================================
// LAYOUT — Sidebar, header, modal, overlay, toast classes
// ============================================================
export const LAYOUT = {
  // Page backgrounds
  pageBg: 'min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex',
  loginBg: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden',
  loginCard: 'bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative z-10',
  // Sidebar
  sidebar: 'fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl shadow-xl border-r border-gray-100 flex flex-col transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0',
  sidebarOpen: 'translate-x-0',
  sidebarClosed: '-translate-x-full',
  // Header
  header: 'bg-white shadow-sm border-b sticky top-0 z-30',
  // Modal / overlay
  modalOverlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4',
  modalCard: 'bg-white rounded-2xl max-w-2xl max-h-[90vh] w-full overflow-auto shadow-2xl',
  confirmOverlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4',
  confirmCard: 'bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden',
  passwordOverlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4',
  // Toast
  toastSuccess: 'bg-white border-l-emerald-500 text-emerald-700 shadow-emerald-100',
  toastError: 'bg-white border-l-red-500 text-red-700 shadow-red-100',
  // Sidebar overlay (mobile)
  sidebarOverlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden',
};

// ============================================================
// ANALYTICS_CARDS — KPI gradient card styles
// ============================================================
export const ANALYTICS_CARDS = {
  emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg',
  blue: 'bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg',
  amber: 'bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg',
  purple: 'bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg',
  violet: 'bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg',
  rose: 'bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg',
  red: 'bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg',
  gray: 'bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-4 text-white shadow-lg',
  indigo: 'bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg',
  teal: 'bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-4 text-white shadow-lg',
  cyan: 'bg-gradient-to-br from-cyan-500 to-sky-600 rounded-2xl p-4 text-white shadow-lg',
  sky: 'bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg',
  orange: 'bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg',
  // Subtitle text colors per card type
  subtitleColors: {
    emerald: 'text-emerald-100',
    blue: 'text-blue-100',
    amber: 'text-amber-100',
    purple: 'text-purple-100',
    violet: 'text-violet-100',
    rose: 'text-rose-100',
    red: 'text-red-100',
    indigo: 'text-indigo-100',
    teal: 'text-teal-100',
    cyan: 'text-cyan-100',
    sky: 'text-sky-100',
    orange: 'text-orange-100',
  },
  detailColors: {
    emerald: 'text-emerald-200',
    blue: 'text-blue-200',
    amber: 'text-amber-200',
    purple: 'text-purple-200',
    violet: 'text-violet-200',
    rose: 'text-rose-200',
    red: 'text-red-200',
    indigo: 'text-indigo-200',
    teal: 'text-teal-200',
    cyan: 'text-cyan-200',
    sky: 'text-sky-200',
    orange: 'text-orange-200',
  },
};

// ============================================================
// ICON_BOX — Icon container sizes and styles
// ============================================================
export const ICON_BOX = {
  sm: 'w-8 h-8 rounded-lg flex items-center justify-center',
  md: 'w-10 h-10 rounded-xl flex items-center justify-center',
  lg: 'w-12 h-12 rounded-xl flex items-center justify-center',
  xlRound: 'w-14 h-14 rounded-full flex items-center justify-center',
  lgRound: 'w-16 h-16 rounded-full flex items-center justify-center',
  xlgRound: 'w-20 h-20 rounded-2xl flex items-center justify-center',
  avatar: 'w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold',
  sidebarAvatar: 'w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center',
  chatAvatar: 'w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center',
  chatBtn: 'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl',
};

// ============================================================
// URGENCY — Urgency level badge colors
// ============================================================
export const URGENCY_COLORS = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-gray-100 text-gray-600',
  _default: 'bg-gray-100 text-gray-600',
};

// ============================================================
// CONFIRM_DIALOG — Confirmation dialog color variants
// ============================================================
export const CONFIRM_COLORS = {
  red: { bg: 'bg-red-100', icon: 'text-red-600', btn: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' },
  green: { bg: 'bg-emerald-100', icon: 'text-emerald-600', btn: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' },
  blue: { bg: 'bg-amber-100', icon: 'text-amber-600', btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' },
};

// ============================================================
// FILE_UPLOAD — File upload area styles
// ============================================================
export const FILE_UPLOAD = {
  dropzone: 'border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all',
  fileItem: 'flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm',
  fileIcon: 'w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0',
  uploadIcon: 'w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center',
};

// ============================================================
// CHECKBOX — Selection checkbox styles
// ============================================================
export const CHECKBOX = {
  selected: 'bg-purple-600 border-purple-600',
  unselected: 'border-gray-300 hover:border-purple-400',
  base: 'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
};
