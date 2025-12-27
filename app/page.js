'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, FileText, Building2, Bot, Send, Loader2, LogOut, User, Upload, X, File, Shield, Receipt, CreditCard, Package, RefreshCw, Monitor, Menu, Eye, EyeOff, FolderOpen, Edit3, Users, Plus, Trash2, Lock, Download, Settings, MessageCircle, Sparkles, AlertCircle, Maximize2, Minimize2, Headphones } from 'lucide-react';

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

const IT_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const DATE_RANGES = ['This Week', 'Last 2 Weeks', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Custom'];

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

function StatusBadge({ status }) {
  const colors = {
    'Open': 'bg-red-100 text-red-700 border-red-200',
    'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
    'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Closed': 'bg-gray-100 text-gray-600 border-gray-200',
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'Approved': 'bg-blue-100 text-blue-700 border-blue-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Denied': 'bg-red-100 text-red-700 border-red-200'
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status || 'N/A'}</span>;
}

function FloatingChat({ messages, input, setInput, onSend, loading, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAdmin = userRole === 'super_admin' || userRole === 'finance_admin';

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
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
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
  const [editingEntry, setEditingEntry] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff', locations: [] });

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });

  const [exportModule, setExportModule] = useState('daily-recon');
  const [exportLocation, setExportLocation] = useState('all');
  const [exportRange, setExportRange] = useState('This Month');

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
    'daily-recon': { recon_date: today, cash: '', credit_card: '', checks_otc: '', insurance_checks: '', care_credit: '', vcc: '', efts: '', deposit_cash: '', deposit_credit_card: '', deposit_checks: '', deposit_insurance: '', deposit_care_credit: '', deposit_vcc: '', notes: '' },
    'billing-inquiry': { patient_name: '', chart_number: '', date_of_service: '', amount_in_question: '', best_contact_method: '', best_contact_time: '', reviewed_by: '', initials: '', status: 'Pending', result: '' },
    'bills-payment': { status: 'Pending', bill_date: today, vendor: '', description: '', amount: '', due_date: '', manager_initials: '', ap_reviewed: false, date_reviewed: '', paid_date: '' },
    'order-requests': { date_entered: today, vendor: '', invoice_number: '', invoice_date: '', due_date: '', amount: '', status: 'Pending', notes: '' },
    'refund-requests': { patient_name: '', chart_number: '', parent_name: '', rp_address: '', date_of_request: today, type: '', description: '', amount_requested: '', best_contact_method: '', eassist_audited: '', status: 'Pending' },
    'it-requests': { date_reported: today, urgency: '', requester_name: '', device_system: '', description_of_issue: '', best_contact_method: '', best_contact_time: '' }
  });

  const [files, setFiles] = useState({
    'daily-recon': { eodDaySheets: [], eodBankReceipts: [], otherFiles: [] },
    'billing-inquiry': { documentation: [] },
    'bills-payment': { documentation: [] },
    'order-requests': { orderInvoices: [] },
    'refund-requests': { documentation: [] },
    'it-requests': { documentation: [] }
  });

  useEffect(() => { loadLocations(); }, []);

  useEffect(() => {
    if (currentUser && (selectedLocation || isAdmin)) {
      loadModuleData(activeModule);
    }
  }, [currentUser, selectedLocation, activeModule, adminLocation]);

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const loadLocations = async () => {
    const { data, error } = await supabase.from('locations').select('*').eq('is_active', true).order('name');
    if (data) setLocations(data);
  };

  const loadUsers = async () => {
    console.log('Loading users...');
    
    // Get all users without any joins
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
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

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      showMessage('error', 'Please enter email and password');
      return;
    }

    setLoginLoading(true);
    
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', loginEmail.toLowerCase())
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

      setCurrentUser(user);
      setUserLocations(locationsList);

      if (locationsList.length === 1) {
        setSelectedLocation(locationsList[0].name);
      }

      if (user.role === 'super_admin' || user.role === 'finance_admin') {
        loadUsers();
      }

    } catch (err) {
      console.error('Login exception:', err);
      showMessage('error', 'An error occurred. Please try again.');
    }

    setLoginLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserLocations([]);
    setSelectedLocation(null);
    setLoginEmail('');
    setLoginPassword('');
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
    if (!newUser.name || !newUser.email || !newUser.password) {
      showMessage('error', 'Please fill all required fields');
      return;
    }

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert({
        name: newUser.name,
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
    setNewUser({ name: '', email: '', password: '', role: 'staff', locations: [] });
    setShowAddUser(false);
    loadUsers();
  };

  const updateUser = async () => {
    if (!editingUser.name || !editingUser.email) {
      showMessage('error', 'Please fill all required fields');
      return;
    }

    const updateData = {
      name: editingUser.name,
      email: editingUser.email.toLowerCase(),
      role: editingUser.role,
      updated_by: currentUser.id
    };

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
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    await supabase.from('users').update({ is_active: false, updated_by: currentUser.id }).eq('id', id);
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
        notes: form.notes
      };
    } else if (moduleId === 'billing-inquiry') {
      entryData = {
        ...entryData,
        patient_name: form.patient_name,
        chart_number: form.chart_number,
        date_of_service: form.date_of_service || null,
        amount_in_question: parseFloat(form.amount_in_question) || null,
        best_contact_method: form.best_contact_method || null,
        best_contact_time: form.best_contact_time,
        reviewed_by: form.reviewed_by,
        initials: form.initials,
        status: form.status || 'Pending',
        result: form.result
      };
    } else if (moduleId === 'bills-payment') {
      entryData = {
        ...entryData,
        bill_date: form.bill_date,
        vendor: form.vendor,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        due_date: form.due_date || null,
        status: form.status || 'Pending',
        manager_initials: form.manager_initials,
        ap_reviewed: form.ap_reviewed === 'Yes',
        date_reviewed: form.date_reviewed || null,
        paid_date: form.paid_date || null
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
        status: form.status || 'Pending',
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
        status: 'Open'
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

  const updateEntryStatus = async (moduleId, entryId, newStatus, additionalFields = {}) => {
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

    let dataSummary = '\n📊 SYSTEM OVERVIEW:\n';
    
    for (const mod of ALL_MODULES) {
      const data = moduleData[mod.id] || [];
      if (data.length > 0) {
        dataSummary += `\n${mod.name}: ${data.length} records`;
      }
    }

    dataSummary += `\n\n📍 Locations: ${locations.map(l => l.name).join(', ')}`;
    dataSummary += `\n👤 Current user: ${currentUser?.name} (${currentUser?.role})`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMessage }], dataSummary })
      });

      const data = await response.json();
      const aiResponse = data.content?.[0]?.text || 'Sorry, I could not process that request.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Unable to connect to AI.' }]);
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

  const getModuleEntries = () => moduleData[activeModule] || [];
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
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Clinic System</h1>
            <p className="text-gray-500 text-sm mt-1">Healthcare Management Portal</p>
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
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
            >
              {loginLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Login →'}
            </button>
            <p className="text-xs text-center text-gray-400">Default admin: admin / admin123</p>
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
      <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
      <FloatingChat messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={askAI} loading={aiLoading} userRole={currentUser?.role} />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-5 ${isSuperAdmin ? 'bg-gradient-to-r from-rose-600 to-pink-600' : isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {isSuperAdmin ? <Shield className="w-6 h-6 text-white" /> : isAdmin ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
            </div>
            <div className="text-white">
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm text-white/80">
                {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Finance Admin' : selectedLocation}
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 border-b bg-purple-50">
            <label className="text-xs font-medium text-purple-700 mb-1.5 block">Filter by Location</label>
            <select value={adminLocation} onChange={e => setAdminLocation(e.target.value)} className="w-full p-2.5 border-2 border-purple-200 rounded-xl text-sm focus:border-purple-400 outline-none bg-white">
              <option value="all">📍 All Locations</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        )}

        {!isAdmin && userLocations.length > 1 && (
          <div className="p-4 border-b bg-blue-50">
            <label className="text-xs font-medium text-blue-700 mb-1.5 block">Switch Location</label>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full p-2.5 border-2 border-blue-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white">
              {userLocations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
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
              <button onClick={() => { setAdminView('users'); loadUsers(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'users' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'users' ? 'bg-purple-100' : 'bg-gray-100'}`}><Users className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Users</span>
              </button>
              <button onClick={() => { setAdminView('documents'); loadDocuments(); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'documents' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'documents' ? 'bg-purple-100' : 'bg-gray-100'}`}><FolderOpen className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Documents</span>
              </button>
              <button onClick={() => { setAdminView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'export' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'export' ? 'bg-purple-100' : 'bg-gray-100'}`}><Download className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Export</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
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
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="font-bold text-gray-800 text-lg">
                  {isAdmin ? (adminView === 'users' ? 'User Management' : adminView === 'export' ? 'Export Data' : adminView === 'documents' ? 'All Documents' : adminView === 'settings' ? 'Settings' : currentModule?.name) : (view === 'settings' ? 'Settings' : currentModule?.name)}
                </h1>
                <p className="text-sm text-gray-500">{isAdmin ? (adminLocation === 'all' ? 'All Locations' : adminLocation) : selectedLocation}</p>
              </div>
            </div>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
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

        {message.text && (
          <div className={`mx-4 mt-4 p-4 rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2 ${message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700'}`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : null}
            {message.text}
          </div>
        )}

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full pb-24">
          {/* ADMIN: User Management */}
          {isAdmin && adminView === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">{users.length} Users</h2>
                <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                  <Plus className="w-4 h-4" />Add User
                </button>
              </div>

              {(showAddUser || editingUser) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="font-semibold mb-4 text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Name *" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                    <InputField label="Email *" value={editingUser ? editingUser.email : newUser.email} onChange={e => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} />
                    <PasswordField label={editingUser ? "New Password" : "Password *"} value={editingUser ? (editingUser.newPassword || '') : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, newPassword: e.target.value}) : setNewUser({...newUser, password: e.target.value})} placeholder={editingUser ? "Leave blank to keep current" : ""} />
                    <InputField label="Role" value={editingUser ? editingUser.role : newUser.role} onChange={e => editingUser ? setEditingUser({...editingUser, role: e.target.value}) : setNewUser({...newUser, role: e.target.value})} options={isSuperAdmin ? ['staff', 'finance_admin', 'super_admin'] : ['staff', 'finance_admin']} />
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
                  {users.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold ${u.role === 'super_admin' ? 'bg-gradient-to-br from-rose-500 to-pink-500' : u.role === 'finance_admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.name}</p>
                          <p className="text-sm text-gray-500">{u.email} • <span className="capitalize">{u.role?.replace('_', ' ')}</span></p>
                          {u.role === 'staff' && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {u.locations?.map(loc => (
                                <span key={loc.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{loc.name}</span>
                              ))}
                            </div>
                          )}
                          {(u.role === 'finance_admin' || u.role === 'super_admin') && (
                            <span className="text-xs text-purple-600 font-medium">All locations access</span>
                          )}
                        </div>
                      </div>
                      {u.id !== currentUser.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingUser({ ...u, locationIds: u.locations?.map(l => l.id) || [] })}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN: Documents */}
          {isAdmin && adminView === 'documents' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">All Uploaded Documents</h2>
                  <p className="text-sm text-gray-500">{documents.length} files</p>
                </div>
              </div>
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          )}

          {/* Records View - Admin */}
          {isAdmin && adminView === 'records' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">All Records</h2>
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${currentColors?.light} ${currentColors?.text}`}>{entries.length} entries</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No entries yet</p>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 50).map(e => {
                    const docKey = `${activeModule}-${e.id}`;
                    const docs = entryDocuments[docKey] || [];
                    
                    if (!entryDocuments[docKey]) {
                      loadEntryDocuments(activeModule, e.id);
                    }
                    
                    return (
                      <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800">
                                {e.ticket_number ? `IT-${e.ticket_number}` : e.patient_name || e.vendor || e.recon_date || e.created_at?.split('T')[0]}
                              </p>
                              <StatusBadge status={e.status} />
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {e.locations?.name} • {e.creator?.name || 'Unknown'} • {new Date(e.created_at).toLocaleDateString()}
                            </p>
                            {e.description_of_issue && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{e.description_of_issue}</p>}
                            {e.total_collected && <p className="text-lg font-bold text-emerald-600 mt-2">${Number(e.total_collected).toFixed(2)}</p>}
                            
                            {/* Documents for this entry */}
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

                          {activeModule === 'it-requests' && (
                            <div>
                              {editingStatus === e.id ? (
                                <div className="space-y-2 w-44">
                                  <select defaultValue={e.status} id={`status-${e.id}`} className="w-full p-2 border-2 rounded-lg text-sm">
                                    {IT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <input type="text" id={`notes-${e.id}`} placeholder="Resolution notes" className="w-full p-2 border-2 rounded-lg text-sm" />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => updateEntryStatus('it-requests', e.id, document.getElementById(`status-${e.id}`).value, { resolution_notes: document.getElementById(`notes-${e.id}`).value })}
                                      className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium"
                                    >
                                      Save
                                    </button>
                                    <button onClick={() => setEditingStatus(null)} className="px-3 py-2 bg-gray-200 rounded-lg text-xs">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => setEditingStatus(e.id)} className="text-xs text-purple-600 flex items-center gap-1 font-medium hover:underline">
                                  <Edit3 className="w-3 h-3" />Update
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-500" />Bank Deposit
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Cash" prefix="$" value={forms['daily-recon'].deposit_cash} onChange={e => updateForm('daily-recon', 'deposit_cash', e.target.value)} />
                      <InputField label="Credit Card" prefix="$" value={forms['daily-recon'].deposit_credit_card} onChange={e => updateForm('daily-recon', 'deposit_credit_card', e.target.value)} />
                      <InputField label="Checks" prefix="$" value={forms['daily-recon'].deposit_checks} onChange={e => updateForm('daily-recon', 'deposit_checks', e.target.value)} />
                      <InputField label="Insurance" prefix="$" value={forms['daily-recon'].deposit_insurance} onChange={e => updateForm('daily-recon', 'deposit_insurance', e.target.value)} />
                      <InputField label="Care Credit" prefix="$" value={forms['daily-recon'].deposit_care_credit} onChange={e => updateForm('daily-recon', 'deposit_care_credit', e.target.value)} />
                      <InputField label="VCC" prefix="$" value={forms['daily-recon'].deposit_vcc} onChange={e => updateForm('daily-recon', 'deposit_vcc', e.target.value)} />
                    </div>
                    <div className="mt-4">
                      <InputField label="Notes" value={forms['daily-recon'].notes} onChange={e => updateForm('daily-recon', 'notes', e.target.value)} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <File className="w-5 h-5 text-amber-500" />Documents
                    </h2>
                    <div className="space-y-4">
                      <FileUpload label="EOD Day Sheets" files={files['daily-recon'].eodDaySheets} onFilesChange={f => updateFiles('daily-recon', 'eodDaySheets', f)} onViewFile={setViewingFile} />
                      <FileUpload label="EOD Bank Receipts" files={files['daily-recon'].eodBankReceipts} onFilesChange={f => updateFiles('daily-recon', 'eodBankReceipts', f)} onViewFile={setViewingFile} />
                      <FileUpload label="Other Files" files={files['daily-recon'].otherFiles} onFilesChange={f => updateFiles('daily-recon', 'otherFiles', f)} onViewFile={setViewingFile} />
                    </div>
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
                    <h2 className="font-semibold mb-4 text-gray-800">Billing Inquiry</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Patient Name" value={forms['billing-inquiry'].patient_name} onChange={e => updateForm('billing-inquiry', 'patient_name', e.target.value)} />
                      <InputField label="Chart Number" value={forms['billing-inquiry'].chart_number} onChange={e => updateForm('billing-inquiry', 'chart_number', e.target.value)} />
                      <InputField label="Date of Service" type="date" value={forms['billing-inquiry'].date_of_service} onChange={e => updateForm('billing-inquiry', 'date_of_service', e.target.value)} />
                      <InputField label="Amount in Question" prefix="$" value={forms['billing-inquiry'].amount_in_question} onChange={e => updateForm('billing-inquiry', 'amount_in_question', e.target.value)} />
                      <InputField label="Contact Method" value={forms['billing-inquiry'].best_contact_method} onChange={e => updateForm('billing-inquiry', 'best_contact_method', e.target.value)} options={['Phone', 'Email', 'Text']} />
                      <InputField label="Contact Time" value={forms['billing-inquiry'].best_contact_time} onChange={e => updateForm('billing-inquiry', 'best_contact_time', e.target.value)} />
                      <InputField label="Status" value={forms['billing-inquiry'].status} onChange={e => updateForm('billing-inquiry', 'status', e.target.value)} options={['Pending', 'In Progress', 'Resolved']} />
                      <InputField label="Result" value={forms['billing-inquiry'].result} onChange={e => updateForm('billing-inquiry', 'result', e.target.value)} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <File className="w-5 h-5 text-blue-500" />Documents
                    </h2>
                    <FileUpload label="Supporting Documentation" files={files['billing-inquiry'].documentation} onFilesChange={f => updateFiles('billing-inquiry', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'bills-payment' && (
                <>
                  <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                    <h2 className="font-semibold mb-4 text-gray-800">Bills Payment</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Bill Date" type="date" value={forms['bills-payment'].bill_date} onChange={e => updateForm('bills-payment', 'bill_date', e.target.value)} />
                      <InputField label="Vendor" value={forms['bills-payment'].vendor} onChange={e => updateForm('bills-payment', 'vendor', e.target.value)} />
                      <InputField label="Description" value={forms['bills-payment'].description} onChange={e => updateForm('bills-payment', 'description', e.target.value)} />
                      <InputField label="Amount" prefix="$" value={forms['bills-payment'].amount} onChange={e => updateForm('bills-payment', 'amount', e.target.value)} />
                      <InputField label="Due Date" type="date" value={forms['bills-payment'].due_date} onChange={e => updateForm('bills-payment', 'due_date', e.target.value)} />
                      <InputField label="Status" value={forms['bills-payment'].status} onChange={e => updateForm('bills-payment', 'status', e.target.value)} options={['Pending', 'Approved', 'Paid']} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <File className="w-5 h-5 text-violet-500" />Documents
                    </h2>
                    <FileUpload label="Bill / Invoice Documents" files={files['bills-payment'].documentation} onFilesChange={f => updateFiles('bills-payment', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'order-requests' && (
                <>
                  <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                    <h2 className="font-semibold mb-4 text-gray-800">Order Request</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Date Entered" type="date" value={forms['order-requests'].date_entered} onChange={e => updateForm('order-requests', 'date_entered', e.target.value)} />
                      <InputField label="Vendor" value={forms['order-requests'].vendor} onChange={e => updateForm('order-requests', 'vendor', e.target.value)} />
                      <InputField label="Invoice Number" value={forms['order-requests'].invoice_number} onChange={e => updateForm('order-requests', 'invoice_number', e.target.value)} />
                      <InputField label="Invoice Date" type="date" value={forms['order-requests'].invoice_date} onChange={e => updateForm('order-requests', 'invoice_date', e.target.value)} />
                      <InputField label="Due Date" type="date" value={forms['order-requests'].due_date} onChange={e => updateForm('order-requests', 'due_date', e.target.value)} />
                      <InputField label="Amount" prefix="$" value={forms['order-requests'].amount} onChange={e => updateForm('order-requests', 'amount', e.target.value)} />
                      <InputField label="Status" value={forms['order-requests'].status} onChange={e => updateForm('order-requests', 'status', e.target.value)} options={['Pending', 'Approved', 'Paid']} />
                      <InputField label="Notes" value={forms['order-requests'].notes} onChange={e => updateForm('order-requests', 'notes', e.target.value)} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <File className="w-5 h-5 text-amber-500" />Documents
                    </h2>
                    <FileUpload label="Order Invoices / POs" files={files['order-requests'].orderInvoices} onFilesChange={f => updateFiles('order-requests', 'orderInvoices', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'refund-requests' && (
                <>
                  <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                    <h2 className="font-semibold mb-4 text-gray-800">Refund Request</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Patient Name" value={forms['refund-requests'].patient_name} onChange={e => updateForm('refund-requests', 'patient_name', e.target.value)} />
                      <InputField label="Chart Number" value={forms['refund-requests'].chart_number} onChange={e => updateForm('refund-requests', 'chart_number', e.target.value)} />
                      <InputField label="Date of Request" type="date" value={forms['refund-requests'].date_of_request} onChange={e => updateForm('refund-requests', 'date_of_request', e.target.value)} />
                      <InputField label="Type" value={forms['refund-requests'].type} onChange={e => updateForm('refund-requests', 'type', e.target.value)} options={['Refund', 'Credit', 'Adjustment']} />
                      <InputField label="Amount Requested" prefix="$" value={forms['refund-requests'].amount_requested} onChange={e => updateForm('refund-requests', 'amount_requested', e.target.value)} />
                      <InputField label="Status" value={forms['refund-requests'].status} onChange={e => updateForm('refund-requests', 'status', e.target.value)} options={['Pending', 'Approved', 'Completed', 'Denied']} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <File className="w-5 h-5 text-rose-500" />Documents
                    </h2>
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
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="font-semibold mb-4 text-gray-800">Your Entries <span className="text-sm font-normal text-gray-500">({entries.length})</span></h2>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No entries yet</p>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 30).map(e => {
                    const canEdit = canEditRecord(e.created_at);
                    const docKey = `${activeModule}-${e.id}`;
                    const docs = entryDocuments[docKey] || [];
                    
                    // Load documents for this entry if not loaded
                    if (!entryDocuments[docKey]) {
                      loadEntryDocuments(activeModule, e.id);
                    }
                    
                    return (
                      <div key={e.id} className={`p-4 rounded-xl ${currentColors?.bg} border ${currentColors?.border}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800">
                                {e.ticket_number ? `IT-${e.ticket_number}` : e.patient_name || e.vendor || e.recon_date || new Date(e.created_at).toLocaleDateString()}
                              </p>
                              <StatusBadge status={e.status} />
                              {!canEdit && <Lock className="w-4 h-4 text-gray-400" title="Locked (past Friday cutoff)" />}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{new Date(e.created_at).toLocaleDateString()}</p>
                            
                            {/* Documents for this entry */}
                            {docs.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-medium text-gray-500">Attached Files:</p>
                                {docs.map(doc => (
                                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                                    <File className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-600 truncate">{doc.file_name}</span>
                                    <button
                                      onClick={() => viewDocument(doc)}
                                      className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                                      title="Preview"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {e.total_collected && <p className="font-bold text-emerald-600">${Number(e.total_collected).toFixed(2)}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
