'use client';
import { useState, useEffect } from 'react';
import { DollarSign, FileText, Building2, Bot, Send, Loader2, LogOut, User, Upload, X, File, Shield, Receipt, CreditCard, Package, RefreshCw, Monitor, Menu, Eye, FolderOpen, Edit3, Users, Plus, Trash2, Lock, Download, Calendar, Filter, Settings } from 'lucide-react';

const LOCATIONS = ['Pearl City', 'OS', 'Ortho', 'Lihue', 'Kapolei', 'Kailua', 'Honolulu', 'HHDS'];
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const MODULES = [
  { id: 'daily-recon', name: 'Daily Recon', icon: DollarSign },
  { id: 'billing-inquiry', name: 'Billing Inquiry', icon: Receipt },
  { id: 'bills-payment', name: 'Bills Payment', icon: CreditCard },
  { id: 'order-requests', name: 'Order Requests', icon: Package },
  { id: 'refund-requests', name: 'Refund Requests', icon: RefreshCw },
  { id: 'it-requests', name: 'IT Requests', icon: Monitor },
];

const IT_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const DATE_RANGES = ['This Week', 'Last 2 Weeks', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Custom'];

// Components
function InputField({ label, value, onChange, type = 'text', placeholder = '', prefix, options, large }) {
  if (options) {
    return (
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-blue-400">
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (large) {
    return (
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">{label}</label>
        <textarea value={value} onChange={onChange} rows={4} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-blue-400 resize-none" placeholder={placeholder} />
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center border-2 rounded-lg bg-white focus-within:border-blue-400">
        {prefix && <span className="px-2 text-gray-400">{prefix}</span>}
        <input type={type} value={value} onChange={onChange} className="w-full p-2.5 rounded-lg outline-none" placeholder={placeholder} />
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
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      <div className="border-2 border-dashed rounded-lg p-3 bg-gray-50">
        <label className="flex items-center justify-center gap-2 cursor-pointer text-gray-500 hover:text-blue-600">
          <Upload className="w-4 h-4" /><span className="text-sm">Click to upload</span>
          <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
        </label>
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                <div className="flex items-center gap-2 truncate flex-1">
                  <File className="w-4 h-4 text-blue-500" /><span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {file.url && <button onClick={() => onViewFile(file)} className="p-1 text-blue-500 hover:text-blue-700"><Eye className="w-4 h-4" /></button>}
                  <button onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))} className="p-1 text-red-500"><X className="w-4 h-4" /></button>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h3 className="font-semibold truncate">{file.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          {isImage ? <img src={file.url} alt={file.name} className="max-w-full rounded-lg mx-auto" /> : (
            <div className="text-center py-8 text-gray-500">
              <File className="w-16 h-16 mx-auto mb-4" /><p>Preview not available</p>
              <a href={file.url} download={file.name} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { 'Open': 'bg-red-100 text-red-700', 'In Progress': 'bg-yellow-100 text-yellow-700', 'Resolved': 'bg-green-100 text-green-700', 'Closed': 'bg-gray-100 text-gray-700', 'Pending': 'bg-yellow-100 text-yellow-700', 'Approved': 'bg-blue-100 text-blue-700', 'Completed': 'bg-green-100 text-green-700', 'Paid': 'bg-green-100 text-green-700' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status || 'N/A'}</span>;
}

export default function ClinicSystem() {
  // Auth & User State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMode, setLoginMode] = useState('staff');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // App State
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
  
  // User Management State
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', locations: [] });
  
  // Admin Password
  const [adminPwd, setAdminPwd] = useState(DEFAULT_ADMIN_PASSWORD);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  
  // Export State
  const [exportSystem, setExportSystem] = useState('daily-recon');
  const [exportLocation, setExportLocation] = useState('all');
  const [exportRange, setExportRange] = useState('This Month');
  
  // AI Chat
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', content: "Hi! I can help with data summaries. Try:\n• \"Weekly summary\"\n• \"IT requests status\"\n• \"Compare locations\"" }]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Forms
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

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem('clinic-users', JSON.stringify(newUsers));
  };

  const handleStaffLogin = () => {
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      if (user.locations.length === 1) setSelectedLocation(user.locations[0]);
      setMessage('');
    } else {
      setMessage('Invalid email or password');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === adminPwd) {
      setIsAdmin(true);
      setCurrentUser({ name: 'Admin', isAdmin: true });
    } else {
      setMessage('Invalid admin password');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setSelectedLocation(null);
    setLoginEmail('');
    setLoginPassword('');
    setAdminPassword('');
    setView('entry');
    setAdminView('records');
    setPwdForm({ current: '', new: '', confirm: '' });
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password || newUser.locations.length === 0) {
      setMessage('Please fill all fields and select at least one location');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const user = { ...newUser, id: Date.now().toString() };
    saveUsers([...users, user]);
    setNewUser({ name: '', email: '', password: '', locations: [] });
    setShowAddUser(false);
    setMessage('✓ User added!');
    setTimeout(() => setMessage(''), 3000);
  };

  const updateUser = () => {
    if (!editingUser.name || !editingUser.email || editingUser.locations.length === 0) {
      setMessage('Please fill all fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    saveUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    setMessage('✓ User updated!');
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteUser = (id) => {
    if (confirm('Delete this user?')) {
      saveUsers(users.filter(u => u.id !== id));
      setMessage('✓ User deleted');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const changeAdminPassword = () => {
    if (pwdForm.current !== adminPwd) {
      setMessage('Current password is incorrect');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (pwdForm.new.length < 4) {
      setMessage('New password must be at least 4 characters');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setMessage('New passwords do not match');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    localStorage.setItem('admin-password', pwdForm.new);
    setAdminPwd(pwdForm.new);
    setPwdForm({ current: '', new: '', confirm: '' });
    setMessage('✓ Password changed successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const changeUserPassword = () => {
    if (pwdForm.current !== currentUser.password) {
      setMessage('Current password is incorrect');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (pwdForm.new.length < 4) {
      setMessage('New password must be at least 4 characters');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setMessage('New passwords do not match');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, password: pwdForm.new } : u);
    saveUsers(updatedUsers);
    setCurrentUser({ ...currentUser, password: pwdForm.new });
    setPwdForm({ current: '', new: '', confirm: '' });
    setMessage('✓ Password changed successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleUserLocation = (loc, isEditing = false) => {
    if (isEditing) {
      const locs = editingUser.locations.includes(loc) ? editingUser.locations.filter(l => l !== loc) : [...editingUser.locations, loc];
      setEditingUser({ ...editingUser, locations: locs });
    } else {
      const locs = newUser.locations.includes(loc) ? newUser.locations.filter(l => l !== loc) : [...newUser.locations, loc];
      setNewUser({ ...newUser, locations: locs });
    }
  };

  const updateForm = (module, field, value) => {
    setForms(prev => ({ ...prev, [module]: { ...prev[module], [field]: value } }));
  };

  const updateFiles = (module, field, newFiles) => {
    setFiles(prev => ({ ...prev, [module]: { ...prev[module], [field]: newFiles } }));
  };

  const saveEntry = async (module) => {
    setSaving(true);
    const form = forms[module];
    const fileData = files[module];
    
    const entry = {
      ...form,
      files: Object.fromEntries(Object.entries(fileData).map(([k, v]) => [k, v.map(f => ({ name: f.name, type: f.type, url: f.url }))])),
      location: selectedLocation,
      enteredBy: currentUser.name,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}`
    };

    if (module === 'daily-recon') {
      entry.total = ['cash', 'creditCard', 'checksOTC', 'insuranceChecks', 'careCredit', 'vcc', 'efts'].reduce((s, f) => s + (parseFloat(form[f]) || 0), 0);
      entry.depositTotal = ['depositCash', 'depositCreditCard', 'depositChecks', 'depositInsurance', 'depositCareCredit', 'depositVCC'].reduce((s, f) => s + (parseFloat(form[f]) || 0), 0);
    }

    if (module === 'it-requests') {
      entry.requestNumber = `IT-${itCounter}`;
      entry.status = 'Open';
      setItCounter(itCounter + 1);
      localStorage.setItem('it-counter', (itCounter + 1).toString());
    }

    const current = allData[module] || [];
    const updated = [entry, ...current].slice(0, 500);
    localStorage.setItem(`clinic-${module}`, JSON.stringify(updated));
    setAllData(prev => ({ ...prev, [module]: updated }));
    setMessage('✓ Entry saved!');
    setTimeout(() => setMessage(''), 3000);

    const resetForm = { ...forms[module] };
    Object.keys(resetForm).forEach(k => { if (!k.includes('date') && !k.includes('Date')) resetForm[k] = ''; });
    setForms(prev => ({ ...prev, [module]: resetForm }));
    setFiles(prev => ({ ...prev, [module]: Object.fromEntries(Object.entries(files[module]).map(([k]) => [k, []])) }));
    setSaving(false);
  };

  const updateITStatus = (entryId, newStatus, resolutionNotes = '') => {
    const current = allData['it-requests'] || [];
    const updated = current.map(e => e.id === entryId ? { ...e, status: newStatus, resolutionNotes, completedBy: 'Admin', statusUpdatedAt: new Date().toISOString() } : e);
    localStorage.setItem('clinic-it-requests', JSON.stringify(updated));
    setAllData(prev => ({ ...prev, 'it-requests': updated }));
    setEditingStatus(null);
    setMessage('✓ Status updated!');
    setTimeout(() => setMessage(''), 3000);
  };

  const exportToCSV = () => {
    const entries = allData[exportSystem] || [];
    let filtered = entries;
    if (exportLocation !== 'all') filtered = filtered.filter(e => e.location === exportLocation);
    
    if (filtered.length === 0) { setMessage('No data to export'); setTimeout(() => setMessage(''), 3000); return; }
    
    const headers = Object.keys(filtered[0]).filter(k => k !== 'files');
    const csv = [headers.join(','), ...filtered.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportSystem}_${exportLocation}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setMessage('✓ Export complete!');
    setTimeout(() => setMessage(''), 3000);
  };

  const askAI = async () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    setChatInput('');
    setAiLoading(true);
    let dataSummary = '';
    MODULES.forEach(m => {
      const entries = allData[m.id] || [];
      dataSummary += `\n${m.name}: ${entries.length} entries`;
    });
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: chatInput }], dataSummary }) });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || 'Sorry, error occurred.' }]);
    } catch (e) { setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI.' }]); }
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
    MODULES.forEach(m => {
      (allData[m.id] || []).forEach(entry => {
        if (entry.files) {
          Object.entries(entry.files).forEach(([cat, fileList]) => {
            (fileList || []).forEach(file => {
              docs.push({ ...file, module: m.name, location: entry.location, entryDate: entry.timestamp?.split('T')[0], enteredBy: entry.enteredBy, category: cat });
            });
          });
        }
      });
    });
    return docs;
  };

  // ========== LOGIN SCREEN ==========
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Clinic System</h1>
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setLoginMode('staff')} className={`flex-1 py-2 rounded-lg font-medium ${loginMode === 'staff' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Staff</button>
            <button onClick={() => setLoginMode('admin')} className={`flex-1 py-2 rounded-lg font-medium ${loginMode === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}><Shield className="w-4 h-4 inline mr-1" />Admin</button>
          </div>

          {message && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{message}</div>}

          {loginMode === 'staff' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email / Username</label>
                <input type="text" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 border-2 rounded-xl outline-none" placeholder="Enter email" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStaffLogin()} className="w-full p-3 border-2 rounded-xl outline-none" placeholder="Enter password" />
              </div>
              <button onClick={handleStaffLogin} className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700">Login →</button>
              <p className="text-xs text-center text-gray-400">Demo: demo / 1234</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Admin Password</label>
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} className="w-full p-3 border-2 rounded-xl outline-none" placeholder="Enter admin password" />
              </div>
              <button onClick={handleAdminLogin} className="w-full py-4 bg-purple-600 text-white rounded-xl text-lg font-semibold hover:bg-purple-700">Login →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== LOCATION SELECTOR (for multi-location users) ==========
  if (!isAdmin && !selectedLocation && currentUser.locations.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Welcome, {currentUser.name}</h1>
            <p className="text-gray-500">Select your location</p>
          </div>
          <div className="space-y-2">
            {currentUser.locations.map(loc => (
              <button key={loc} onClick={() => setSelectedLocation(loc)} className="w-full p-4 border-2 rounded-xl text-left hover:bg-blue-50 hover:border-blue-400 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{loc}</span>
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="w-full mt-6 py-2 text-gray-500 hover:text-gray-700">← Back to Login</button>
        </div>
      </div>
    );
  }

  const currentModule = MODULES.find(m => m.id === activeModule);
  const entries = getModuleEntries(activeModule);
  const allDocs = getAllDocuments();

  // ========== MAIN APP ==========
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isAdmin ? 'bg-purple-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center`}>
              {isAdmin ? <Shield className="w-5 h-5 text-purple-600" /> : <User className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : selectedLocation}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 border-b">
            <label className="text-xs text-gray-500">Filter Location</label>
            <select value={adminLocation} onChange={e => setAdminLocation(e.target.value)} className="w-full mt-1 p-2 border rounded-lg text-sm">
              <option value="all">All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        {!isAdmin && currentUser.locations.length > 1 && (
          <div className="p-4 border-b">
            <label className="text-xs text-gray-500">Switch Location</label>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full mt-1 p-2 border rounded-lg text-sm">
              {currentUser.locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        <nav className="p-4 space-y-1">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => { setActiveModule(m.id); setAdminView('records'); setView('entry'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${activeModule === m.id && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' && view !== 'export' && view !== 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <m.icon className="w-5 h-5" /><span className="text-sm font-medium">{m.name}</span>
            </button>
          ))}
          
          <div className="border-t my-3"></div>
          
          {isAdmin ? (
            <>
              <button onClick={() => { setAdminView('users'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${adminView === 'users' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Users className="w-5 h-5" /><span className="text-sm font-medium">Users</span>
              </button>
              <button onClick={() => { setAdminView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${adminView === 'export' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Download className="w-5 h-5" /><span className="text-sm font-medium">Export</span>
              </button>
            </>
          ) : (
            <button onClick={() => { setView('export'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${view === 'export' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Download className="w-5 h-5" /><span className="text-sm font-medium">Export</span>
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          {isAdmin && (
            <button onClick={() => { setAdminView('settings'); setSidebarOpen(false); }} className={`w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg ${adminView === 'settings' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Settings className="w-4 h-4" /> Settings
            </button>
          )}
          {!isAdmin && (
            <button onClick={() => { setView('settings'); setSidebarOpen(false); }} className={`w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg ${view === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Settings className="w-4 h-4" /> Settings
            </button>
          )}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2"><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="font-bold text-gray-800">{isAdmin ? (adminView === 'users' ? 'User Management' : adminView === 'export' ? 'Export Data' : adminView === 'settings' ? 'Settings' : currentModule?.name) : (view === 'settings' ? 'Settings' : currentModule?.name)}</h1>
                <p className="text-xs text-gray-500">{isAdmin ? `${adminLocation === 'all' ? 'All Locations' : adminLocation}` : selectedLocation}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
            {isAdmin && adminView !== 'users' && adminView !== 'export' && adminView !== 'settings' ? (
              [{ id: 'records', label: 'Records', icon: FileText }, { id: 'documents', label: 'Documents', icon: FolderOpen }, { id: 'ai', label: 'AI Help', icon: Bot }].map(tab => (
                <button key={tab.id} onClick={() => setAdminView(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${adminView === tab.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                </button>
              ))
            ) : !isAdmin && view !== 'settings' ? (
              [{ id: 'entry', label: 'New Entry' }, { id: 'history', label: 'History' }, { id: 'ai', label: 'AI Help' }].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{tab.label}</button>
              ))
            ) : null}
          </div>
        </header>

        {message && <div className="mx-4 mt-4 p-3 bg-green-100 text-green-700 rounded-xl text-center font-medium">{message}</div>}

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
          {/* ========== ADMIN VIEWS ========== */}
          {isAdmin && adminView === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">{users.length} Users</h2>
                <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus className="w-4 h-4" />Add User</button>
              </div>

              {/* Add/Edit User Modal */}
              {(showAddUser || editingUser) && (
                <div className="bg-white rounded-2xl shadow-sm p-5 border">
                  <h3 className="font-semibold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Name" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                    <InputField label="Email / Username" value={editingUser ? editingUser.email : newUser.email} onChange={e => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} />
                    <div className="col-span-2">
                      <InputField label={editingUser ? "New Password (leave blank to keep)" : "Password"} type="password" value={editingUser ? (editingUser.newPassword || '') : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, newPassword: e.target.value, password: e.target.value || editingUser.password}) : setNewUser({...newUser, password: e.target.value})} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs text-gray-500 mb-2 block">Assigned Locations</label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATIONS.map(loc => (
                        <button key={loc} onClick={() => toggleUserLocation(loc, !!editingUser)} className={`px-3 py-1.5 rounded-full text-sm ${(editingUser ? editingUser.locations : newUser.locations).includes(loc) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{loc}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={editingUser ? updateUser : addUser} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium">{editingUser ? 'Update' : 'Add'} User</button>
                    <button onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="divide-y">
                  {users.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.locations.map(loc => <span key={loc} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{loc}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingUser(u)} className="p-2 text-gray-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isAdmin && adminView === 'documents' && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><FolderOpen className="w-5 h-5" />Document Storage ({allDocs.length} files)</h2>
              {allDocs.length === 0 ? <p className="text-gray-500">No documents uploaded yet</p> : (
                <div className="space-y-2">
                  {allDocs.slice(0, 50).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-8 h-8 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.module} • {doc.location} • {doc.entryDate}</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingFile(doc)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                        <Eye className="w-4 h-4" />View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && adminView === 'export' && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border">
              <p className="text-sm text-gray-500 mb-4">Select system, location, and date range to export data as CSV.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">System</label>
                  <select value={exportSystem} onChange={e => setExportSystem(e.target.value)} className="w-full p-2.5 border-2 rounded-lg">
                    {MODULES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Location</label>
                  <select value={exportLocation} onChange={e => setExportLocation(e.target.value)} className="w-full p-2.5 border-2 rounded-lg">
                    <option value="all">All Locations</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
                  <select value={exportRange} onChange={e => setExportRange(e.target.value)} className="w-full p-2.5 border-2 rounded-lg">
                    {DATE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={exportToCSV} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />Export to CSV
              </button>
            </div>
          )}

          {isAdmin && adminView === 'settings' && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Lock className="w-5 h-5" />Change Admin Password</h2>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Current Password</label>
                  <input type="password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-purple-400" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                  <input type="password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-purple-400" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Confirm New Password</label>
                  <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-purple-400" placeholder="Confirm new password" />
                </div>
                <button onClick={changeAdminPassword} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {isAdmin && adminView === 'records' && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">All Records - {currentModule?.name}</h2>
                <span className="text-sm text-gray-500">{entries.length} entries</span>
              </div>
              {entries.length === 0 ? <p className="text-gray-500">No entries yet</p> : (
                <div className="space-y-3">
                  {entries.slice(0, 50).map(e => (
                    <div key={e.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{e.requestNumber || e.timestamp?.split('T')[0]}</p>
                            <StatusBadge status={e.status || e.billStatus} />
                          </div>
                          <p className="text-sm text-gray-600">{e.location} • {e.enteredBy}</p>
                          {e.descriptionOfIssue && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{e.descriptionOfIssue}</p>}
                          {getFileCount(e) > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(e.files || {}).map(([cat, fileList]) => (fileList || []).map((file, i) => (
                                <button key={`${cat}-${i}`} onClick={() => setViewingFile(file)} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  <Eye className="w-3 h-3" />{file.name?.slice(0, 15)}...
                                </button>
                              )))}
                            </div>
                          )}
                        </div>
                        {activeModule === 'it-requests' && (
                          <div>
                            {editingStatus === e.id ? (
                              <div className="space-y-2 w-40">
                                <select defaultValue={e.status} id={`status-${e.id}`} className="w-full p-2 border rounded text-sm">
                                  {IT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <input type="text" id={`notes-${e.id}`} placeholder="Resolution notes" className="w-full p-2 border rounded text-sm" />
                                <div className="flex gap-1">
                                  <button onClick={() => updateITStatus(e.id, document.getElementById(`status-${e.id}`).value, document.getElementById(`notes-${e.id}`).value)} className="flex-1 py-1 bg-green-600 text-white rounded text-xs">Save</button>
                                  <button onClick={() => setEditingStatus(null)} className="px-2 py-1 bg-gray-200 rounded text-xs">X</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setEditingStatus(e.id)} className="text-xs text-purple-600 flex items-center gap-1"><Edit3 className="w-3 h-3" />Update</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && adminView === 'ai' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
                <h2 className="font-semibold flex items-center gap-2"><Bot className="w-5 h-5" />AI Assistant</h2>
              </div>
              <div className="h-72 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-start"><div className="bg-gray-100 p-3 rounded-2xl"><Loader2 className="w-5 h-5 animate-spin" /></div></div>}
              </div>
              <div className="p-3 border-t flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask anything..." className="flex-1 p-3 border rounded-xl outline-none" />
                <button onClick={askAI} disabled={aiLoading} className="px-4 bg-purple-600 text-white rounded-xl"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* ========== STAFF VIEWS ========== */}
          {!isAdmin && view === 'settings' && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Lock className="w-5 h-5" />Change Password</h2>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Current Password</label>
                  <input type="password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-blue-400" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                  <input type="password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-blue-400" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Confirm New Password</label>
                  <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full p-2.5 border-2 rounded-lg outline-none focus:border-blue-400" placeholder="Confirm new password" />
                </div>
                <button onClick={changeUserPassword} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {!isAdmin && view === 'entry' && (
            <div className="space-y-4">
              {activeModule === 'daily-recon' && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Daily Cash Can</h2>
                    <div className="grid grid-cols-2 gap-3">
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
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Bank Deposit</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Cash" prefix="$" value={forms['daily-recon'].depositCash} onChange={e => updateForm('daily-recon', 'depositCash', e.target.value)} />
                      <InputField label="Credit Card" prefix="$" value={forms['daily-recon'].depositCreditCard} onChange={e => updateForm('daily-recon', 'depositCreditCard', e.target.value)} />
                      <InputField label="Checks" prefix="$" value={forms['daily-recon'].depositChecks} onChange={e => updateForm('daily-recon', 'depositChecks', e.target.value)} />
                      <InputField label="Insurance" prefix="$" value={forms['daily-recon'].depositInsurance} onChange={e => updateForm('daily-recon', 'depositInsurance', e.target.value)} />
                      <InputField label="Care Credit" prefix="$" value={forms['daily-recon'].depositCareCredit} onChange={e => updateForm('daily-recon', 'depositCareCredit', e.target.value)} />
                      <InputField label="VCC" prefix="$" value={forms['daily-recon'].depositVCC} onChange={e => updateForm('daily-recon', 'depositVCC', e.target.value)} />
                    </div>
                    <div className="mt-3"><InputField label="Notes" value={forms['daily-recon'].notes} onChange={e => updateForm('daily-recon', 'notes', e.target.value)} /></div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Documents</h2>
                    <div className="space-y-4">
                      <FileUpload label="EOD Day Sheets" files={files['daily-recon'].eodDaySheets} onFilesChange={f => updateFiles('daily-recon', 'eodDaySheets', f)} onViewFile={setViewingFile} />
                      <FileUpload label="EOD Bank Receipts" files={files['daily-recon'].eodBankReceipts} onFilesChange={f => updateFiles('daily-recon', 'eodBankReceipts', f)} onViewFile={setViewingFile} />
                      <FileUpload label="Other Files" files={files['daily-recon'].otherFiles} onFilesChange={f => updateFiles('daily-recon', 'otherFiles', f)} onViewFile={setViewingFile} />
                    </div>
                  </div>
                </>
              )}

              {activeModule === 'billing-inquiry' && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Billing Inquiry</h2>
                    <div className="grid grid-cols-2 gap-3">
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
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <FileUpload label="Documentation Billing Inquiry" files={files['billing-inquiry'].documentation} onFilesChange={f => updateFiles('billing-inquiry', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'bills-payment' && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Bills Payment</h2>
                    <div className="grid grid-cols-2 gap-3">
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
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <FileUpload label="Bills Documentation" files={files['bills-payment'].documentation} onFilesChange={f => updateFiles('bills-payment', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'order-requests' && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Order Request</h2>
                    <div className="grid grid-cols-2 gap-3">
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
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <FileUpload label="Order Invoices" files={files['order-requests'].orderInvoices} onFilesChange={f => updateFiles('order-requests', 'orderInvoices', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'refund-requests' && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">Refund Request</h2>
                    <div className="grid grid-cols-2 gap-3">
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
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <FileUpload label="Documentation Refund Request" files={files['refund-requests'].documentation} onFilesChange={f => updateFiles('refund-requests', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              {activeModule === 'it-requests' && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <h2 className="font-semibold mb-4">IT Request</h2>
                    <p className="text-sm text-gray-500 mb-4">Request # will be auto-generated</p>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Date Reported" type="date" value={forms['it-requests'].dateReported} onChange={e => updateForm('it-requests', 'dateReported', e.target.value)} />
                      <InputField label="Urgency Level" value={forms['it-requests'].urgencyLevel} onChange={e => updateForm('it-requests', 'urgencyLevel', e.target.value)} options={['Low', 'Medium', 'High', 'Critical']} />
                      <InputField label="Requester Name" value={forms['it-requests'].requesterName} onChange={e => updateForm('it-requests', 'requesterName', e.target.value)} />
                      <InputField label="Device / System" value={forms['it-requests'].deviceSystem} onChange={e => updateForm('it-requests', 'deviceSystem', e.target.value)} />
                      <InputField label="Contact Method" value={forms['it-requests'].bestContactMethod} onChange={e => updateForm('it-requests', 'bestContactMethod', e.target.value)} options={['Phone', 'Email', 'Text']} />
                      <InputField label="Contact Time" value={forms['it-requests'].bestContactTime} onChange={e => updateForm('it-requests', 'bestContactTime', e.target.value)} />
                    </div>
                    <div className="mt-3"><InputField label="Description of Issue" large value={forms['it-requests'].descriptionOfIssue} onChange={e => updateForm('it-requests', 'descriptionOfIssue', e.target.value)} placeholder="Describe the issue in detail..." /></div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5 border">
                    <FileUpload label="Documentation IT Requests" files={files['it-requests'].documentation} onFilesChange={f => updateFiles('it-requests', 'documentation', f)} onViewFile={setViewingFile} />
                  </div>
                </>
              )}

              <button onClick={() => saveEntry(activeModule)} disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          )}

          {!isAdmin && view === 'history' && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border">
              <h2 className="font-semibold mb-4">Your Entries ({entries.length})</h2>
              {entries.length === 0 ? <p className="text-gray-500">No entries yet</p> : (
                <div className="space-y-2">
                  {entries.slice(0, 30).map(e => (
                    <div key={e.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-medium">{e.requestNumber || e.timestamp?.split('T')[0]}</p>
                        <p className="text-xs text-gray-500">{e.enteredBy}</p>
                      </div>
                      <div className="text-right">
                        {e.total && <p className="font-semibold">${e.total.toFixed(2)}</p>}
                        <StatusBadge status={e.status || e.billStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isAdmin && view === 'ai' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <h2 className="font-semibold flex items-center gap-2"><Bot className="w-5 h-5" />AI Assistant</h2>
              </div>
              <div className="h-72 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-start"><div className="bg-gray-100 p-3 rounded-2xl"><Loader2 className="w-5 h-5 animate-spin" /></div></div>}
              </div>
              <div className="p-3 border-t flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask anything..." className="flex-1 p-3 border rounded-xl outline-none" />
                <button onClick={askAI} disabled={aiLoading} className="px-4 bg-blue-600 text-white rounded-xl"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
