'use client';
import { useState, useEffect, useRef } from 'react';
import { DollarSign, FileText, Building2, Bot, Send, Loader2, LogOut, User, Upload, X, File, Shield, Receipt, CreditCard, Package, RefreshCw, Monitor, Menu, Eye, FolderOpen, Edit3, Users, Plus, Trash2, Lock, Download, Settings, MessageCircle, Sparkles } from 'lucide-react';

const LOCATIONS = ['Pearl City', 'OS', 'Ortho', 'Lihue', 'Kapolei', 'Kailua', 'Honolulu', 'HHDS'];
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const MODULES = [
  { id: 'daily-recon', name: 'Daily Recon', icon: DollarSign, color: 'emerald' },
  { id: 'billing-inquiry', name: 'Billing Inquiry', icon: Receipt, color: 'blue' },
  { id: 'bills-payment', name: 'Bills Payment', icon: CreditCard, color: 'violet' },
  { id: 'order-requests', name: 'Order Requests', icon: Package, color: 'amber' },
  { id: 'refund-requests', name: 'Refund Requests', icon: RefreshCw, color: 'rose' },
  { id: 'it-requests', name: 'IT Requests', icon: Monitor, color: 'cyan' },
];

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

function InputField({ label, value, onChange, type = 'text', placeholder = '', prefix, options, large, accentColor = 'blue' }) {
  const focusColor = `focus-within:border-${accentColor}-400 focus-within:ring-2 focus-within:ring-${accentColor}-100`;
  if (options) {
    return (
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
        <select value={value} onChange={onChange} className={`w-full p-2.5 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white`}>
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
        <textarea value={value} onChange={onChange} rows={4} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none bg-white" placeholder={placeholder} />
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white transition-all hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        {prefix && <span className="pl-3 text-gray-400 font-medium">{prefix}</span>}
        <input type={type} value={value} onChange={onChange} className="w-full p-2.5 rounded-xl outline-none bg-transparent" placeholder={placeholder} />
      </div>
    </div>
  );
}

function FileUpload({ label, files, onFilesChange, onViewFile }) {
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f) }));
    onFilesChange([...files, ...newFiles]);
  };
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all">
        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-500 hover:text-blue-600">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Click to upload files</span>
          <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
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
                  <button onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
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
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status || 'N/A'}</span>;
}

function FloatingChat({ messages, input, setInput, onSend, loading, isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
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

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className={`p-4 text-white ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-white/80">Powered by Claude</p>
              </div>
            </div>
          </div>

          {/* Messages */}
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

          {/* Input */}
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMode, setLoginMode] = useState('staff');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const [activeModule, setActiveModule] = useState('daily-recon');
  const [view, setView] = useState('entry');
  const [adminView, setAdminView] = useState('records');
  const [allData, setAllData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [viewingFile, setViewingFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminLocation, setAdminLocation] = useState('all');
  const [editingStatus, setEditingStatus] = useState(null);
  const [itCounter, setItCounter] = useState(1000);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', locations: [] });
  
  const [adminPwd, setAdminPwd] = useState(DEFAULT_ADMIN_PASSWORD);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  
  const [exportSystem, setExportSystem] = useState('daily-recon');
  const [exportLocation, setExportLocation] = useState('all');
  const [exportRange, setExportRange] = useState('This Month');
  
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', content: "👋 Hi! I'm your AI assistant. I can help with:\n\n• Data summaries & reports\n• Weekly comparisons\n• Location analytics\n• IT request status\n\nWhat would you like to know?" }]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [forms, setForms] = useState({
    'daily-recon': { date: today, cash: '', creditCard: '', checksOTC: '', insuranceChecks: '', careCredit: '', vcc: '', efts: '', depositCash: '', depositCreditCard: '', depositChecks: '', depositInsurance: '', depositCareCredit: '', depositVCC: '', notes: '' },
    'billing-inquiry': { patientName: '', chartNumber: '', dateOfService: '', amountInQuestion: '', bestContactMethod: '', bestContactTime: '', reviewedBy: '', initials: '', status: '', result: '' },
    'bills-payment': { billStatus: '', date: today, vendor: '', description: '', amount: '', dueDate: '', managerInitials: '', apReviewed: '', dateReviewed: '', paid: '' },
    'order-requests': { dateEntered: today, vendor: '', invoiceNumber: '', invoiceDate: '', dueDate: '', amount: '', enteredBy: '', notes: '' },
    'refund-requests': { patientName: '', chartNumber: '', parentName: '', rpAddress: '', dateOfRequest: today, typeTransaction: '', description: '', amountRequested: '', bestContactMethod: '', eassistAudited: '', status: '' },
    'it-requests': { dateReported: today, urgencyLevel: '', requesterName: '', deviceSystem: '', descriptionOfIssue: '', bestContactMethod: '', bestContactTime: '' }
  });
  const [files, setFiles] = useState({
    'daily-recon': { eodDaySheets: [], eodBankReceipts: [], otherFiles: [] },
    'billing-inquiry': { documentation: [] },
    'bills-payment': { documentation: [] },
    'order-requests': { orderInvoices: [] },
    'refund-requests': { documentation: [] },
    'it-requests': { documentation: [] }
  });

  useEffect(() => { 
    loadAllData(); 
    loadUsers();
    const counter = localStorage.getItem('it-counter');
    if (counter) setItCounter(parseInt(counter));
    const storedPwd = localStorage.getItem('admin-password');
    if (storedPwd) setAdminPwd(storedPwd);
  }, []);

  const loadAllData = () => {
    const data = {};
    MODULES.forEach(m => {
      const stored = localStorage.getItem(`clinic-${m.id}`);
      if (stored) data[m.id] = JSON.parse(stored);
    });
    setAllData(data);
  };

  const loadUsers = () => {
    const stored = localStorage.getItem('clinic-users');
    if (stored) setUsers(JSON.parse(stored));
    else {
      const defaultUsers = [{ id: '1', name: 'Demo User', email: 'demo', password: '1234', locations: ['Kailua', 'Honolulu'] }];
      setUsers(defaultUsers);
      localStorage.setItem('clinic-users', JSON.stringify(defaultUsers));
    }
  };

  const saveUsers = (newUsers) => { setUsers(newUsers); localStorage.setItem('clinic-users', JSON.stringify(newUsers)); };

  const handleStaffLogin = () => {
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword);
    if (user) { setCurrentUser(user); if (user.locations.length === 1) setSelectedLocation(user.locations[0]); setMessage(''); }
    else { setMessage('Invalid email or password'); setTimeout(() => setMessage(''), 3000); }
  };

  const handleAdminLogin = () => {
    if (adminPassword === adminPwd) { setIsAdmin(true); setCurrentUser({ name: 'Admin', isAdmin: true }); }
    else { setMessage('Invalid admin password'); setTimeout(() => setMessage(''), 3000); }
  };

  const handleLogout = () => {
    setCurrentUser(null); setIsAdmin(false); setSelectedLocation(null); setLoginEmail(''); setLoginPassword(''); setAdminPassword(''); setView('entry'); setAdminView('records'); setPwdForm({ current: '', new: '', confirm: '' });
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password || newUser.locations.length === 0) { setMessage('Please fill all fields and select at least one location'); setTimeout(() => setMessage(''), 3000); return; }
    saveUsers([...users, { ...newUser, id: Date.now().toString() }]);
    setNewUser({ name: '', email: '', password: '', locations: [] }); setShowAddUser(false);
    setMessage('✓ User added!'); setTimeout(() => setMessage(''), 3000);
  };

  const updateUser = () => {
    if (!editingUser.name || !editingUser.email || editingUser.locations.length === 0) { setMessage('Please fill all fields'); setTimeout(() => setMessage(''), 3000); return; }
    saveUsers(users.map(u => u.id === editingUser.id ? editingUser : u)); setEditingUser(null);
    setMessage('✓ User updated!'); setTimeout(() => setMessage(''), 3000);
  };

  const deleteUser = (id) => { if (confirm('Delete this user?')) { saveUsers(users.filter(u => u.id !== id)); setMessage('✓ User deleted'); setTimeout(() => setMessage(''), 3000); } };

  const changeAdminPassword = () => {
    if (pwdForm.current !== adminPwd) { setMessage('Current password is incorrect'); setTimeout(() => setMessage(''), 3000); return; }
    if (pwdForm.new.length < 4) { setMessage('New password must be at least 4 characters'); setTimeout(() => setMessage(''), 3000); return; }
    if (pwdForm.new !== pwdForm.confirm) { setMessage('New passwords do not match'); setTimeout(() => setMessage(''), 3000); return; }
    localStorage.setItem('admin-password', pwdForm.new); setAdminPwd(pwdForm.new); setPwdForm({ current: '', new: '', confirm: '' });
    setMessage('✓ Password changed successfully!'); setTimeout(() => setMessage(''), 3000);
  };

  const changeUserPassword = () => {
    if (pwdForm.current !== currentUser.password) { setMessage('Current password is incorrect'); setTimeout(() => setMessage(''), 3000); return; }
    if (pwdForm.new.length < 4) { setMessage('New password must be at least 4 characters'); setTimeout(() => setMessage(''), 3000); return; }
    if (pwdForm.new !== pwdForm.confirm) { setMessage('New passwords do not match'); setTimeout(() => setMessage(''), 3000); return; }
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, password: pwdForm.new } : u);
    saveUsers(updatedUsers); setCurrentUser({ ...currentUser, password: pwdForm.new }); setPwdForm({ current: '', new: '', confirm: '' });
    setMessage('✓ Password changed successfully!'); setTimeout(() => setMessage(''), 3000);
  };

  const toggleUserLocation = (loc, isEditing = false) => {
    if (isEditing) { const locs = editingUser.locations.includes(loc) ? editingUser.locations.filter(l => l !== loc) : [...editingUser.locations, loc]; setEditingUser({ ...editingUser, locations: locs }); }
    else { const locs = newUser.locations.includes(loc) ? newUser.locations.filter(l => l !== loc) : [...newUser.locations, loc]; setNewUser({ ...newUser, locations: locs }); }
  };

  const updateForm = (module, field, value) => setForms(prev => ({ ...prev, [module]: { ...prev[module], [field]: value } }));
  const updateFiles = (module, field, newFiles) => setFiles(prev => ({ ...prev, [module]: { ...prev[module], [field]: newFiles } }));

  const saveEntry = async (module) => {
    setSaving(true);
    const form = forms[module];
    const entry = { ...form, files: Object.fromEntries(Object.entries(files[module]).map(([k, v]) => [k, v.map(f => ({ name: f.name, type: f.type, url: f.url }))])), location: selectedLocation, enteredBy: currentUser.name, timestamp: new Date().toISOString(), id: `${Date.now()}` };
    if (module === 'daily-recon') { entry.total = ['cash', 'creditCard', 'checksOTC', 'insuranceChecks', 'careCredit', 'vcc', 'efts'].reduce((s, f) => s + (parseFloat(form[f]) || 0), 0); entry.depositTotal = ['depositCash', 'depositCreditCard', 'depositChecks', 'depositInsurance', 'depositCareCredit', 'depositVCC'].reduce((s, f) => s + (parseFloat(form[f]) || 0), 0); }
    if (module === 'it-requests') { entry.requestNumber = `IT-${itCounter}`; entry.status = 'Open'; setItCounter(itCounter + 1); localStorage.setItem('it-counter', (itCounter + 1).toString()); }
    const updated = [entry, ...(allData[module] || [])].slice(0, 500);
    localStorage.setItem(`clinic-${module}`, JSON.stringify(updated)); setAllData(prev => ({ ...prev, [module]: updated }));
    setMessage('✓ Entry saved!'); setTimeout(() => setMessage(''), 3000);
    const resetForm = { ...forms[module] }; Object.keys(resetForm).forEach(k => { if (!k.includes('date') && !k.includes('Date')) resetForm[k] = ''; });
    setForms(prev => ({ ...prev, [module]: resetForm })); setFiles(prev => ({ ...prev, [module]: Object.fromEntries(Object.entries(files[module]).map(([k]) => [k, []])) })); setSaving(false);
  };

  const updateITStatus = (entryId, newStatus, resolutionNotes = '') => {
    const updated = (allData['it-requests'] || []).map(e => e.id === entryId ? { ...e, status: newStatus, resolutionNotes, completedBy: 'Admin', statusUpdatedAt: new Date().toISOString() } : e);
    localStorage.setItem('clinic-it-requests', JSON.stringify(updated)); setAllData(prev => ({ ...prev, 'it-requests': updated })); setEditingStatus(null);
    setMessage('✓ Status updated!'); setTimeout(() => setMessage(''), 3000);
  };

  const exportToCSV = () => {
    let filtered = allData[exportSystem] || [];
    if (exportLocation !== 'all') filtered = filtered.filter(e => e.location === exportLocation);
    if (filtered.length === 0) { setMessage('No data to export'); setTimeout(() => setMessage(''), 3000); return; }
    const headers = Object.keys(filtered[0]).filter(k => k !== 'files');
    const csv = [headers.join(','), ...filtered.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${exportSystem}_${exportLocation}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    setMessage('✓ Export complete!'); setTimeout(() => setMessage(''), 3000);
  };

  const askAI = async () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]); setChatInput(''); setAiLoading(true);
    let dataSummary = ''; MODULES.forEach(m => { dataSummary += `\n${m.name}: ${(allData[m.id] || []).length} entries`; });
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: chatInput }], dataSummary }) });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || 'Sorry, an error occurred.' }]);
    } catch (e) { setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI. Please try again.' }]); }
    setAiLoading(false);
  };

  const getModuleEntries = (moduleId) => {
    const entries = allData[moduleId] || [];
    if (isAdmin && adminLocation !== 'all') return entries.filter(e => e.location === adminLocation);
    if (!isAdmin && selectedLocation) return entries.filter(e => e.location === selectedLocation);
    return entries;
  };

  const getFileCount = (entry) => entry.files ? Object.values(entry.files).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0;

  const getAllDocuments = () => {
    const docs = [];
    MODULES.forEach(m => { (allData[m.id] || []).forEach(entry => { if (entry.files) { Object.entries(entry.files).forEach(([cat, fileList]) => { (fileList || []).forEach(file => { docs.push({ ...file, module: m.name, location: entry.location, entryDate: entry.timestamp?.split('T')[0], enteredBy: entry.enteredBy, category: cat }); }); }); } }); });
    return docs;
  };

  const currentColors = MODULE_COLORS[activeModule];

  // ========== LOGIN ==========
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm relative z-10 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Clinic System</h1>
            <p className="text-gray-500 text-sm mt-1">Healthcare Management Portal</p>
          </div>

          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setLoginMode('staff')} className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${loginMode === 'staff' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Staff</button>
            <button onClick={() => setLoginMode('admin')} className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${loginMode === 'admin' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}><Shield className="w-4 h-4" />Admin</button>
          </div>

          {message && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{message}</div>}

          {loginMode === 'staff' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email / Username</label>
                <input type="text" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="Enter email" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStaffLogin()} className="w-full p-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="Enter password" />
              </div>
              <button onClick={handleStaffLogin} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all">Login →</button>
              <p className="text-xs text-center text-gray-400">Demo: demo / 1234</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Admin Password</label>
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} className="w-full p-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all" placeholder="Enter admin password" />
              </div>
              <button onClick={handleAdminLogin} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all">Login →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== LOCATION SELECTOR ==========
  if (!isAdmin && !selectedLocation && currentUser.locations.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Welcome, {currentUser.name}!</h1>
            <p className="text-gray-500">Select your location to continue</p>
          </div>
          <div className="space-y-2">
            {currentUser.locations.map(loc => (
              <button key={loc} onClick={() => setSelectedLocation(loc)} className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 flex items-center gap-3 transition-all group">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-medium text-gray-700">{loc}</span>
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="w-full mt-6 py-2.5 text-gray-500 hover:text-gray-700 transition-colors">← Back to Login</button>
        </div>
      </div>
    );
  }

  const currentModule = MODULES.find(m => m.id === activeModule);
  const entries = getModuleEntries(activeModule);
  const allDocs = getAllDocuments();

  // ========== MAIN APP ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex">
      <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
      <FloatingChat messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={askAI} loading={aiLoading} isAdmin={isAdmin} />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-5 ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {isAdmin ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
            </div>
            <div className="text-white">
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm text-white/80">{isAdmin ? 'Administrator' : selectedLocation}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 border-b bg-purple-50">
            <label className="text-xs font-medium text-purple-700 mb-1.5 block">Filter by Location</label>
            <select value={adminLocation} onChange={e => setAdminLocation(e.target.value)} className="w-full p-2.5 border-2 border-purple-200 rounded-xl text-sm focus:border-purple-400 outline-none bg-white">
              <option value="all">📍 All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        {!isAdmin && currentUser.locations.length > 1 && (
          <div className="p-4 border-b bg-blue-50">
            <label className="text-xs font-medium text-blue-700 mb-1.5 block">Switch Location</label>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full p-2.5 border-2 border-blue-200 rounded-xl text-sm focus:border-blue-400 outline-none bg-white">
              {currentUser.locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        <nav className="p-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Modules</p>
          {MODULES.map(m => {
            const colors = MODULE_COLORS[m.id];
            const isActive = activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'settings';
            return (
              <button key={m.id} onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? `${colors.bg} ${colors.text} ${colors.border} border-2` : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? colors.light : 'bg-gray-100'}`}>
                  <m.icon className={`w-4 h-4 ${isActive ? colors.text : 'text-gray-500'}`} />
                </div>
                <span className="text-sm font-medium">{m.name}</span>
              </button>
            );
          })}
          
          <div className="border-t my-4"></div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Management</p>
          
          {isAdmin ? (
            <>
              <button onClick={() => { setAdminView('users'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'users' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'users' ? 'bg-purple-100' : 'bg-gray-100'}`}><Users className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Users</span>
              </button>
              <button onClick={() => { setAdminView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${adminView === 'export' ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adminView === 'export' ? 'bg-purple-100' : 'bg-gray-100'}`}><Download className="w-4 h-4" /></div>
                <span className="text-sm font-medium">Export</span>
              </button>
            </>
          ) : (
            <button onClick={() => { setView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${view === 'export' ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${view === 'export' ? 'bg-blue-100' : 'bg-gray-100'}`}><Download className="w-4 h-4" /></div>
              <span className="text-sm font-medium">Export</span>
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <button onClick={() => { isAdmin ? setAdminView('settings') : setView('settings'); setSidebarOpen(false); }} className={`w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-xl transition-all ${(isAdmin ? adminView : view) === 'settings' ? (isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700') : 'text-gray-500 hover:bg-gray-200'}`}>
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className={`bg-white shadow-sm border-b sticky top-0 z-30`}>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="font-bold text-gray-800 text-lg">{isAdmin ? (adminView === 'users' ? 'User Management' : adminView === 'export' ? 'Export Data' : adminView === 'settings' ? 'Settings' : currentModule?.name) : (view === 'settings' ? 'Settings' : currentModule?.name)}</h1>
                <p className="text-sm text-gray-500">{isAdmin ? (adminLocation === 'all' ? 'All Locations' : adminLocation) : selectedLocation}</p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${currentColors?.light} ${currentColors?.text}`}>
              {(allData[activeModule] || []).length} records
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {isAdmin && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' ? (
              [{ id: 'records', label: 'Records', icon: FileText }, { id: 'documents', label: 'Documents', icon: FolderOpen }].map(tab => (
                <button key={tab.id} onClick={() => setAdminView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${adminView === tab.id ? `${currentColors?.accent} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                </button>
              ))
            ) : !isAdmin && view !== 'settings' && view !== 'export' ? (
              [{ id: 'entry', label: '+ New Entry' }, { id: 'history', label: 'History' }].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === tab.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
              ))
            ) : null}
          </div>
        </header>

        {message && <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 rounded-xl text-center font-medium shadow-sm">{message}</div>}

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full pb-24">
          {/* ADMIN: Users */}
          {isAdmin && adminView === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">{users.length} Users</h2>
                <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"><Plus className="w-4 h-4" />Add User</button>
              </div>
              {(showAddUser || editingUser) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="font-semibold mb-4 text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Name" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                    <InputField label="Email / Username" value={editingUser ? editingUser.email : newUser.email} onChange={e => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} />
                    <div className="col-span-2"><InputField label={editingUser ? "New Password (leave blank to keep)" : "Password"} type="password" value={editingUser ? (editingUser.newPassword || '') : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, newPassword: e.target.value, password: e.target.value || editingUser.password}) : setNewUser({...newUser, password: e.target.value})} /></div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-600 mb-2 block">Assigned Locations</label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATIONS.map(loc => (<button key={loc} onClick={() => toggleUserLocation(loc, !!editingUser)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${(editingUser ? editingUser.locations : newUser.locations).includes(loc) ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{loc}</button>))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={editingUser ? updateUser : addUser} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">{editingUser ? 'Update' : 'Add'} User</button>
                    <button onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="px-6 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="divide-y">
                  {users.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold">{u.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-gray-800">{u.name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">{u.locations.map(loc => <span key={loc} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{loc}</span>)}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingUser(u)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN: Documents */}
          {isAdmin && adminView === 'documents' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-gray-800"><FolderOpen className="w-5 h-5 text-amber-500" />Document Storage <span className="text-sm font-normal text-gray-500">({allDocs.length} files)</span></h2>
              {allDocs.length === 0 ? <p className="text-gray-500 text-center py-8">No documents uploaded yet</p> : (
                <div className="space-y-2">{allDocs.slice(0, 50).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><File className="w-5 h-5 text-blue-600" /></div>
                      <div className="min-w-0"><p className="font-medium truncate text-gray-800">{doc.name}</p><p className="text-xs text-gray-500">{doc.module} • {doc.location} • {doc.entryDate}</p></div>
                    </div>
                    <button onClick={() => setViewingFile(doc)} className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"><Eye className="w-4 h-4" />View</button>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {/* ADMIN: Export */}
          {isAdmin && adminView === 'export' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"><Download className="w-6 h-6 text-white" /></div>
                <div><h2 className="font-semibold text-gray-800">Export Data</h2><p className="text-sm text-gray-500">Download records as CSV file</p></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">System</label><select value={exportSystem} onChange={e => setExportSystem(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none">{MODULES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Location</label><select value={exportLocation} onChange={e => setExportLocation(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none"><option value="all">All Locations</option>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Date Range</label><select value={exportRange} onChange={e => setExportRange(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 outline-none">{DATE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <button onClick={exportToCSV} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"><Download className="w-5 h-5" />Export to CSV</button>
            </div>
          )}

          {/* ADMIN: Settings */}
          {isAdmin && adminView === 'settings' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"><Lock className="w-6 h-6 text-white" /></div>
                <div><h2 className="font-semibold text-gray-800">Change Admin Password</h2><p className="text-sm text-gray-500">Update your admin credentials</p></div>
              </div>
              <div className="space-y-4 max-w-sm">
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Current Password</label><input type="password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-purple-400" placeholder="Enter current password" /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">New Password</label><input type="password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-purple-400" placeholder="Enter new password" /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirm New Password</label><input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-purple-400" placeholder="Confirm new password" /></div>
                <button onClick={changeAdminPassword} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">Update Password</button>
              </div>
            </div>
          )}

          {/* ADMIN: Records */}
          {isAdmin && adminView === 'records' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">All Records</h2>
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${currentColors?.light} ${currentColors?.text}`}>{entries.length} entries</span>
              </div>
              {entries.length === 0 ? <p className="text-gray-500 text-center py-8">No entries yet</p> : (
                <div className="space-y-3">{entries.slice(0, 50).map(e => (
                  <div key={e.id} className={`p-4 rounded-xl border-2 ${currentColors?.border} ${currentColors?.bg} hover:shadow-md transition-all`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-gray-800">{e.requestNumber || e.timestamp?.split('T')[0]}</p><StatusBadge status={e.status || e.billStatus} /></div>
                        <p className="text-sm text-gray-600 mt-1">{e.location} • {e.enteredBy}</p>
                        {e.descriptionOfIssue && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{e.descriptionOfIssue}</p>}
                        {e.total && <p className="text-lg font-bold text-emerald-600 mt-2">${e.total.toFixed(2)}</p>}
                        {getFileCount(e) > 0 && (<div className="mt-3 flex flex-wrap gap-1">{Object.entries(e.files || {}).map(([cat, fileList]) => (fileList || []).map((file, i) => (<button key={`${cat}-${i}`} onClick={() => setViewingFile(file)} className="flex items-center gap-1 px-2 py-1 bg-white/80 text-gray-700 rounded-lg text-xs font-medium hover:bg-white transition-colors"><Eye className="w-3 h-3" />{file.name?.slice(0, 15)}...</button>)))}</div>)}
                      </div>
                      {activeModule === 'it-requests' && (
                        <div>{editingStatus === e.id ? (
                          <div className="space-y-2 w-44">
                            <select defaultValue={e.status} id={`status-${e.id}`} className="w-full p-2 border-2 rounded-lg text-sm">{IT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            <input type="text" id={`notes-${e.id}`} placeholder="Resolution notes" className="w-full p-2 border-2 rounded-lg text-sm" />
                            <div className="flex gap-1">
                              <button onClick={() => updateITStatus(e.id, document.getElementById(`status-${e.id}`).value, document.getElementById(`notes-${e.id}`).value)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium">Save</button>
                              <button onClick={() => setEditingStatus(null)} className="px-3 py-2 bg-gray-200 rounded-lg text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (<button onClick={() => setEditingStatus(e.id)} className="text-xs text-purple-600 flex items-center gap-1 font-medium hover:underline"><Edit3 className="w-3 h-3" />Update</button>)}</div>
                      )}
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {/* STAFF: Settings */}
          {!isAdmin && view === 'settings' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center"><Lock className="w-6 h-6 text-white" /></div>
                <div><h2 className="font-semibold text-gray-800">Change Password</h2><p className="text-sm text-gray-500">Update your account password</p></div>
              </div>
              <div className="space-y-4 max-w-sm">
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Current Password</label><input type="password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400" placeholder="Enter current password" /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">New Password</label><input type="password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400" placeholder="Enter new password" /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirm New Password</label><input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-400" placeholder="Confirm new password" /></div>
                <button onClick={changeUserPassword} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">Update Password</button>
              </div>
            </div>
          )}

          {/* STAFF: Entry Forms */}
          {!isAdmin && view === 'entry' && (
            <div className="space-y-4">
              {activeModule === 'daily-recon' && (<>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                  <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" />Daily Cash Can</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date" type="date" value={forms['daily-recon'].date} onChange={e => updateForm('daily-recon', 'date', e.target.value)} />
                    <InputField label="Cash" prefix="$" value={forms['daily-recon'].cash} onChange={e => updateForm('daily-recon', 'cash', e.target.value)} />
                    <InputField label="Credit Card (OTC)" prefix="$" value={forms['daily-recon'].creditCard} onChange={e => updateForm('daily-recon', 'creditCard', e.target.value)} />
                    <InputField label="Checks (OTC)" prefix="$" value={forms['daily-recon'].checksOTC} onChange={e => updateForm('daily-recon', 'checksOTC', e.target.value)} />
                    <InputField label="Insurance Checks" prefix="$" value={forms['daily-recon'].insuranceChecks} onChange={e => updateForm('daily-recon', 'insuranceChecks', e.target.value)} />
                    <InputField label="Care Credit" prefix="$" value={forms['daily-recon'].careCredit} onChange={e => updateForm('daily-recon', 'careCredit', e.target.value)} />
                    <InputField label="VCC" prefix="$" value={forms['daily-recon'].vcc} onChange={e => updateForm('daily-recon', 'vcc', e.target.value)} />
                    <InputField label="EFTs" prefix="$" value={forms['daily-recon'].efts} onChange={e => updateForm('daily-recon', 'efts', e.target.value)} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                  <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" />Bank Deposit</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Cash" prefix="$" value={forms['daily-recon'].depositCash} onChange={e => updateForm('daily-recon', 'depositCash', e.target.value)} />
                    <InputField label="Credit Card" prefix="$" value={forms['daily-recon'].depositCreditCard} onChange={e => updateForm('daily-recon', 'depositCreditCard', e.target.value)} />
                    <InputField label="Checks" prefix="$" value={forms['daily-recon'].depositChecks} onChange={e => updateForm('daily-recon', 'depositChecks', e.target.value)} />
                    <InputField label="Insurance" prefix="$" value={forms['daily-recon'].depositInsurance} onChange={e => updateForm('daily-recon', 'depositInsurance', e.target.value)} />
                    <InputField label="Care Credit" prefix="$" value={forms['daily-recon'].depositCareCredit} onChange={e => updateForm('daily-recon', 'depositCareCredit', e.target.value)} />
                    <InputField label="VCC" prefix="$" value={forms['daily-recon'].depositVCC} onChange={e => updateForm('daily-recon', 'depositVCC', e.target.value)} />
                  </div>
                  <div className="mt-4"><InputField label="Notes" value={forms['daily-recon'].notes} onChange={e => updateForm('daily-recon', 'notes', e.target.value)} /></div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2"><File className="w-5 h-5 text-amber-500" />Documents</h2>
                  <div className="space-y-4">
                    <FileUpload label="EOD Day Sheets" files={files['daily-recon'].eodDaySheets} onFilesChange={f => updateFiles('daily-recon', 'eodDaySheets', f)} onViewFile={setViewingFile} />
                    <FileUpload label="EOD Bank Receipts" files={files['daily-recon'].eodBankReceipts} onFilesChange={f => updateFiles('daily-recon', 'eodBankReceipts', f)} onViewFile={setViewingFile} />
                    <FileUpload label="Other Files" files={files['daily-recon'].otherFiles} onFilesChange={f => updateFiles('daily-recon', 'otherFiles', f)} onViewFile={setViewingFile} />
                  </div>
                </div>
              </>)}

              {activeModule === 'billing-inquiry' && (<>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                  <h2 className="font-semibold mb-4 text-gray-800">Billing Inquiry</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Patient Name" value={forms['billing-inquiry'].patientName} onChange={e => updateForm('billing-inquiry', 'patientName', e.target.value)} />
                    <InputField label="Chart Number" value={forms['billing-inquiry'].chartNumber} onChange={e => updateForm('billing-inquiry', 'chartNumber', e.target.value)} />
                    <InputField label="Date of Service" type="date" value={forms['billing-inquiry'].dateOfService} onChange={e => updateForm('billing-inquiry', 'dateOfService', e.target.value)} />
                    <InputField label="Amount in Question" prefix="$" value={forms['billing-inquiry'].amountInQuestion} onChange={e => updateForm('billing-inquiry', 'amountInQuestion', e.target.value)} />
                    <InputField label="Best Contact Method" value={forms['billing-inquiry'].bestContactMethod} onChange={e => updateForm('billing-inquiry', 'bestContactMethod', e.target.value)} options={['Phone', 'Email', 'Text']} />
                    <InputField label="Best Contact Time" value={forms['billing-inquiry'].bestContactTime} onChange={e => updateForm('billing-inquiry', 'bestContactTime', e.target.value)} />
                    <InputField label="Reviewed By" value={forms['billing-inquiry'].reviewedBy} onChange={e => updateForm('billing-inquiry', 'reviewedBy', e.target.value)} />
                    <InputField label="Initials" value={forms['billing-inquiry'].initials} onChange={e => updateForm('billing-inquiry', 'initials', e.target.value)} />
                    <InputField label="Status" value={forms['billing-inquiry'].status} onChange={e => updateForm('billing-inquiry', 'status', e.target.value)} options={['Pending', 'In Progress', 'Resolved']} />
                    <InputField label="Result" value={forms['billing-inquiry'].result} onChange={e => updateForm('billing-inquiry', 'result', e.target.value)} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6"><FileUpload label="Documentation" files={files['billing-inquiry'].documentation} onFilesChange={f => updateFiles('billing-inquiry', 'documentation', f)} onViewFile={setViewingFile} /></div>
              </>)}

              {activeModule === 'bills-payment' && (<>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                  <h2 className="font-semibold mb-4 text-gray-800">Bills Payment</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Bill Status" value={forms['bills-payment'].billStatus} onChange={e => updateForm('bills-payment', 'billStatus', e.target.value)} options={['Pending', 'Approved', 'Paid']} />
                    <InputField label="Date" type="date" value={forms['bills-payment'].date} onChange={e => updateForm('bills-payment', 'date', e.target.value)} />
                    <InputField label="Vendor" value={forms['bills-payment'].vendor} onChange={e => updateForm('bills-payment', 'vendor', e.target.value)} />
                    <InputField label="Description" value={forms['bills-payment'].description} onChange={e => updateForm('bills-payment', 'description', e.target.value)} />
                    <InputField label="Amount" prefix="$" value={forms['bills-payment'].amount} onChange={e => updateForm('bills-payment', 'amount', e.target.value)} />
                    <InputField label="Due Date" type="date" value={forms['bills-payment'].dueDate} onChange={e => updateForm('bills-payment', 'dueDate', e.target.value)} />
                    <InputField label="Manager Initials" value={forms['bills-payment'].managerInitials} onChange={e => updateForm('bills-payment', 'managerInitials', e.target.value)} />
                    <InputField label="AP Reviewed" value={forms['bills-payment'].apReviewed} onChange={e => updateForm('bills-payment', 'apReviewed', e.target.value)} options={['Yes', 'No']} />
                    <InputField label="Date Reviewed" type="date" value={forms['bills-payment'].dateReviewed} onChange={e => updateForm('bills-payment', 'dateReviewed', e.target.value)} />
                    <InputField label="Paid" value={forms['bills-payment'].paid} onChange={e => updateForm('bills-payment', 'paid', e.target.value)} options={['Yes', 'No']} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6"><FileUpload label="Bills Documentation" files={files['bills-payment'].documentation} onFilesChange={f => updateFiles('bills-payment', 'documentation', f)} onViewFile={setViewingFile} /></div>
              </>)}

              {activeModule === 'order-requests' && (<>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                  <h2 className="font-semibold mb-4 text-gray-800">Order Request</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date Entered" type="date" value={forms['order-requests'].dateEntered} onChange={e => updateForm('order-requests', 'dateEntered', e.target.value)} />
                    <InputField label="Vendor" value={forms['order-requests'].vendor} onChange={e => updateForm('order-requests', 'vendor', e.target.value)} />
                    <InputField label="Invoice Number" value={forms['order-requests'].invoiceNumber} onChange={e => updateForm('order-requests', 'invoiceNumber', e.target.value)} />
                    <InputField label="Invoice Date" type="date" value={forms['order-requests'].invoiceDate} onChange={e => updateForm('order-requests', 'invoiceDate', e.target.value)} />
                    <InputField label="Due Date" type="date" value={forms['order-requests'].dueDate} onChange={e => updateForm('order-requests', 'dueDate', e.target.value)} />
                    <InputField label="Amount" prefix="$" value={forms['order-requests'].amount} onChange={e => updateForm('order-requests', 'amount', e.target.value)} />
                    <InputField label="Entered By" value={forms['order-requests'].enteredBy} onChange={e => updateForm('order-requests', 'enteredBy', e.target.value)} />
                    <InputField label="Notes" value={forms['order-requests'].notes} onChange={e => updateForm('order-requests', 'notes', e.target.value)} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6"><FileUpload label="Order Invoices" files={files['order-requests'].orderInvoices} onFilesChange={f => updateFiles('order-requests', 'orderInvoices', f)} onViewFile={setViewingFile} /></div>
              </>)}

              {activeModule === 'refund-requests' && (<>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                  <h2 className="font-semibold mb-4 text-gray-800">Refund Request</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Patient Name" value={forms['refund-requests'].patientName} onChange={e => updateForm('refund-requests', 'patientName', e.target.value)} />
                    <InputField label="Chart Number" value={forms['refund-requests'].chartNumber} onChange={e => updateForm('refund-requests', 'chartNumber', e.target.value)} />
                    <InputField label="Parent Name" value={forms['refund-requests'].parentName} onChange={e => updateForm('refund-requests', 'parentName', e.target.value)} />
                    <InputField label="RP Address" value={forms['refund-requests'].rpAddress} onChange={e => updateForm('refund-requests', 'rpAddress', e.target.value)} />
                    <InputField label="Date of Request" type="date" value={forms['refund-requests'].dateOfRequest} onChange={e => updateForm('refund-requests', 'dateOfRequest', e.target.value)} />
                    <InputField label="Type" value={forms['refund-requests'].typeTransaction} onChange={e => updateForm('refund-requests', 'typeTransaction', e.target.value)} options={['Refund', 'Credit', 'Adjustment']} />
                    <InputField label="Amount Requested" prefix="$" value={forms['refund-requests'].amountRequested} onChange={e => updateForm('refund-requests', 'amountRequested', e.target.value)} />
                    <InputField label="Contact Method" value={forms['refund-requests'].bestContactMethod} onChange={e => updateForm('refund-requests', 'bestContactMethod', e.target.value)} options={['Phone', 'Email', 'Text']} />
                    <InputField label="Eassist Audited" value={forms['refund-requests'].eassistAudited} onChange={e => updateForm('refund-requests', 'eassistAudited', e.target.value)} options={['Yes', 'No', 'N/A']} />
                    <InputField label="Status" value={forms['refund-requests'].status} onChange={e => updateForm('refund-requests', 'status', e.target.value)} options={['Pending', 'Approved', 'Completed', 'Denied']} />
                    <div className="col-span-2"><InputField label="Description" value={forms['refund-requests'].description} onChange={e => updateForm('refund-requests', 'description', e.target.value)} /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6"><FileUpload label="Documentation" files={files['refund-requests'].documentation} onFilesChange={f => updateFiles('refund-requests', 'documentation', f)} onViewFile={setViewingFile} /></div>
              </>)}

              {activeModule === 'it-requests' && (<>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${currentColors?.accent}`}>
                  <h2 className="font-semibold mb-2 text-gray-800">IT Request</h2>
                  <p className="text-sm text-gray-500 mb-4">Request # will be auto-generated</p>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date Reported" type="date" value={forms['it-requests'].dateReported} onChange={e => updateForm('it-requests', 'dateReported', e.target.value)} />
                    <InputField label="Urgency Level" value={forms['it-requests'].urgencyLevel} onChange={e => updateForm('it-requests', 'urgencyLevel', e.target.value)} options={['Low', 'Medium', 'High', 'Critical']} />
                    <InputField label="Requester Name" value={forms['it-requests'].requesterName} onChange={e => updateForm('it-requests', 'requesterName', e.target.value)} />
                    <InputField label="Device / System" value={forms['it-requests'].deviceSystem} onChange={e => updateForm('it-requests', 'deviceSystem', e.target.value)} />
                    <InputField label="Contact Method" value={forms['it-requests'].bestContactMethod} onChange={e => updateForm('it-requests', 'bestContactMethod', e.target.value)} options={['Phone', 'Email', 'Text']} />
                    <InputField label="Contact Time" value={forms['it-requests'].bestContactTime} onChange={e => updateForm('it-requests', 'bestContactTime', e.target.value)} />
                  </div>
                  <div className="mt-4"><InputField label="Description of Issue" large value={forms['it-requests'].descriptionOfIssue} onChange={e => updateForm('it-requests', 'descriptionOfIssue', e.target.value)} placeholder="Describe the issue in detail..." /></div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6"><FileUpload label="Documentation" files={files['it-requests'].documentation} onFilesChange={f => updateFiles('it-requests', 'documentation', f)} onViewFile={setViewingFile} /></div>
              </>)}

              <button onClick={() => saveEntry(activeModule)} disabled={saving} className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}>
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Entry'}
              </button>
            </div>
          )}

          {/* STAFF: History */}
          {!isAdmin && view === 'history' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="font-semibold mb-4 text-gray-800">Your Entries <span className="text-sm font-normal text-gray-500">({entries.length})</span></h2>
              {entries.length === 0 ? <p className="text-gray-500 text-center py-8">No entries yet</p> : (
                <div className="space-y-2">{entries.slice(0, 30).map(e => (
                  <div key={e.id} className={`p-4 rounded-xl flex justify-between items-center ${currentColors?.bg} border ${currentColors?.border}`}>
                    <div><p className="font-medium text-gray-800">{e.requestNumber || e.timestamp?.split('T')[0]}</p><p className="text-xs text-gray-500">{e.enteredBy}</p></div>
                    <div className="text-right">{e.total && <p className="font-bold text-emerald-600">${e.total.toFixed(2)}</p>}<StatusBadge status={e.status || e.billStatus} /></div>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {/* STAFF: Export */}
          {!isAdmin && view === 'export' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center"><Download className="w-6 h-6 text-white" /></div>
                <div><h2 className="font-semibold text-gray-800">Export Your Data</h2><p className="text-sm text-gray-500">Download your records as CSV</p></div>
              </div>
              <div className="mb-6">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Date Range</label>
                <select value={exportRange} onChange={e => setExportRange(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none">{DATE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}</select>
              </div>
              <button onClick={exportToCSV} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"><Download className="w-5 h-5" />Export to CSV</button>
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
